// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

/**
 * The client's subscription on our side: what the mirror stores, whether a client already has a live plan (no second
 * one is ever sold), and cancelling / resuming - only their own subscription, at the end of the paid period.
 */
const db = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  updates: [] as { table: string; patch: Record<string, unknown>; filters: [string, unknown][] }[],
  upserts: [] as { table: string; row: Record<string, unknown> }[],
  configured: true,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (!db.configured) return null;
    return {
      from: (table: string) => ({
        select: () => {
          const result = { data: db.rows, error: null };
          const chain = {
            eq: () => chain,
            order: async () => result,
            then: (resolve: (v: unknown) => void) => resolve(result),
          };
          return chain;
        },
        update: (patch: Record<string, unknown>) => {
          const entry = { table, patch, filters: [] as [string, unknown][] };
          db.updates.push(entry);
          const chain = {
            eq: (col: string, val: unknown) => (entry.filters.push([col, val]), chain),
            then: (resolve: (v: unknown) => void) => resolve({ error: null }),
          };
          return chain;
        },
        upsert: async (row: Record<string, unknown>) => (db.upserts.push({ table, row }), { error: null }),
      }),
    };
  },
}));

const { subscriptionRow, hasLiveSubscription, setCancelAtPeriodEnd, MOCK_SUBSCRIPTION_PREFIX } = await import("./subscriptions");

const PERIOD_END = 1_793_750_400;
const stripeSub = (over: Record<string, unknown> = {}) =>
  ({
    id: "sub_123",
    status: "active",
    customer: "cus_1",
    cancel_at_period_end: false,
    metadata: { user_id: "u1", plan_key: "pro" },
    items: { data: [{ current_period_end: PERIOD_END, price: { unit_amount: 62900, currency: "usd", recurring: { interval: "month" } } }] },
    ...over,
  }) as unknown as Stripe.Subscription;

const fakeStripe = () => ({
  subscriptions: {
    retrieve: vi.fn(async (...args: [string]) => stripeSub({ id: args[0] })),
    update: vi.fn(async (_id: string, p: { cancel_at_period_end: boolean }) => stripeSub({ cancel_at_period_end: p.cancel_at_period_end })),
    search: vi.fn(async (...args: [{ query: string; limit: number }]) => (void args, { data: [] as Stripe.Subscription[] })),
  },
});
const asStripe = (s: ReturnType<typeof fakeStripe>) => s as unknown as Stripe;

beforeEach(() => {
  db.rows = [];
  db.updates.length = 0;
  db.upserts.length = 0;
  db.configured = true;
});

describe("subscriptionRow", () => {
  it("mirrors the plan exactly as bought, from the subscription item", () => {
    expect(subscriptionRow(stripeSub())).toMatchObject({
      id: "sub_123",
      user_id: "u1",
      customer_id: "cus_1",
      plan_key: "pro",
      status: "active",
      billing: "monthly",
      amount_cents: 62900,
      currency: "usd",
      cancel_at_period_end: false,
      current_period_end: new Date(PERIOD_END * 1000).toISOString(),
    });
  });

  it("is nothing for a subscription that is not ours (no user_id)", () => {
    expect(subscriptionRow(stripeSub({ metadata: {} }))).toBeNull();
  });
});

describe("hasLiveSubscription", () => {
  it("is yes for a live mirrored plan, without asking Stripe", async () => {
    db.rows = [{ status: "canceled" }, { status: "past_due" }];
    const stripe = fakeStripe();
    expect(await hasLiveSubscription(asStripe(stripe), "u1")).toBe(true);
    expect(stripe.subscriptions.search).not.toHaveBeenCalled();
  });

  it("asks Stripe when the mirror has nothing live (a plan bought seconds ago)", async () => {
    db.rows = [{ status: "canceled" }];
    const stripe = fakeStripe();
    stripe.subscriptions.search.mockResolvedValueOnce({ data: [stripeSub({ status: "trialing" })] });
    expect(await hasLiveSubscription(asStripe(stripe), "u1")).toBe(true);
  });

  it("keeps the Stripe search query closed to injection through the id", async () => {
    const stripe = fakeStripe();
    await hasLiveSubscription(asStripe(stripe), "u1' OR status:'active");
    expect(stripe.subscriptions.search.mock.calls[0][0]).toMatchObject({ query: "metadata['user_id']:'u1 OR status:active'" });
  });

  it("is no when neither side has a live plan", async () => {
    expect(await hasLiveSubscription(asStripe(fakeStripe()), "u1")).toBe(false);
  });
});

describe("setCancelAtPeriodEnd", () => {
  it("cancels the client's live Stripe subscription at the period's end and mirrors it", async () => {
    db.rows = [{ id: "sub_old", status: "canceled" }, { id: "sub_123", status: "active", current_period_end: null }];
    const stripe = fakeStripe();
    expect(await setCancelAtPeriodEnd(asStripe(stripe), "u1", true)).toEqual({ ok: true, cancelAtPeriodEnd: true, periodEnd: new Date(PERIOD_END * 1000).toISOString() });
    expect(stripe.subscriptions.update).toHaveBeenCalledWith("sub_123", { cancel_at_period_end: true });
    expect(db.upserts[0]).toMatchObject({ table: "subscriptions", row: { id: "sub_123", cancel_at_period_end: true } });
  });

  it("resumes it", async () => {
    db.rows = [{ id: "sub_123", status: "active" }];
    const stripe = fakeStripe();
    expect(await setCancelAtPeriodEnd(asStripe(stripe), "u1", false)).toMatchObject({ ok: true, cancelAtPeriodEnd: false });
    expect(stripe.subscriptions.update).toHaveBeenCalledWith("sub_123", { cancel_at_period_end: false });
  });

  it("never touches a Stripe subscription that belongs to someone else", async () => {
    db.rows = [{ id: "sub_123", status: "active" }];
    const stripe = fakeStripe();
    stripe.subscriptions.retrieve.mockResolvedValueOnce(stripeSub({ metadata: { user_id: "someone-else" } }));
    expect(await setCancelAtPeriodEnd(asStripe(stripe), "u1", true)).toEqual({ ok: false, error: "no_subscription" });
    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("says so when there is no live subscription", async () => {
    db.rows = [{ id: "sub_123", status: "canceled" }];
    const stripe = fakeStripe();
    expect(await setCancelAtPeriodEnd(asStripe(stripe), "u1", true)).toEqual({ ok: false, error: "no_subscription" });
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it("changes a team-made test subscription in the mirror only, without Stripe", async () => {
    db.rows = [{ id: `${MOCK_SUBSCRIPTION_PREFIX}tester`, status: "active", current_period_end: "2026-11-08T00:00:00Z" }];
    expect(await setCancelAtPeriodEnd(null, "u1", true)).toEqual({ ok: true, cancelAtPeriodEnd: true, periodEnd: "2026-11-08T00:00:00Z" });
    expect(db.updates[0]).toMatchObject({ table: "subscriptions", patch: { cancel_at_period_end: true }, filters: [["id", "sub_mock_tester"], ["user_id", "u1"]] });
  });

  it("fails safely: no Stripe for a real plan, a Stripe error, no database", async () => {
    db.rows = [{ id: "sub_123", status: "active" }];
    expect(await setCancelAtPeriodEnd(null, "u1", true)).toEqual({ ok: false, error: "not_configured" });

    const stripe = fakeStripe();
    stripe.subscriptions.update.mockRejectedValueOnce(new Error("api_error"));
    expect(await setCancelAtPeriodEnd(asStripe(stripe), "u1", true)).toEqual({ ok: false, error: "failed" });
    expect(db.upserts).toHaveLength(0);

    db.configured = false;
    expect(await setCancelAtPeriodEnd(asStripe(stripe), "u1", true)).toEqual({ ok: false, error: "not_configured" });
  });
});
