// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/paddle/webhook` - the only place video seconds are bought. Only Paddle may call it (the signature), only money
 * actually collected adds seconds, a payment is credited once, a real failure makes Paddle retry (500), and every
 * checkout's order is settled.
 */
const inserts: Record<string, unknown>[] = [];
const db = { insertError: null as null | { code: string } };
const updates: { table: string; patch: Record<string, unknown>; filters: [string, unknown][] }[] = [];
const admin = {
  from: vi.fn((table: string) => ({
    insert: vi.fn(async (row: Record<string, unknown>) => (inserts.push(row), { error: db.insertError })),
    update: (patch: Record<string, unknown>) => {
      const entry = { table, patch, filters: [] as [string, unknown][] };
      updates.push(entry);
      const chain = { eq: (col: string, val: unknown) => (entry.filters.push([col, val]), chain), then: (resolve: (v: unknown) => void) => resolve({ error: null }) };
      return chain;
    },
  })),
};

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => admin }));
const subs = vi.hoisted(() => ({ saveSubscription: vi.fn(async (): Promise<{ ok: boolean; previous: null; row: { id: string } | null }> => ({ ok: true, previous: null, row: { id: "sub_1" } })) }));
vi.mock("@/lib/subscriptions", () => subs);
const orders = vi.hoisted(() => ({ updateOrder: vi.fn(async () => {}) }));
vi.mock("@/lib/orders", () => orders);
const notifications = vi.hoisted(() => ({ notifyProjectEvent: vi.fn(async () => ({ status: "sent", sent: 1 })) }));
vi.mock("@/lib/email/project-notifications", () => notifications);
const subNotify = vi.hoisted(() => ({ notifySubscriptionEvent: vi.fn(async () => {}) }));
vi.mock("@/lib/email/subscription-notifications", () => subNotify);

const SECRET = "pdl_ntfset_test";
process.env.PADDLE_WEBHOOK_SECRET = SECRET;
const { POST } = await import("./route");

const sign = (raw: string) => {
  const ts = Math.floor(Date.now() / 1000);
  return `ts=${ts};h1=${createHmac("sha256", SECRET).update(`${ts}:${raw}`).digest("hex")}`;
};
const send = (event_type: string, data: Record<string, unknown>, signature?: string) => {
  const raw = JSON.stringify({ event_id: "evt_1", event_type, data });
  return POST(new Request("http://localhost/api/paddle/webhook", { method: "POST", body: raw, headers: { "paddle-signature": signature ?? sign(raw) } }));
};

const META = { user_id: "u1", plan_key: "personal", seconds: "40", order_id: "order-1", purchase_type: "one_time" };
const tx = (over: Record<string, unknown> = {}) => ({ id: "txn_1", status: "completed", origin: "web", custom_data: META, ...over });

beforeEach(() => {
  inserts.length = 0;
  updates.length = 0;
  db.insertError = null;
  orders.updateOrder.mockClear();
  notifications.notifyProjectEvent.mockClear();
  subNotify.notifySubscriptionEvent.mockClear();
  subs.saveSubscription.mockClear().mockResolvedValue({ ok: true, previous: null, row: { id: "sub_1" } });
});

describe("/api/paddle/webhook", () => {
  it("rejects anything not signed by Paddle", async () => {
    const res = await send("transaction.completed", tx(), "ts=1;h1=forged");
    expect(res.status).toBe(400);
    expect(inserts).toHaveLength(0);
  });

  it("credits a completed one-time video once, with its order, and settles the order as paid", async () => {
    expect((await send("transaction.completed", tx())).status).toBe(200);
    expect(inserts).toEqual([{ user_id: "u1", seconds: 40, kind: "purchase", plan_key: "personal", note: "Pack purchase", external_ref: "txn_1", order_id: "order-1" }]);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", expect.objectContaining({ status: "paid", paddle_transaction_id: "txn_1" }));
  });

  it("treats a payment Paddle sends twice as done (the duplicate is not an error)", async () => {
    db.insertError = { code: "23505" };
    expect((await send("transaction.completed", tx())).status).toBe(200);
  });

  it("asks Paddle to retry when the credit cannot be written", async () => {
    db.insertError = { code: "08006" };
    expect((await send("transaction.completed", tx())).status).toBe(500);
  });

  it("adds nothing for a paid-but-not-completed or a failed payment", async () => {
    await send("transaction.paid", tx({ status: "paid" }));
    await send("transaction.payment_failed", tx({ status: "past_due" }));
    expect(inserts).toHaveLength(0);
  });

  it("marks a cancelled checkout's order as expired, crediting nothing", async () => {
    await send("transaction.canceled", tx({ status: "canceled" }));
    expect(inserts).toHaveLength(0);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { status: "expired" });
  });

  it("credits a subscription's first payment (settling its order with the subscription) and every renewal (leaving the order alone)", async () => {
    const meta = { user_id: "u1", plan_key: "creator", seconds: "40", order_id: "order-sub", purchase_type: "subscription", billing: "monthly" };
    await send("transaction.completed", tx({ id: "txn_first", subscription_id: "sub_1", custom_data: meta }));
    expect(orders.updateOrder).toHaveBeenCalledWith("order-sub", expect.objectContaining({ status: "paid", paddle_subscription_id: "sub_1" }));
    orders.updateOrder.mockClear();
    await send("transaction.completed", tx({ id: "txn_renewal", subscription_id: "sub_1", origin: "subscription_recurring", custom_data: meta }));
    expect(orders.updateOrder).not.toHaveBeenCalled();
    expect(inserts.map((r) => r.external_ref)).toEqual(["txn_first", "txn_renewal"]);
    expect(inserts[1]).toMatchObject({ note: "Subscription payment", seconds: 40, plan_key: "creator" });
  });

  it("mirrors subscription changes and emails them, and retries when the mirror cannot be written", async () => {
    const sub = { id: "sub_1", status: "active", custom_data: { user_id: "u1" } };
    expect((await send("subscription.updated", sub)).status).toBe(200);
    expect(subs.saveSubscription).toHaveBeenCalledWith(expect.objectContaining({ id: "sub_1" }));
    expect(subNotify.notifySubscriptionEvent).toHaveBeenCalledWith(expect.objectContaining({ id: "sub_1" }), null, { id: "sub_1" }, expect.any(String));
    subNotify.notifySubscriptionEvent.mockClear();
    subs.saveSubscription.mockResolvedValueOnce({ ok: false, previous: null, row: null });
    expect((await send("subscription.canceled", { ...sub, status: "canceled" })).status).toBe(500);
    // Not saved: no email until Paddle's retry succeeds.
    expect(subNotify.notifySubscriptionEvent).not.toHaveBeenCalled();
  });

  it("settles a paid change request for the team - and never turns it into video seconds", async () => {
    const meta = { user_id: "u1", request_id: "req-1", project_id: "p1", purchase_type: "project_request", kind: "deadline" };
    expect((await send("transaction.completed", tx({ id: "txn_req", custom_data: meta }))).status).toBe(200);
    expect(inserts).toHaveLength(0);
    expect(updates).toEqual([
      { table: "project_requests", patch: expect.objectContaining({ status: "requested", paddle_transaction_id: "txn_req" }), filters: [["id", "req-1"], ["user_id", "u1"], ["status", "awaiting_payment"]] },
    ]);
    expect(notifications.notifyProjectEvent).toHaveBeenCalledWith(expect.objectContaining({ system: true }), { projectId: "p1", event: "change_request", requestId: "req-1" }, expect.any(String));
  });
});
