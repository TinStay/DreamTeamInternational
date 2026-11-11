import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { creditDecision, purchaseFromMetadata, type Purchase } from "@/lib/stripe-credits";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveSubscription } from "@/lib/subscriptions";
import { updateOrder } from "@/lib/orders";
import { notifyProjectEvent } from "@/lib/email/project-notifications";
import { notifySubscriptionEvent } from "@/lib/email/subscription-notifications";
import { applyInvoiceProfile } from "@/lib/invoice-profiles";
import { isInvoiceOrder, startInvoicedSubscription } from "@/lib/invoice-orders";
import { getDictionary } from "@/lib/i18n/config";

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

/** A paid (or voided) invoice of an order paid by invoice, or `null` for any other event. */
function orderInvoice(event: Stripe.Event): { id: string; customer: string; metadata: Stripe.Metadata; paid: boolean; paidAt: number } | null {
  if (event.type !== "invoice.paid" && event.type !== "invoice.voided") return null;
  const invoice = event.data.object as Stripe.Invoice;
  if (!invoice.id || !isInvoiceOrder(invoice.metadata)) return null;
  const customer = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? "");
  // When it was paid - the same on every delivery of the event, so what is made from it is the same too.
  const paidAt = invoice.status_transitions?.paid_at ?? event.created;
  return { id: invoice.id, customer, metadata: invoice.metadata ?? {}, paid: event.type === "invoice.paid" && invoice.status === "paid", paidAt };
}

/** Settles the order from its checkout events, or from its invoice (best effort - the credits never wait on it). */
async function settleOrder(event: Stripe.Event) {
  const invoice = orderInvoice(event);
  if (invoice?.metadata.order_id) {
    await updateOrder(invoice.metadata.order_id, invoice.paid ? { status: "paid", paid_at: new Date().toISOString() } : { status: "expired" });
    return;
  }
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
  // Paid on Stripe's Checkout, or - an order paid by invoice - on its invoice.
  let paid: { ref: string; metadata: Stripe.Metadata } | null = null;
  const invoice = orderInvoice(event);
  if (invoice) {
    if (invoice.paid) paid = { ref: invoice.id, metadata: invoice.metadata };
  } else if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") paid = { ref: session.id, metadata: session.metadata ?? {} };
  }
  const requestId = paid?.metadata.request_id;
  if (!paid || paid.metadata.purchase_type !== "project_request" || !requestId) return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("project_requests")
    .update({ status: "requested", paid_at: new Date().toISOString(), stripe_session_id: paid.ref })
    .eq("id", requestId)
    .eq("user_id", paid.metadata.user_id ?? "")
    .eq("status", "awaiting_payment");
  if (error) return false;
  // Paid: the team hears about the request now (a free one was announced when the client sent it). Once only - the
  // email's idempotency key is the request's id, so Stripe's retries send nothing new.
  const projectId = paid.metadata.project_id;
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
 * it. Subscription created / updated / deleted events are mirrored into `subscriptions` (one live plan per client). An
 * order paid **by invoice** (`lib/invoice-orders.ts`) is settled from its `invoice.paid`: the seconds, the order, a paid
 * change request, and for a plan the subscription itself. The signature is verified with `STRIPE_WEBHOOK_SECRET`, so
 * only Stripe can call this.
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

  // A finished checkout has saved the client's billing address and any tax ID: write their invoice texts onto the
  // customer, so every later invoice (renewals, the team's, hand-made ones) is the right kind. Never fails the webhook.
  if (event.type === "checkout.session.completed") {
    const customer = (event.data.object as Stripe.Checkout.Session).customer;
    const customerId = typeof customer === "string" ? customer : customer?.id;
    if (customerId) await applyInvoiceProfile(stripe, customerId);
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

  // A plan ordered by invoice: its first period is paid (and credited above) - now the subscription itself starts, and
  // sends an invoice every period from the next one on. A failure lets Stripe retry (the credit and the subscription
  // are each made once).
  const paidInvoice = orderInvoice(event);
  if (paidInvoice?.paid && paidInvoice.metadata.purchase_type === "subscription") {
    try {
      const planKey = paidInvoice.metadata.plan_key ?? "";
      const name = (getDictionary("en").plans.tiers as Record<string, { name: string }>)[planKey]?.name ?? planKey;
      const subscriptionId = await startInvoicedSubscription(stripe, paidInvoice, name);
      if (subscriptionId) await updateOrder(paidInvoice.metadata.order_id, { stripe_subscription_id: subscriptionId });
    } catch {
      return NextResponse.json({ error: "subscription_failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
