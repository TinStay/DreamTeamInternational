import type { CheckoutSpec } from "@/lib/checkout";
import type { Billing } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

/** An `orders` row's status (supabase/orders.sql). */
export type OrderStatus = "pending" | "paid" | "failed" | "expired";

/** What one checkout is, as an `orders` row: one-time or subscription, which plan and billing, seconds, amount. */
export function orderRow(spec: CheckoutSpec, userId: string, billing: Billing) {
  return {
    user_id: userId,
    plan_key: spec.planKey,
    purchase_type: spec.oneTime ? "one_time" : "subscription",
    billing: spec.oneTime ? null : billing,
    seconds: spec.seconds,
    amount_cents: spec.amountCents,
    currency: "usd",
    status: "pending" as OrderStatus,
  };
}

/**
 * Records a checkout before Stripe opens, as a pending order; returns its id (it rides along in the checkout's metadata,
 * so the webhook can settle it) - or `null` without the service role / the table, and the purchase still goes through.
 */
export async function createPendingOrder(spec: CheckoutSpec, userId: string, billing: Billing): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("orders").insert(orderRow(spec, userId, billing)).select("id").single();
  return error || !data ? null : String(data.id);
}

/** Updates an order (best effort - an order is a record; the credits never wait on it). */
export async function updateOrder(orderId: string | null | undefined, patch: Partial<{ status: OrderStatus; stripe_session_id: string; stripe_subscription_id: string; paid_at: string }>) {
  if (!orderId) return;
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("orders").update(patch).eq("id", orderId);
}
