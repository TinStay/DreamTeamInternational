import { NextResponse } from "next/server";
import { checkoutFor, isBilling } from "@/lib/checkout";
import { getDictionary } from "@/lib/i18n/config";
import { paddleConfigured } from "@/lib/paddle";
import { createClient } from "@/lib/supabase/server";
import { hasLiveSubscription } from "@/lib/subscriptions";
import { createPendingOrder, updateOrder } from "@/lib/orders";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";
import { customerFor } from "@/lib/paddle-customers";
import { createCheckoutTransaction, lineItem } from "@/lib/paddle-checkout";

// Every checkout writes an order and opens a Paddle transaction - a handful a minute per client is plenty.
const isRateLimited = createRateLimiter(60_000, 10);

/**
 * Starts buying a pack: for the signed-in client, creates a Paddle **transaction** for the chosen plan (price and seconds
 * come from `lib/pricing.ts` / `lib/credits.ts`, never from the browser - a one-time video's length is the slider's
 * `seconds`, validated and priced here) and returns its id, which the browser opens in Paddle's overlay checkout
 * (`lib/paddle-client.ts`). A subscription is a recurring line - Paddle creates the subscription once it is paid. Every
 * checkout is first recorded as a pending **order** (`lib/orders.ts`); the webhook (`/api/paddle/webhook`) marks it paid
 * and adds the seconds once Paddle confirms the payment.
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!paddleConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { plan?: unknown; billing?: unknown; seconds?: unknown };
  const billing = isBilling(body.billing) ? body.billing : "monthly";
  const spec = checkoutFor(String(body.plan ?? ""), billing, body.seconds);
  if (!spec) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  // One plan per client: a second subscription would bill them twice. (One-time packs can always be added on top.)
  if (!spec.oneTime && (await hasLiveSubscription(auth.user.id))) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  const name = (getDictionary("en").plans.tiers as Record<string, { name: string }>)[spec.planKey]?.name ?? spec.planKey;
  try {
    // The client's one Paddle customer: their invoices, billing address and tax ID stay together across purchases.
    const customerId = await customerFor(auth.user.id, { email: auth.user.email });
    if (!customerId) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    const orderId = await createPendingOrder(spec, auth.user.id, billing);
    const customData: Record<string, string> = {
      user_id: auth.user.id,
      plan_key: spec.planKey,
      seconds: String(spec.seconds),
      purchase_type: spec.oneTime ? "one_time" : "subscription",
      ...(spec.oneTime ? {} : { billing }),
      ...(orderId ? { order_id: orderId } : {}),
    };
    const productName = spec.oneTime ? `Keplerbay - ${name} (${spec.seconds} seconds)` : `Keplerbay - ${name}`;
    const transaction = await createCheckoutTransaction({
      customerId,
      customData,
      items: [lineItem({ name: productName, description: `${spec.seconds} seconds of AI video`, amountCents: spec.amountCents, interval: spec.oneTime ? undefined : spec.interval })],
    });
    await updateOrder(orderId, { paddle_transaction_id: transaction.id });
    return NextResponse.json({ transactionId: transaction.id });
  } catch (err) {
    console.error("checkout: paddle refused", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
