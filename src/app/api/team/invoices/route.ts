import { NextResponse } from "next/server";
import { paddleConfigured, PaddleError } from "@/lib/paddle";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamUser } from "@/lib/team";
import { addAddress, addressIdFor, customerFor } from "@/lib/paddle-customers";
import { invoiceSummary, listInvoices, parseAddress, parseInvoiceDraft, sendCustomInvoice } from "@/lib/invoices";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";

export const runtime = "nodejs";

// Each invoice is a handful of Paddle calls and an email to a client - a few a minute per team member is plenty.
const isRateLimited = createRateLimiter(60_000, 6);
const UUID = /^[0-9a-f-]{36}$/i;

/** The signed-in team member, or the response to send instead. */
async function teamMember(): Promise<{ id: string } | NextResponse> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (!isTeamUser(auth.user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return { id: auth.user.id };
}

/** `GET ?userId=` - a client's invoices (the team's client window), and whether Paddle has a billing address for them. */
export async function GET(request: Request) {
  const admin = createAdminClient();
  if (!paddleConfigured() || !admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const member = await teamMember();
  if (member instanceof NextResponse) return member;

  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!UUID.test(userId)) return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  const { data: profile } = await admin.from("profiles").select("paddle_customer_id").eq("id", userId).maybeSingle();
  const customer = profile?.paddle_customer_id ? String(profile.paddle_customer_id) : null;
  if (!customer) return NextResponse.json({ invoices: [], hasAddress: false });

  const [invoices, addressId] = await Promise.all([listInvoices(customer).catch(() => []), addressIdFor(customer)]);
  return NextResponse.json({ invoices, hasAddress: Boolean(addressId) });
}

/**
 * `POST { userId, lines: [{ description, amountCents }], daysUntilDue, memo, address? }` - the team bills a client for a
 * custom quote: a Paddle invoice in USD, tax-exclusive (Paddle adds the tax), issued and emailed by Paddle; the client pays
 * it through Paddle's checkout link and sees it on their account. Paddle needs a billing address on an invoice, so one
 * given here is added to the client's customer first - and without one on file the invoice cannot be sent.
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  if (!paddleConfigured() || !admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const member = await teamMember();
  if (member instanceof NextResponse) return member;
  if (isRateLimited(member.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { userId?: unknown; address?: unknown };
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!UUID.test(userId)) return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  const draft = parseInvoiceDraft(body);
  if (!draft) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const hasAddressInput = body.address != null && Object.values(body.address as object).some((v) => typeof v === "string" && v.trim());
  const address = hasAddressInput ? parseAddress(body.address) : null;
  if (hasAddressInput && !address) return NextResponse.json({ error: "invalid_address" }, { status: 400 });

  const { data: client } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!client) return NextResponse.json({ error: "invalid_client" }, { status: 404 });

  try {
    const customer = await customerFor(userId);
    if (!customer) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    const addressId = address ? await addAddress(customer, address) : await addressIdFor(customer);
    if (!addressId) return NextResponse.json({ error: "address_required" }, { status: 400 });
    const invoice = await sendCustomInvoice(customer, addressId, userId, draft, member.id);
    return NextResponse.json({ invoice: invoiceSummary(invoice) });
  } catch (err) {
    // Paddle's own reason (an address it cannot use, a tax category not enabled…) is what the team needs to fix it.
    if (err instanceof PaddleError) return NextResponse.json({ error: "paddle", message: err.message }, { status: 502 });
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
