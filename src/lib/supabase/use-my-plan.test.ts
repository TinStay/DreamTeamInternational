import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMyPlan } from "./use-my-plan";

/**
 * What every plan card says the client bought: the live subscription first, then a paid subscription order the mirror
 * has not caught up with, then the last one-time video - and nothing for an ended plan or a pending order.
 */
const rows = vi.hoisted(() => ({ subscription: null as Record<string, unknown> | null, order: null as Record<string, unknown> | null, filters: [] as string[] }));

vi.mock("@/lib/supabase/config", () => ({ supabaseConfigured: true }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: (col: string, val: unknown) => (rows.filters.push(`${table}.${col}=${String(val)}`), chain),
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: table === "subscriptions" ? rows.subscription : rows.order, error: null }),
      };
      return chain;
    },
  }),
}));

const plan = async () => {
  const { result } = renderHook(() => useMyPlan());
  await waitFor(() => expect(result.current).not.toBeNull());
  return result.current;
};

beforeEach(() => {
  rows.subscription = null;
  rows.order = null;
  rows.filters.length = 0;
});

describe("useMyPlan", () => {
  it("is the live subscription, exactly as bought", async () => {
    rows.subscription = { plan_key: "brand", status: "active", billing: "annual", amount_cents: 3490000, current_period_end: "2027-10-07T00:00:00Z", cancel_at_period_end: false };
    expect(await plan()).toEqual({ kind: "subscription", planKey: "brand", status: "active", billing: "annual", amountCents: 3490000, periodEnd: "2027-10-07T00:00:00Z", cancelAtPeriodEnd: false });
    // Only the client's own rows.
    expect(rows.filters).toContain("subscriptions.user_id=u1");
  });

  it("counts a past-due subscription as still live", async () => {
    rows.subscription = { plan_key: "pro", status: "past_due", billing: "monthly", amount_cents: 62900 };
    expect(await plan()).toMatchObject({ kind: "subscription", planKey: "pro", status: "past_due" });
  });

  it("uses a paid subscription order while the mirror has not caught up", async () => {
    rows.order = { plan_key: "creator", purchase_type: "subscription", billing: "monthly", seconds: 40, amount_cents: 38900, paid_at: "2026-10-07T09:00:00Z" };
    expect(await plan()).toMatchObject({ kind: "subscription", planKey: "creator", billing: "monthly", amountCents: 38900 });
    // Only paid orders count.
    expect(rows.filters).toContain("orders.status=paid");
  });

  it("falls back to the last one-time video", async () => {
    rows.order = { plan_key: "personal", purchase_type: "one_time", seconds: 60, amount_cents: 77500, paid_at: "2026-10-05T12:00:00Z" };
    expect(await plan()).toEqual({ kind: "one_time", planKey: "personal", seconds: 60, amountCents: 77500, paidAt: "2026-10-05T12:00:00Z" });
  });

  it("is no plan after a cancelled subscription with no one-time video", async () => {
    rows.subscription = { plan_key: "creator", status: "canceled" };
    rows.order = { plan_key: "creator", purchase_type: "subscription", billing: "monthly", seconds: 40, amount_cents: 38900 };
    expect(await plan()).toEqual({ kind: "none" });
  });

  it("uses the sample fallback without asking Supabase", async () => {
    const fallback = { kind: "one_time" as const, planKey: "personal", seconds: 20, amountCents: 29900, paidAt: null };
    const { result } = renderHook(() => useMyPlan(true, fallback));
    expect(result.current).toBe(fallback);
    expect(rows.filters).toHaveLength(0);
  });
});
