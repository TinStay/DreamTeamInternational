import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamUser } from "@/lib/team";
import { customerFor } from "@/lib/stripe-customers";
import { invoiceSummary, listInvoices, parseAddress, parseInvoiceDraft, sendCustomInvoice } from "@/lib/invoices";
import { taxEnabled } from "@/lib/stripe-tax";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";

export const runtime = "nodejs";

// Each invoice is a handful of Stripe calls and an email to a client - a few a minute per team member is plenty.
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

/** `GET ?userId=` - a client's invoices (the team's client window). */
export async function GET(request: Request) {
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const member = await teamMember();
  if (member instanceof NextResponse) return member;

  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!UUID.test(userId)) return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", userId).maybeSingle();
  const customer = profile?.stripe_customer_id ? String(profile.stripe_customer_id) : null;
  if (!customer) return NextResponse.json({ invoices: [], hasAddress: false });

  const [invoices, found] = await Promise.all([listInvoices(stripe, customer), stripe.customers.retrieve(customer).catch(() => null)]);
  const hasAddress = Boolean(found && !("deleted" in found && found.deleted) && found.address?.country);
  return NextResponse.json({ invoices, hasAddress });
}

/**
 * `POST { userId, lines: [{ description, amountCents }], daysUntilDue, memo, address? }` - the team bills a client for a
 * custom quote: a Stripe invoice in USD, tax-exclusive, Stripe Tax on top when it is on (`lib/stripe-tax.ts`), finalized
 * and emailed by Stripe; the client pays it on Stripe's hosted page and sees it on their account. A billing address, when
 * given, is saved to the client's Stripe customer first - with tax on, an invoice cannot be taxed without one.
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });
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
    const customer = await customerFor(stripe, userId);
    if (!customer) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    if (address) {
      await stripe.customers.update(customer, { address });
    } else if (taxEnabled()) {
      const found = await stripe.customers.retrieve(customer);
      if ("deleted" in found && found.deleted) return NextResponse.json({ error: "invalid_client" }, { status: 404 });
      if (!found.address?.country) return NextResponse.json({ error: "address_required" }, { status: 400 });
    }
    const invoice = await sendCustomInvoice(stripe, customer, userId, draft, member.id);
    return NextResponse.json({ invoice: invoiceSummary(invoice) });
  } catch (err) {
    // Stripe's own reason (an address it cannot tax, a tax setting not active…) is what the team needs to fix it.
    if (err instanceof Stripe.errors.StripeError) return NextResponse.json({ error: "stripe", message: err.message }, { status: 502 });
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
