import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

import { isLiveStatus } from "@/lib/subscription-status";

export { isLiveStatus, LIVE_SUBSCRIPTION_STATUSES } from "@/lib/subscription-status";

/** A Stripe subscription as a `subscriptions` row (supabase/delivery.sql), or null when it carries no `user_id`. */
export function subscriptionRow(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) return null;
  // Newer API versions keep the period on the items; older ones on the subscription itself.
  const loose = sub as unknown as {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number; price?: { unit_amount?: number | null; currency?: string; recurring?: { interval?: string } | null } }[] };
  };
  const item = loose.items?.data?.[0];
  const end = item?.current_period_end ?? loose.current_period_end;
  // The plan as bought: monthly or annual (the price's interval), and what each period costs.
  const interval = item?.price?.recurring?.interval;
  return {
    id: sub.id,
    user_id: userId,
    customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    plan_key: sub.metadata?.plan_key ?? null,
    status: sub.status,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    billing: interval === "year" ? "annual" : interval === "month" ? "monthly" : (sub.metadata?.billing ?? null),
    amount_cents: item?.price?.unit_amount ?? null,
    currency: item?.price?.currency ?? null,
    updated_at: new Date().toISOString(),
  };
}

/** Mirrors a subscription into Supabase. Returns false on a real failure (the webhook then lets Stripe retry). */
export async function saveSubscription(sub: Stripe.Subscription): Promise<boolean> {
  const row = subscriptionRow(sub);
  if (!row) return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("subscriptions").upsert(row, { onConflict: "id" });
  if (error) return false;
  // The client's Stripe customer, on their profile (supabase/profiles.sql) - for the customer portal and the team's view.
  // Best effort: a database without profiles.sql yet must not make Stripe retry the event.
  if (row.customer_id) await admin.from("profiles").update({ stripe_customer_id: row.customer_id }).eq("id", row.user_id);
  return true;
}

/**
 * Whether this client already has a live subscription: the mirrored `subscriptions` table first, then Stripe itself (its
 * search catches a plan bought seconds ago, before the webhook has landed, and works before the table exists). A failed
 * lookup on either side is not a "no" from the other.
 */
export async function hasLiveSubscription(stripe: Stripe, userId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.from("subscriptions").select("status").eq("user_id", userId);
    if (!error && data?.some((r) => isLiveStatus(String(r.status)))) return true;
  }
  try {
    const found = await stripe.subscriptions.search({ query: `metadata['user_id']:'${userId.replace(/'/g, "")}'`, limit: 20 });
    return found.data.some((s) => isLiveStatus(s.status));
  } catch {
    return false;
  }
}
