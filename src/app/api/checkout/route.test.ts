// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/checkout` - the start of every purchase. The price must come from the server, a one-time video's length must be
 * validated, a live subscriber must never be sold a second plan, and every checkout must carry its order.
 */
const state = { configured: true, user: { id: "u1", email: "client@example.com" } as { id: string; email: string } | null, subscribed: false };

vi.mock("@/lib/paddle", () => ({ paddleConfigured: () => state.configured }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock("@/lib/subscriptions", () => ({ hasLiveSubscription: vi.fn(async () => state.subscribed) }));
const orders = vi.hoisted(() => ({ createPendingOrder: vi.fn(async () => "order-1"), updateOrder: vi.fn(async () => {}) }));
vi.mock("@/lib/orders", () => orders);
const customers = vi.hoisted(() => ({ customerFor: vi.fn(async () => "ctm_test_1") }));
vi.mock("@/lib/paddle-customers", () => customers);
const checkout = vi.hoisted(() => ({ createCheckoutTransaction: vi.fn() }));
vi.mock("@/lib/paddle-checkout", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/paddle-checkout")>()), createCheckoutTransaction: checkout.createCheckoutTransaction }));

const { POST } = await import("./route");

const post = (body: unknown) => POST(new Request("http://localhost:3000/api/checkout", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));
const created = () => checkout.createCheckoutTransaction.mock.calls[0][0] as { customerId: string; customData: Record<string, string>; items: { price: { unit_price: { amount: string }; billing_cycle?: { interval: string }; product: { tax_category: string } } }[] };

beforeEach(() => {
  state.configured = true;
  state.user = { id: "u1", email: "client@example.com" };
  state.subscribed = false;
  checkout.createCheckoutTransaction.mockReset().mockResolvedValue({ id: "txn_test_1" });
  orders.createPendingOrder.mockClear();
  orders.updateOrder.mockClear();
});

describe("/api/checkout", () => {
  it("is off without Paddle (503) and needs a signed-in client (401)", async () => {
    state.configured = false;
    expect((await post({ plan: "creator" })).status).toBe(503);
    state.configured = true;
    state.user = null;
    expect((await post({ plan: "creator" })).status).toBe(401);
    expect(checkout.createCheckoutTransaction).not.toHaveBeenCalled();
  });

  it("refuses unknown and custom plans, and a one-time length off the slider", async () => {
    for (const body of [{ plan: "free" }, { plan: "enterprise" }, { plan: "personal", seconds: 25 }, { plan: "personal", seconds: 600 }]) {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_plan" });
    }
    expect(checkout.createCheckoutTransaction).not.toHaveBeenCalled();
  });

  it("prices a one-time video by its length on the server, on the client's customer, and links the order", async () => {
    const res = await post({ plan: "personal", seconds: 40, amount: 1 /* a price from the browser is ignored */ });
    expect(await res.json()).toEqual({ transactionId: "txn_test_1" });

    const t = created();
    expect(t.customerId).toBe("ctm_test_1");
    expect(t.items[0].price.unit_price.amount).toBe(String((299 + 2 * 119) * 100));
    expect(t.items[0].price.billing_cycle).toBeUndefined();
    expect(t.items[0].price.product.tax_category).toBe("standard");
    expect(t.customData).toMatchObject({ user_id: "u1", plan_key: "personal", seconds: "40", purchase_type: "one_time", order_id: "order-1" });

    expect(orders.createPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ planKey: "personal", seconds: 40, oneTime: true }), "u1", "monthly");
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { paddle_transaction_id: "txn_test_1" });
  });

  it("starts an annual subscription: ten months' price as a yearly line, twelve months of seconds, billing in the custom data", async () => {
    await post({ plan: "creator", billing: "annual" });
    const t = created();
    expect(t.items[0].price).toMatchObject({ unit_price: { amount: String(389 * 10 * 100) }, billing_cycle: { interval: "year" } });
    expect(t.customData).toMatchObject({ plan_key: "creator", seconds: String(40 * 12), purchase_type: "subscription", billing: "annual", order_id: "order-1" });
  });

  it("never sells a second subscription to a live subscriber (409), but still sells them a one-time video", async () => {
    state.subscribed = true;
    const res = await post({ plan: "pro" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "already_subscribed" });
    expect(checkout.createCheckoutTransaction).not.toHaveBeenCalled();
    expect(orders.createPendingOrder).not.toHaveBeenCalled();

    expect((await post({ plan: "personal" })).status).toBe(200);
  });

  it("still sells when the order cannot be recorded (no service role) - the custom data just has no order", async () => {
    orders.createPendingOrder.mockResolvedValueOnce(null as unknown as string);
    await post({ plan: "personal" });
    expect(created().customData.order_id).toBeUndefined();
  });

  it("says so when Paddle refuses (502)", async () => {
    state.user = { id: "u-refused", email: "refused@example.com" };
    checkout.createCheckoutTransaction.mockRejectedValueOnce(new Error("forbidden"));
    expect((await post({ plan: "personal" })).status).toBe(502);
  });

  it("refuses a checkout started from another site (CSRF)", async () => {
    const res = await POST(new Request("http://localhost:3000/api/checkout", { method: "POST", body: JSON.stringify({ plan: "creator" }), headers: { "Content-Type": "application/json", origin: "https://evil.example" } }));
    expect(res.status).toBe(403);
    expect(orders.createPendingOrder).not.toHaveBeenCalled();
  });

  it("blunts a burst of checkouts from one client", async () => {
    state.user = { id: "burst", email: "burst@example.com" };
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await post({ plan: "personal" })).status);
    expect(statuses.at(-1)).toBe(429);
  });
});
