import { NextResponse } from "next/server";
import { checkoutFor, isBilling } from "@/lib/checkout";
import { getDictionary } from "@/lib/i18n/config";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { hasLiveSubscription } from "@/lib/subscriptions";
import { createPendingOrder, updateOrder } from "@/lib/orders";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";
import { customerFor } from "@/lib/stripe-customers";
import { INTEGRATION_ID, checkoutTaxAndInvoice, lineTax } from "@/lib/stripe-tax";

// Every checkout writes an order and opens a Stripe session - a handful a minute per client is plenty.
const isRateLimited = createRateLimiter(60_000, 10);

/**
 * Starts buying a pack: for the signed-in client, creates a Stripe Checkout session for the chosen plan (price and seconds
 * come from `lib/pricing.ts` / `lib/credits.ts`, never from the browser - a one-time video's length is the slider's
 * `seconds`, validated and priced here) and returns its address to go to. Every checkout is first recorded as a
 * pending **order** (one-time or subscription, plan, billing, seconds, amount - `lib/orders.ts`); the webhook
 * (`/api/stripe/webhook`) marks it paid and adds the seconds once Stripe confirms the payment.
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { plan?: unknown; billing?: unknown; seconds?: unknown };
  const billing = isBilling(body.billing) ? body.billing : "monthly";
  const spec = checkoutFor(String(body.plan ?? ""), billing, body.seconds);
  if (!spec) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  // One plan per client: a second subscription would bill them twice. (One-time packs can always be added on top.)
  if (!spec.oneTime && (await hasLiveSubscription(stripe, auth.user.id))) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  const name = (getDictionary("en").plans.tiers as Record<string, { name: string }>)[spec.planKey]?.name ?? spec.planKey;
  const origin = new URL(request.url).origin;
  // The client's one Stripe customer: their invoices, billing address and tax ID stay together across purchases.
  const customer = await customerFor(stripe, auth.user.id, { email: auth.user.email });
  if (!customer) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const orderId = await createPendingOrder(spec, auth.user.id, billing);
  const metadata = { user_id: auth.user.id, plan_key: spec.planKey, seconds: String(spec.seconds), purchase_type: spec.oneTime ? "one_time" : "subscription", ...(spec.oneTime ? {} : { billing }), ...(orderId ? { order_id: orderId } : {}) };

  const mode = spec.oneTime ? "payment" : "subscription";
  const productName = spec.oneTime ? `Keplerbay - ${name} (${spec.seconds} seconds)` : `Keplerbay - ${name}`;
  const tax = lineTax();

  const session = await stripe.checkout.sessions.create({
    mode,
    customer,
    client_reference_id: auth.user.id,
    integration_identifier: INTEGRATION_ID.packs,
    // Stripe Tax on the billing address, the client's tax ID, and an invoice for a one-time payment (lib/stripe-tax.ts).
    ...checkoutTaxAndInvoice(mode, metadata, productName),
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
