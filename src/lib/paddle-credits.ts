import { PLAN_SECONDS } from "@/lib/credits";
import type { PaddleCustomData, PaddleEvent, PaddleTransaction } from "@/lib/paddle";

/** Video seconds to add for one payment; `ref` is the transaction's id, so it is only ever credited once. */
export type Purchase = { userId: string; seconds: number; planKey: string; ref: string; note: string; orderId: string | null };

/**
 * What a Paddle notification means for the client's video seconds:
 * - `credit`: money has actually arrived - add the seconds;
 * - `none`: nothing to add - including every failed, pending or unpaid payment (the `reason` says which).
 *
 * The rule: **seconds are only ever added for money that has been collected** - a `transaction.completed`, which Paddle
 * sends once a transaction is paid and processed: a one-time pack, a subscription's first payment and every renewal (a
 * renewal's custom data is copied from the subscription, so it names the plan the subscription is on now). A declined
 * card, a failed renewal (`transaction.payment_failed`) or an unpaid invoice never completes. Paid change requests and
 * the team's custom invoices are money, but never video seconds.
 */
export type CreditDecision =
  | { kind: "credit"; purchase: Purchase }
  | { kind: "none"; reason: "payment_failed" | "not_paid" | "not_a_pack" | "ignored" };

export function purchaseFromCustomData(m: PaddleCustomData | undefined, ref: string, note: string): Purchase | null {
  const seconds = Number.parseInt(m?.seconds ?? "", 10);
  const planKey = m?.plan_key ?? "";
  if (!m?.user_id || !seconds || seconds <= 0 || !(planKey in PLAN_SECONDS)) return null;
  return { userId: m.user_id, seconds, planKey, ref, note, orderId: m.order_id || null };
}

export function creditDecision(event: PaddleEvent): CreditDecision {
  if (event.event_type === "transaction.payment_failed") return { kind: "none", reason: "payment_failed" };
  if (event.event_type !== "transaction.completed") return { kind: "none", reason: "ignored" };
  const tx = event.data as unknown as PaddleTransaction;
  const type = tx.custom_data?.purchase_type;
  if (type === "project_request" || type === "custom_invoice") return { kind: "none", reason: "not_a_pack" };
  if (tx.status !== "completed" && tx.status !== "paid") return { kind: "none", reason: "not_paid" };
  const note = tx.subscription_id ? "Subscription payment" : "Pack purchase";
  const purchase = purchaseFromCustomData(tx.custom_data, tx.id, note);
  return purchase ? { kind: "credit", purchase } : { kind: "none", reason: "not_a_pack" };
}
