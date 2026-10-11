import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { creditDecision, purchaseFromMetadata, type Purchase } from "@/lib/stripe-credits";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveSubscription } from "@/lib/subscriptions";
import { updateOrder } from "@/lib/orders";
import { notifyProjectEvent } from "@/lib/email/project-notifications";
import { notifySubscriptionEvent } from "@/lib/email/subscription-notifications";

export const runtime = "nodejs";

/** Adds a purchase to the ledger; the same payment (`ref`) is only ever credited once. Returns false on a real failure. */
async function credit(p: Purchase): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("credit_ledger").insert({
    user_id: p.userId,
    seconds: p.seconds,
    kind: "purchase",
    plan_key: p.planKey,
    note: p.note,
    external_ref: p.ref,
    // The order that paid for it (a column from supabase/orders.sql - only sent when there is one).
    ...(p.orderId ? { order_id: p.orderId } : {}),
  });
  // 23505 = this payment was already credited (Stripe sends events more than once): fine.
  return !error || error.code === "23505";
}

/** Settles the checkout's order from its checkout events (best effort - the credits never wait on it). */
async function settleOrder(event: Stripe.Event) {
  if (!event.type.startsWith("checkout.session.")) return;
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && session.payment_status === "paid") {
    const sub = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    await updateOrder(orderId, { status: "paid", paid_at: new Date().toISOString(), ...(sub ? { stripe_subscription_id: sub } : {}) });
  } else if (event.type === "checkout.session.async_payment_failed") {
    await updateOrder(orderId, { status: "failed" });
  } else if (event.type === "checkout.session.expired") {
    await updateOrder(orderId, { status: "expired" });
  }
}

/**
 * A paid change request (an earlier deadline, an extra revision - supabase/changes.sql): once its money is in, it goes from
 * `awaiting_payment` to `requested`, and the team sees it. Returns false on a real failure (Stripe retries).
 */
async function settleProjectRequest(event: Stripe.Event, origin: string): Promise<boolean> {
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return true;
  const session = event.data.object as Stripe.Checkout.Session;
  const requestId = session.metadata?.request_id;
  if (session.metadata?.purchase_type !== "project_request" || !requestId || session.payment_status !== "paid") return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("project_requests")
    .update({ status: "requested", paid_at: new Date().toISOString(), stripe_session_id: session.id })
    .eq("id", requestId)
    .eq("user_id", session.metadata?.user_id ?? "")
    .eq("status", "awaiting_payment");
  if (error) return false;
  // Paid: the team hears about the request now (a free one was announced when the client sent it). Once only - the
  // email's idempotency key is the request's id, so Stripe's retries send nothing new.
  const projectId = session.metadata?.project_id;
  if (projectId) await notifyProjectEvent({ id: "stripe-webhook", isTeam: false, system: true }, { projectId, event: "change_request", requestId }, origin);
  return true;
}

/**
 * Stripe tells us a payment happened; this adds the pack's video seconds to the client's account - **only once the money
 * is collected** (`creditDecision` in `lib/stripe-credits.ts`): a one-time pack when its checkout completes paid, or when
 * a delayed bank payment later succeeds (`checkout.session.async_payment_succeeded`); a subscription each time an invoice
 * is paid (the first month too, and every renewal). Declined cards, failed bank debits and failed renewals add nothing.
 * The checkout's **order** (`lib/orders.ts`, its id in the metadata) is settled from the checkout events - paid, failed
 * (a delayed bank payment that did not go through) or expired (the checkout was abandoned) - and every credit points at
 * it. Subscription created / updated / deleted events are mirrored into `subscriptions` (one live plan per client). The
 * signature is verified with `STRIPE_WEBHOOK_SECRET`, so only Stripe can call this.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  // The client's plan itself, mirrored so they are never sold a second one (see /api/checkout).
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const saved = await saveSubscription(event.data.object as Stripe.Subscription);
    if (!saved) return NextResponse.json({ error: "subscription_failed" }, { status: 500 });
    // Bought, cancelled, upgraded / downgraded or ended: the client's email and the admin copy (once each; never throws).
    await notifySubscriptionEvent(stripe, event, new URL(request.url).origin);
    return NextResponse.json({ received: true });
  }

  await settleOrder(event);
  if (!(await settleProjectRequest(event, new URL(request.url).origin))) return NextResponse.json({ error: "request_failed" }, { status: 500 });

  // Only money actually collected adds seconds - a failed, pending or unpaid payment never does (`creditDecision`).
  const decision = creditDecision(event);
  let purchase: Purchase | null = null;
  if (decision.kind === "credit") {
    purchase = decision.purchase;
  } else if (decision.kind === "subscription") {
    const subscription = await stripe.subscriptions.retrieve(decision.subscriptionId);
    purchase = purchaseFromMetadata(subscription.metadata, decision.ref, "Subscription payment");
  }

  if (purchase && !(await credit(purchase))) {
    // Let Stripe retry: better a late credit than a paid client with no seconds.
    return NextResponse.json({ error: "credit_failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
