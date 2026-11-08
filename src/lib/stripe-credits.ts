import type Stripe from "stripe";
import { PLAN_SECONDS } from "@/lib/credits";

/** Video seconds to add for one payment; `ref` is the payment's id, so it is only ever credited once. */
export type Purchase = { userId: string; seconds: number; planKey: string; ref: string; note: string; orderId: string | null };

/**
 * What a Stripe event means for the client's video seconds:
 * - `credit`: money has actually arrived - add the seconds;
 * - `subscription`: a subscription invoice was paid - add the seconds the subscription's metadata names (the caller
 *   fetches it, then calls `purchaseFromMetadata`);
 * - `none`: nothing to add - including every failed, pending or unpaid payment (the `reason` says which).
 *
 * The rule: **seconds are only ever added for money that has been collected.** A card that is declined never completes
 * a checkout; a bank debit (ACH / SEPA) completes it as `unpaid` and only counts once Stripe sends
 * `checkout.session.async_payment_succeeded`; a subscription's first or renewal payment that fails sends
 * `invoice.payment_failed`, never `invoice.paid`.
 */
export type CreditDecision =
  | { kind: "credit"; purchase: Purchase }
  | { kind: "subscription"; subscriptionId: string; ref: string }
  | { kind: "none"; reason: "payment_failed" | "payment_pending" | "not_paid" | "not_a_pack" | "ignored" };

export function purchaseFromMetadata(m: Stripe.Metadata | null | undefined, ref: string, note: string): Purchase | null {
  const seconds = Number.parseInt(m?.seconds ?? "", 10);
  const planKey = m?.plan_key ?? "";
  if (!m?.user_id || !seconds || seconds <= 0 || !(planKey in PLAN_SECONDS)) return null;
  return { userId: m.user_id, seconds, planKey, ref, note, orderId: m.order_id || null };
}

const packOrNone = (p: Purchase | null): CreditDecision => (p ? { kind: "credit", purchase: p } : { kind: "none", reason: "not_a_pack" });

export function creditDecision(event: Stripe.Event): CreditDecision {
  // A paid change request (supabase/changes.sql) buys a change to a project, never video seconds.
  const meta = (event.data.object as { metadata?: Stripe.Metadata | null }).metadata;
  if (meta?.purchase_type === "project_request") return { kind: "none", reason: "not_a_pack" };
  switch (event.type) {
    // A one-time pack. Paid by card: `paid` right here. Paid by a bank debit: `unpaid` here, then one of the two
    // async events below - so `unpaid` must never be credited.
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "payment") return { kind: "none", reason: "ignored" }; // subscriptions: invoice.paid
      if (session.payment_status === "unpaid") return { kind: "none", reason: "payment_pending" };
      if (session.payment_status !== "paid") return { kind: "none", reason: "not_paid" };
      return packOrNone(purchaseFromMetadata(session.metadata, session.id, "Pack purchase"));
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "payment" || session.payment_status !== "paid") return { kind: "none", reason: "not_paid" };
      // Same ref as the completed event, so a session can never be credited twice.
      return packOrNone(purchaseFromMetadata(session.metadata, session.id, "Pack purchase"));
    }
    // A subscription period, paid. Older API versions put the subscription on the invoice, newer ones under `parent`.
    case "invoice.paid": {
      const invoice = event.data.object as unknown as {
        id: string;
        status?: string | null;
        subscription?: string | { id: string } | null;
        parent?: { subscription_details?: { subscription?: string | { id: string } } } | null;
      };
      if (invoice.status && invoice.status !== "paid") return { kind: "none", reason: "not_paid" };
      const sub = invoice.parent?.subscription_details?.subscription ?? invoice.subscription;
      const subscriptionId = typeof sub === "string" ? sub : sub?.id;
      return subscriptionId ? { kind: "subscription", subscriptionId, ref: invoice.id } : { kind: "none", reason: "not_a_pack" };
    }
    case "checkout.session.async_payment_failed":
    case "invoice.payment_failed":
    case "payment_intent.payment_failed":
      return { kind: "none", reason: "payment_failed" };
    default:
      return { kind: "none", reason: "ignored" };
  }
}
