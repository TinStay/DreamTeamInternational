import { NextResponse } from "next/server";
import { checkoutFor, isBilling } from "@/lib/checkout";
import { getDictionary } from "@/lib/i18n/config";
import { getStripe, paymentsPaused, purchaseFlow } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { hasLiveSubscription } from "@/lib/subscriptions";
import { createPendingOrder, updateOrder } from "@/lib/orders";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";
import { customerFor } from "@/lib/stripe-customers";
import { applyInvoiceProfile } from "@/lib/invoice-profiles";
import { checkoutConsent, checkoutStudioParams, checkoutTaxAndInvoice, lineTax } from "@/lib/stripe-tax";
import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceSummary } from "@/lib/invoices";
import { billingDetailsOf, parseBillingDetails, saveBillingDetails } from "@/lib/billing-details";
import { sendOrderInvoice, voidOpenOrderInvoices } from "@/lib/invoice-orders";

// Every checkout writes an order and opens a Stripe session - a handful a minute per client is plenty.
const isRateLimited = createRateLimiter(60_000, 10);

/**
 * `GET` - what the order window (`invoice-order-dialog.tsx`) opens with: how orders are paid (`flow`), the email the
 * invoice goes to, and the billing details Stripe already holds for the signed-in client (name, address, whether a
 * company is saved on the account).
 */
export async function GET() {
  const flow = purchaseFlow();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const empty = { flow, email: auth.user.email ?? "", name: "", address: null, company: false };
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return NextResponse.json(empty);
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, full_name").eq("id", auth.user.id).maybeSingle();
  const name = String(profile?.full_name ?? "");
  if (!profile?.stripe_customer_id) return NextResponse.json({ ...empty, name });
  const details = await billingDetailsOf(stripe, String(profile.stripe_customer_id));
  return NextResponse.json({ ...empty, name: details?.name || name, address: details?.address ?? null, company: details?.company ?? false }, { headers: { "cache-control": "private, no-store" } });
}

/**
 * Starts buying a pack, for the signed-in client. The price and seconds come from `lib/pricing.ts` / `lib/credits.ts`,
 * never from the browser - a one-time video's length is the slider's `seconds`, validated and priced here. Every
 * purchase is first recorded as a pending **order** (one-time or subscription, plan, billing, seconds, amount -
 * `lib/orders.ts`); the webhook (`/api/stripe/webhook`) marks it paid and adds the seconds once the money is in.
 *
 * How it is paid is `purchaseFlow()`:
 * - **`invoice`** (the default): the body also carries the client's billing `details` (name, address - saved on their
 *   Stripe customer); the order becomes a Stripe invoice emailed to them, paid from the link in the email. Returns
 *   `{ invoice: { number, email, totalCents, currency, dueAt } }`. Ordering a plan again voids the plan invoice still
 *   waiting.
 * - **`checkout`**: creates a Stripe Checkout session and returns its address to go to (`{ url }`).
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const stripe = getStripe();
  if (!stripe || paymentsPaused()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { plan?: unknown; billing?: unknown; seconds?: unknown; details?: unknown };
  const billing = isBilling(body.billing) ? body.billing : "monthly";
  const spec = checkoutFor(String(body.plan ?? ""), billing, body.seconds);
  if (!spec) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  // One plan per client: a second subscription would bill them twice. (One-time packs can always be added on top.)
  if (!spec.oneTime && (await hasLiveSubscription(stripe, auth.user.id))) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  const byInvoice = purchaseFlow() === "invoice";
  // An invoice is addressed to someone: the client's billing details come with the order (checked before anything is made).
  const details = byInvoice ? parseBillingDetails(body.details) : null;
  if (byInvoice && !details) return NextResponse.json({ error: "invalid_details" }, { status: 400 });

  const name = (getDictionary("en").plans.tiers as Record<string, { name: string }>)[spec.planKey]?.name ?? spec.planKey;
  const origin = new URL(request.url).origin;
  // The client's one Stripe customer: their invoices, billing address and tax ID stay together across purchases.
  const customer = await customerFor(stripe, auth.user.id, { email: auth.user.email });
  if (!customer) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (details && !(await saveBillingDetails(stripe, customer, details))) return NextResponse.json({ error: "invalid_details" }, { status: 400 });
  // A returning client's invoice texts (Bulgarian / international, with or without VAT), from the address Stripe holds.
  const profiled = (await applyInvoiceProfile(stripe, customer)) !== null;
  const orderId = await createPendingOrder(spec, auth.user.id, billing);
  const metadata = { user_id: auth.user.id, plan_key: spec.planKey, seconds: String(spec.seconds), purchase_type: spec.oneTime ? "one_time" : "subscription", ...(spec.oneTime ? {} : { billing }), ...(orderId ? { order_id: orderId } : {}) };

  const mode = spec.oneTime ? "payment" : "subscription";
  const productName = spec.oneTime ? `Keplerbay - ${name} (${spec.seconds} seconds)` : `Keplerbay - ${name}`;
  const tax = lineTax();

  if (byInvoice) {
    const period = billing === "annual" ? "year" : "month";
    // One plan invoice at a time: ordering a plan again replaces the one still unpaid.
    if (!spec.oneTime) {
      const replaced = await voidOpenOrderInvoices(stripe, customer, (m) => m.purchase_type === "subscription");
      for (const id of replaced) await updateOrder(id, { status: "expired" });
    }
    try {
      const invoice = await sendOrderInvoice(stripe, {
        customer,
        amountCents: spec.amountCents,
        line: spec.oneTime ? `${productName} of AI video` : `${productName}, ${billing} plan - first ${period} (${spec.seconds} seconds of AI video)`,
        memo: spec.oneTime
          ? "Your video time is added to your account as soon as this invoice is paid."
          : `Your plan starts as soon as this invoice is paid. It then renews every ${period} by invoice at this price until you cancel, which you can do at any time from your account.`,
        // `amount_cents`: the plan's price before tax - what each later period is invoiced at.
        metadata: { ...metadata, amount_cents: String(spec.amountCents) },
        profiled,
      });
      await updateOrder(orderId, { stripe_session_id: invoice.id ?? undefined });
      const summary = invoiceSummary(invoice);
      return NextResponse.json({ invoice: { number: summary.number, email: invoice.customer_email ?? auth.user.email ?? "", totalCents: summary.totalCents, currency: summary.currency, dueAt: summary.dueAt } });
    } catch {
      await updateOrder(orderId, { status: "failed" });
      return NextResponse.json({ error: "invoice_failed" }, { status: 502 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    customer,
    client_reference_id: auth.user.id,
    // The hosted page as set in Checkout Studio (ui_mode, promotion codes, consent, …).
    ...checkoutStudioParams(mode),
    ...checkoutConsent(mode, origin),
    // Stripe Tax on the billing address, the client's tax ID, and an invoice for a one-time payment (lib/stripe-tax.ts).
    ...checkoutTaxAndInvoice(mode, metadata, productName, profiled),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: spec.amountCents,
          ...tax.taxBehavior,
          product_data: { name: productName, description: `${spec.seconds} seconds of AI video`, ...tax.taxCode },
          ...(spec.oneTime ? {} : { recurring: { interval: spec.interval } }),
        },
      },
    ],
    metadata,
    ...(spec.oneTime ? { payment_intent_data: { metadata } } : { subscription_data: { metadata } }),
    success_url: `${origin}/en/my-projects?purchase=success`,
    cancel_url: `${origin}/en/pricing?cancelled=1`,
  });

  await updateOrder(orderId, { stripe_session_id: session.id });
  return NextResponse.json({ url: session.url });
}
