// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaddleSubscription } from "@/lib/paddle";

/**
 * The client's subscription on our side: what the mirror stores, whether a client already has a live plan (no second
 * one is ever sold), and cancelling / resuming - only their own subscription, at the end of the paid period.
 */
const db = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  updates: [] as { table: string; patch: Record<string, unknown>; filters: [string, unknown][] }[],
  upserts: [] as { table: string; row: Record<string, unknown> }[],
  configured: true,
  customerId: "ctm_1" as string | null,
}));

const api = vi.hoisted(() => ({ paddle: vi.fn() }));
vi.mock("@/lib/paddle", () => ({ paddle: api.paddle }));

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
            maybeSingle: async () => ({ data: table === "profiles" ? { paddle_customer_id: db.customerId } : null, error: null }),
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

const PERIOD_END = "2026-11-08T00:00:00Z";
const paddleSub = (over: Partial<PaddleSubscription> = {}): PaddleSubscription => ({
  id: "sub_123",
  status: "active",
  customer_id: "ctm_1",
  scheduled_change: null,
  custom_data: { user_id: "u1", plan_key: "pro" },
  current_billing_period: { starts_at: "2026-10-08T00:00:00Z", ends_at: PERIOD_END },
  items: [{ price: { unit_price: { amount: "62900", currency_code: "USD" }, billing_cycle: { interval: "month", frequency: 1 } } }],
  ...over,
});
const cancelled = () => paddleSub({ scheduled_change: { action: "cancel", effective_at: PERIOD_END } });

/** The Paddle API: GET a subscription, POST its cancel, PATCH it (resume), GET the list by customer. */
function routeApi(list: PaddleSubscription[] = [], current = paddleSub()) {
  api.paddle.mockImplementation(async (method: string, path: string) => {
    if (method === "GET" && path === "/subscriptions") return list;
    if (method === "GET") return current;
    if (method === "POST" && path.endsWith("/cancel")) return cancelled();
    if (method === "PATCH") return paddleSub();
    throw new Error(`unexpected ${method} ${path}`);
  });
}

beforeEach(() => {
  db.rows = [];
  db.updates.length = 0;
  db.upserts.length = 0;
  db.configured = true;
  db.customerId = "ctm_1";
  api.paddle.mockReset();
  routeApi();
  process.env.PADDLE_API_KEY = "pdl_test";
});

describe("subscriptionRow", () => {
  it("mirrors the plan exactly as bought, from the subscription item", () => {
    expect(subscriptionRow(paddleSub())).toMatchObject({
      id: "sub_123",
      user_id: "u1",
      customer_id: "ctm_1",
      plan_key: "pro",
      status: "active",
      billing: "monthly",
      amount_cents: 62900,
      currency: "usd",
      cancel_at_period_end: false,
      current_period_end: PERIOD_END,
    });
    expect(subscriptionRow(cancelled())).toMatchObject({ cancel_at_period_end: true });
  });

  it("is nothing for a subscription that is not ours (no user_id)", () => {
    expect(subscriptionRow(paddleSub({ custom_data: {} }))).toBeNull();
  });
});

describe("hasLiveSubscription", () => {
  it("is yes for a live mirrored plan, without asking Paddle", async () => {
    db.rows = [{ status: "canceled" }, { status: "past_due" }];
    expect(await hasLiveSubscription("u1")).toBe(true);
    expect(api.paddle).not.toHaveBeenCalled();
  });

  it("asks Paddle by the client's customer when the mirror has nothing live (a plan bought seconds ago)", async () => {
    db.rows = [{ status: "canceled" }];
    routeApi([paddleSub({ status: "trialing" })]);
    expect(await hasLiveSubscription("u1")).toBe(true);
    expect(api.paddle).toHaveBeenCalledWith("GET", "/subscriptions", undefined, { customer_id: "ctm_1", status: "active,trialing,past_due,paused" });
  });

  it("is no when neither side has a live plan, or the client has no Paddle customer yet", async () => {
    expect(await hasLiveSubscription("u1")).toBe(false);
    db.customerId = null;
    expect(await hasLiveSubscription("u1")).toBe(false);
  });
});

describe("setCancelAtPeriodEnd", () => {
  it("cancels the client's live Paddle subscription at the period's end and mirrors it", async () => {
    db.rows = [{ id: "sub_old", status: "canceled" }, { id: "sub_123", status: "active", current_period_end: null }];
    expect(await setCancelAtPeriodEnd("u1", true)).toEqual({ ok: true, cancelAtPeriodEnd: true, periodEnd: PERIOD_END });
    expect(api.paddle).toHaveBeenCalledWith("POST", "/subscriptions/sub_123/cancel", { effective_from: "next_billing_period" });
    expect(db.upserts[0]).toMatchObject({ table: "subscriptions", row: { id: "sub_123", cancel_at_period_end: true } });
  });

  it("resumes it by removing the scheduled cancellation", async () => {
    db.rows = [{ id: "sub_123", status: "active" }];
    expect(await setCancelAtPeriodEnd("u1", false)).toMatchObject({ ok: true, cancelAtPeriodEnd: false });
    expect(api.paddle).toHaveBeenCalledWith("PATCH", "/subscriptions/sub_123", { scheduled_change: null });
  });

  it("never touches a Paddle subscription that belongs to someone else", async () => {
    db.rows = [{ id: "sub_123", status: "active" }];
    routeApi([], paddleSub({ custom_data: { user_id: "someone-else" } }));
    expect(await setCancelAtPeriodEnd("u1", true)).toEqual({ ok: false, error: "no_subscription" });
    expect(api.paddle).toHaveBeenCalledTimes(1);
  });

  it("says so when there is no live subscription", async () => {
    db.rows = [{ id: "sub_123", status: "canceled" }];
    expect(await setCancelAtPeriodEnd("u1", true)).toEqual({ ok: false, error: "no_subscription" });
    expect(api.paddle).not.toHaveBeenCalled();
  });

  it("changes a team-made test subscription in the mirror only, without Paddle", async () => {
    db.rows = [{ id: `${MOCK_SUBSCRIPTION_PREFIX}tester`, status: "active", current_period_end: "2026-11-08T00:00:00Z" }];
    expect(await setCancelAtPeriodEnd("u1", true)).toEqual({ ok: true, cancelAtPeriodEnd: true, periodEnd: "2026-11-08T00:00:00Z" });
    expect(db.updates[0]).toMatchObject({ table: "subscriptions", patch: { cancel_at_period_end: true }, filters: [["id", "sub_mock_tester"], ["user_id", "u1"]] });
    expect(api.paddle).not.toHaveBeenCalled();
  });

  it("fails safely: no Paddle key for a real plan, a Paddle error, no database", async () => {
    db.rows = [{ id: "sub_123", status: "active" }];
    delete process.env.PADDLE_API_KEY;
    expect(await setCancelAtPeriodEnd("u1", true)).toEqual({ ok: false, error: "not_configured" });

    process.env.PADDLE_API_KEY = "pdl_test";
    api.paddle.mockImplementation(async (method: string) => {
      if (method === "GET") return paddleSub();
      throw new Error("api_error");
    });
    expect(await setCancelAtPeriodEnd("u1", true)).toEqual({ ok: false, error: "failed" });
    expect(db.upserts).toHaveLength(0);

    db.configured = false;
    expect(await setCancelAtPeriodEnd("u1", true)).toEqual({ ok: false, error: "not_configured" });
  });
});
