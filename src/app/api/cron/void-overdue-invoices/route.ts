import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { voidOverdueOrderInvoices } from "@/lib/invoice-orders";
import { updateOrder } from "@/lib/orders";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Vercel's cron calls with `Authorization: Bearer <CRON_SECRET>`; anyone else - or no secret set - is refused. */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * `GET` - once a day (`vercel.json` → `crons`): voids the site's order invoices still unpaid three days after their due
 * date and marks their orders "not completed" (`voidOverdueOrderInvoices`, `lib/invoice-orders.ts`). Returns how many.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ voided: 0 });
  const voided = await voidOverdueOrderInvoices(stripe, new Date(), async ({ orderId }) => updateOrder(orderId, { status: "expired" }));
  return NextResponse.json({ voided: voided.length }, { headers: { "cache-control": "no-store" } });
}
