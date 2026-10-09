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

/**
 * Test subscriptions the team adds by hand (`sub_mock_<name>` - a real Stripe id never carries a second underscore).
 * They exist only in the mirror, so cancelling one changes the row alone. Clients cannot write `subscriptions`
 * (supabase/hardening.sql), so such a row can only come from the team.
 */
export const MOCK_SUBSCRIPTION_PREFIX = "sub_mock_";

export type CancelResult =
  | { ok: true; cancelAtPeriodEnd: boolean; periodEnd: string | null }
  | { ok: false; error: "no_subscription" | "not_configured" | "failed" };

/**
 * Cancels the client's live subscription at the end of the period they have paid for (`cancel = true`) - they keep
 * the plan and their video time until then and are never charged again - or takes that back (`cancel = false`).
 * Only the signed-in client's own subscription: the id comes from the mirror by `user_id`, and Stripe's copy must carry
 * the same `user_id` before anything changes. The mirror is updated at once (the webhook confirms it later).
 */
export async function setCancelAtPeriodEnd(stripe: Stripe | null, userId: string, cancel: boolean): Promise<CancelResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "not_configured" };
  const { data, error } = await admin.from("subscriptions").select("id, status, current_period_end").eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) return { ok: false, error: "failed" };
  const live = (data ?? []).find((r) => isLiveStatus(String(r.status)));
  if (!live) return { ok: false, error: "no_subscription" };
  const id = String(live.id);

  if (id.startsWith(MOCK_SUBSCRIPTION_PREFIX)) {
    const { error: updateError } = await admin
      .from("subscriptions")
      .update({ cancel_at_period_end: cancel, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    return updateError ? { ok: false, error: "failed" } : { ok: true, cancelAtPeriodEnd: cancel, periodEnd: (live.current_period_end as string | null) ?? null };
  }

  if (!stripe) return { ok: false, error: "not_configured" };
  try {
    const current = await stripe.subscriptions.retrieve(id);
    if (current.metadata?.user_id !== userId) return { ok: false, error: "no_subscription" };
    const updated = await stripe.subscriptions.update(id, { cancel_at_period_end: cancel });
    await saveSubscription(updated);
    return { ok: true, cancelAtPeriodEnd: Boolean(updated.cancel_at_period_end), periodEnd: subscriptionRow(updated)?.current_period_end ?? null };
  } catch {
    return { ok: false, error: "failed" };
  }
}
