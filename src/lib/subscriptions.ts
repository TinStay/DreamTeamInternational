import { paddle, type PaddleSubscription } from "@/lib/paddle";
import { createAdminClient } from "@/lib/supabase/admin";

import { isLiveStatus, LIVE_SUBSCRIPTION_STATUSES } from "@/lib/subscription-status";

export { isLiveStatus, LIVE_SUBSCRIPTION_STATUSES } from "@/lib/subscription-status";

/** A `subscriptions` row (supabase/delivery.sql), as the mirror keeps it. */
export type SubscriptionRow = {
  id: string;
  user_id: string;
  customer_id: string | null;
  plan_key: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  billing: string | null;
  amount_cents: number | null;
  currency: string | null;
  updated_at: string;
};

/** A Paddle subscription as a `subscriptions` row, or null when it carries no `user_id` in its custom data. */
export function subscriptionRow(sub: PaddleSubscription): SubscriptionRow | null {
  const userId = sub.custom_data?.user_id;
  if (!userId) return null;
  const price = sub.items?.[0]?.price;
  const interval = price?.billing_cycle?.interval;
  const amount = price?.unit_price?.amount;
  return {
    id: sub.id,
    user_id: userId,
    customer_id: sub.customer_id ?? null,
    plan_key: sub.custom_data?.plan_key ?? null,
    status: sub.status,
    // The paid period runs to the end of the current billing period (a cancelled one ends there).
    current_period_end: sub.current_billing_period?.ends_at ?? sub.scheduled_change?.effective_at ?? null,
    cancel_at_period_end: sub.scheduled_change?.action === "cancel",
    // The plan as bought: monthly or annual (the price's billing cycle), and what each period costs.
    billing: interval === "year" ? "annual" : interval === "month" ? "monthly" : (sub.custom_data?.billing ?? null),
    amount_cents: amount != null && amount !== "" ? Number.parseInt(amount, 10) : null,
    currency: price?.unit_price?.currency_code?.toLowerCase() ?? null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Mirrors a subscription into Supabase and returns the row it replaced (`previous` - what the emails compare against, as
 * Paddle's notifications carry the new state only). `ok: false` on a real failure (the webhook then lets Paddle retry).
 */
export async function saveSubscription(sub: PaddleSubscription): Promise<{ ok: boolean; previous: SubscriptionRow | null; row: SubscriptionRow | null }> {
  const row = subscriptionRow(sub);
  if (!row) return { ok: true, previous: null, row: null };
  const admin = createAdminClient();
  if (!admin) return { ok: false, previous: null, row };
  const { data: before } = await admin.from("subscriptions").select("*").eq("id", row.id).maybeSingle();
  const { error } = await admin.from("subscriptions").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, previous: null, row };
  // The client's Paddle customer, on their profile (supabase/paddle.sql) - for their invoices and the team's view.
  // Best effort: it must never make Paddle retry the event.
  if (row.customer_id) await admin.from("profiles").update({ paddle_customer_id: row.customer_id }).eq("id", row.user_id);
  return { ok: true, previous: (before as SubscriptionRow | null) ?? null, row };
}

/**
 * Whether this client already has a live subscription: the mirrored `subscriptions` table first, then Paddle itself (its
 * list by customer catches a plan bought seconds ago, before the webhook has landed). A failed lookup on either side is
 * not a "no" from the other.
 */
export async function hasLiveSubscription(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  let customerId: string | null = null;
  if (admin) {
    const { data, error } = await admin.from("subscriptions").select("status").eq("user_id", userId);
    if (!error && data?.some((r) => isLiveStatus(String(r.status)))) return true;
    const { data: profile } = await admin.from("profiles").select("paddle_customer_id").eq("id", userId).maybeSingle();
    customerId = (profile?.paddle_customer_id as string | null | undefined) ?? null;
  }
  if (!customerId) return false;
  try {
    const found = await paddle<PaddleSubscription[]>("GET", "/subscriptions", undefined, { customer_id: customerId, status: LIVE_SUBSCRIPTION_STATUSES.join(",") });
    return found.some((s) => isLiveStatus(s.status));
  } catch {
    return false;
  }
}

/**
 * Test subscriptions the team adds by hand (`sub_mock_<name>` - a real Paddle id is `sub_` and 26 characters, no second
 * underscore). They exist only in the mirror, so cancelling one changes the row alone. Clients cannot write
 * `subscriptions` (supabase/hardening.sql), so such a row can only come from the team.
 */
export const MOCK_SUBSCRIPTION_PREFIX = "sub_mock_";

export type CancelResult =
  | { ok: true; cancelAtPeriodEnd: boolean; periodEnd: string | null }
  | { ok: false; error: "no_subscription" | "not_configured" | "failed" };

/**
 * Cancels the client's live subscription at the end of the period they have paid for (`cancel = true` - Paddle's cancel
 * with `effective_from: next_billing_period`): they keep the plan and their video time until then and are never charged
 * again - or takes that back (`cancel = false` - the scheduled change removed). Only the signed-in client's own
 * subscription: the id comes from the mirror by `user_id`, and Paddle's copy must carry the same `user_id` before
 * anything changes. The mirror is updated at once (the webhook confirms it later).
 */
export async function setCancelAtPeriodEnd(userId: string, cancel: boolean): Promise<CancelResult> {
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

  if (!process.env.PADDLE_API_KEY) return { ok: false, error: "not_configured" };
  try {
    const path = `/subscriptions/${encodeURIComponent(id)}`;
    const current = await paddle<PaddleSubscription>("GET", path);
    if (current.custom_data?.user_id !== userId) return { ok: false, error: "no_subscription" };
    const updated = cancel
      ? await paddle<PaddleSubscription>("POST", `${path}/cancel`, { effective_from: "next_billing_period" })
      : await paddle<PaddleSubscription>("PATCH", path, { scheduled_change: null });
    await saveSubscription(updated);
    const row = subscriptionRow(updated);
    return { ok: true, cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end), periodEnd: row?.current_period_end ?? null };
  } catch {
    return { ok: false, error: "failed" };
  }
}
