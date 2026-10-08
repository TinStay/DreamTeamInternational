// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/stripe/webhook` - the only place video seconds are bought. Only Stripe may call it (the signature), only money
 * actually collected adds seconds, a payment is credited once, a real failure makes Stripe retry (500), and every
 * checkout's order is settled.
 */
const inserts: Record<string, unknown>[] = [];
const db = { insertError: null as null | { code: string } };
const admin = { from: vi.fn(() => ({ insert: vi.fn(async (row: Record<string, unknown>) => (inserts.push(row), { error: db.insertError })) })) };

const stripe = {
  webhooks: {
    constructEvent: vi.fn((raw: string, signature: string) => {
      if (signature !== "valid") throw new Error("bad signature");
      return JSON.parse(raw);
    }),
  },
  subscriptions: { retrieve: vi.fn(async () => ({ metadata: { user_id: "u1", plan_key: "creator", seconds: "40", order_id: "order-sub" } })) },
};

vi.mock("@/lib/stripe", () => ({ getStripe: () => stripe }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => admin }));
const subs = vi.hoisted(() => ({ saveSubscription: vi.fn(async () => true) }));
vi.mock("@/lib/subscriptions", () => subs);
const orders = vi.hoisted(() => ({ updateOrder: vi.fn(async () => {}) }));
vi.mock("@/lib/orders", () => orders);

process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
const { POST } = await import("./route");

const send = (type: string, object: Record<string, unknown>, signature = "valid") =>
  POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: JSON.stringify({ type, data: { object } }), headers: { "stripe-signature": signature } }));

const META = { user_id: "u1", plan_key: "personal", seconds: "40", order_id: "order-1" };
const session = (over: Record<string, unknown> = {}) => ({ id: "cs_1", mode: "payment", payment_status: "paid", metadata: META, ...over });

beforeEach(() => {
  inserts.length = 0;
  db.insertError = null;
  orders.updateOrder.mockClear();
  subs.saveSubscription.mockClear().mockResolvedValue(true);
});

describe("/api/stripe/webhook", () => {
  it("rejects anything not signed by Stripe", async () => {
    const res = await send("checkout.session.completed", session(), "forged");
    expect(res.status).toBe(400);
    expect(inserts).toHaveLength(0);
  });

  it("credits a paid one-time video once, with its order, and settles the order as paid", async () => {
    expect((await send("checkout.session.completed", session())).status).toBe(200);
    expect(inserts).toEqual([{ user_id: "u1", seconds: 40, kind: "purchase", plan_key: "personal", note: "Pack purchase", external_ref: "cs_1", order_id: "order-1" }]);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", expect.objectContaining({ status: "paid" }));
  });

  it("treats a payment Stripe sends twice as done (the duplicate is not an error)", async () => {
    db.insertError = { code: "23505" };
    expect((await send("checkout.session.completed", session())).status).toBe(200);
  });

  it("asks Stripe to retry when the credit cannot be written", async () => {
    db.insertError = { code: "08006" };
    expect((await send("checkout.session.completed", session())).status).toBe(500);
  });

  it("adds nothing for a pending bank payment, and nothing for a failed one - the order is marked failed", async () => {
    await send("checkout.session.completed", session({ payment_status: "unpaid" }));
    expect(inserts).toHaveLength(0);
    expect(orders.updateOrder).not.toHaveBeenCalled();

    await send("checkout.session.async_payment_failed", session({ payment_status: "unpaid" }));
    expect(inserts).toHaveLength(0);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { status: "failed" });
  });

  it("credits the delayed bank payment when it succeeds", async () => {
    await send("checkout.session.async_payment_succeeded", session());
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({ seconds: 40, external_ref: "cs_1" });
  });

  it("marks an abandoned checkout's order as expired, crediting nothing", async () => {
    await send("checkout.session.expired", session({ payment_status: "unpaid" }));
    expect(inserts).toHaveLength(0);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { status: "expired" });
  });

  it("credits every paid subscription invoice from the subscription's metadata, under the invoice's id", async () => {
    await send("invoice.paid", { id: "in_1", status: "paid", parent: { subscription_details: { subscription: "sub_1" } } });
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(inserts).toEqual([expect.objectContaining({ user_id: "u1", seconds: 40, plan_key: "creator", external_ref: "in_1", order_id: "order-sub" })]);
  });

  it("never credits a failed renewal", async () => {
    await send("invoice.payment_failed", { id: "in_2", status: "open", subscription: "sub_1" });
    expect(inserts).toHaveLength(0);
  });

  it("mirrors subscription changes, and retries when the mirror cannot be written", async () => {
    expect((await send("customer.subscription.updated", { id: "sub_1", status: "active", metadata: { user_id: "u1" } })).status).toBe(200);
    expect(subs.saveSubscription).toHaveBeenCalledWith(expect.objectContaining({ id: "sub_1" }));
    subs.saveSubscription.mockResolvedValueOnce(false);
    expect((await send("customer.subscription.deleted", { id: "sub_1", status: "canceled", metadata: { user_id: "u1" } })).status).toBe(500);
  });
});
