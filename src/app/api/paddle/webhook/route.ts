import { NextResponse } from "next/server";
import { verifyPaddleSignature, type PaddleEvent, type PaddleSubscription, type PaddleTransaction } from "@/lib/paddle";
import { creditDecision, type Purchase } from "@/lib/paddle-credits";
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
  // 23505 = this payment was already credited (Paddle sends notifications more than once): fine.
  return !error || error.code === "23505";
}

/** Settles the checkout's order from its transaction (best effort - the credits never wait on it). */
async function settleOrder(event: PaddleEvent) {
  if (!event.event_type.startsWith("transaction.")) return;
  const tx = event.data as unknown as PaddleTransaction;
  const orderId = tx.custom_data?.order_id;
  // A renewal carries the first order's id too (copied from the subscription) - only its own first payment settles it.
  if (!orderId || tx.origin === "subscription_recurring") return;
  if (event.event_type === "transaction.completed") {
    await updateOrder(orderId, { status: "paid", paid_at: new Date().toISOString(), paddle_transaction_id: tx.id, ...(tx.subscription_id ? { paddle_subscription_id: tx.subscription_id } : {}) });
  } else if (event.event_type === "transaction.canceled") {
    await updateOrder(orderId, { status: "expired" });
  }
}

/**
 * A paid change request (an earlier deadline, an extra revision - supabase/changes.sql): once its money is in, it goes from
 * `awaiting_payment` to `requested`, and the team sees it. Returns false on a real failure (Paddle retries).
 */
async function settleProjectRequest(event: PaddleEvent, origin: string): Promise<boolean> {
  if (event.event_type !== "transaction.completed") return true;
  const tx = event.data as unknown as PaddleTransaction;
  const meta = tx.custom_data ?? {};
  const requestId = meta.request_id;
  if (meta.purchase_type !== "project_request" || !requestId) return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("project_requests")
    .update({ status: "requested", paid_at: new Date().toISOString(), paddle_transaction_id: tx.id })
    .eq("id", requestId)
    .eq("user_id", meta.user_id ?? "")
    .eq("status", "awaiting_payment");
  if (error) return false;
  // Paid: the team hears about the request now (a free one was announced when the client sent it). Once only - the
  // email's idempotency key is the request's id, so Paddle's retries send nothing new.
  if (meta.project_id) await notifyProjectEvent({ id: "paddle-webhook", isTeam: false, system: true }, { projectId: meta.project_id, event: "change_request", requestId }, origin);
  return true;
}

/**
 * Paddle tells us a payment happened; this adds the pack's video seconds to the client's account - **only once the money
 * is collected** (`creditDecision` in `lib/paddle-credits.ts`): every `transaction.completed` - a one-time pack, a
 * subscription's first payment and each renewal. Declined cards and failed renewals add nothing. The checkout's
 * **order** (`lib/orders.ts`, its id in the custom data) is settled from its transaction, paid change requests are
 * released to the team, and `subscription.*` notifications are mirrored into `subscriptions` (one live plan per client)
 * and emailed. The signature is verified with `PADDLE_WEBHOOK_SECRET`, so only Paddle can call this.
 */
export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const raw = await request.text();
  if (!verifyPaddleSignature(raw, request.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }
  let event: PaddleEvent;
  try {
    event = JSON.parse(raw) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }
  const origin = new URL(request.url).origin;

  // The client's plan itself, mirrored so they are never sold a second one (see /api/checkout).
  if (event.event_type.startsWith("subscription.")) {
    const sub = event.data as unknown as PaddleSubscription;
    const saved = await saveSubscription(sub);
    if (!saved.ok) return NextResponse.json({ error: "subscription_failed" }, { status: 500 });
    // Bought, cancelled, upgraded / downgraded or ended: the client's email and the admin copy (once each; never throws).
    await notifySubscriptionEvent(sub, saved.previous, saved.row, origin);
    return NextResponse.json({ received: true });
  }

  await settleOrder(event);
  if (!(await settleProjectRequest(event, origin))) return NextResponse.json({ error: "request_failed" }, { status: 500 });

  // Only money actually collected adds seconds - a failed or unpaid payment never does (`creditDecision`).
  const decision = creditDecision(event);
  if (decision.kind === "credit" && !(await credit(decision.purchase))) {
    // Let Paddle retry: better a late credit than a paid client with no seconds.
    return NextResponse.json({ error: "credit_failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
