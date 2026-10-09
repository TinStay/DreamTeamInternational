// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/checkout` - the start of every purchase. The price must come from the server, a one-time video's length must be
 * validated, a live subscriber must never be sold a second plan, and every checkout must carry its order.
 */
const stripe = { checkout: { sessions: { create: vi.fn() } } };
const state = { stripe: stripe as unknown, user: { id: "u1", email: "client@example.com" } as { id: string; email: string } | null, subscribed: false };

vi.mock("@/lib/stripe", () => ({ getStripe: () => state.stripe }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock("@/lib/subscriptions", () => ({ hasLiveSubscription: vi.fn(async () => state.subscribed) }));
const orders = vi.hoisted(() => ({ createPendingOrder: vi.fn(async () => "order-1"), updateOrder: vi.fn(async () => {}) }));
vi.mock("@/lib/orders", () => orders);
vi.mock("@/lib/stripe-customers", () => ({ customerFor: vi.fn(async () => "cus_test_1") }));

const { POST } = await import("./route");

const post = (body: unknown) => POST(new Request("http://localhost:3000/api/checkout", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));
const created = () => stripe.checkout.sessions.create.mock.calls[0][0];

beforeEach(() => {
  state.stripe = stripe;
  state.user = { id: "u1", email: "client@example.com" };
  state.subscribed = false;
  stripe.checkout.sessions.create.mockReset().mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.com/c/cs_test_1" });
  orders.createPendingOrder.mockClear();
  orders.updateOrder.mockClear();
});

describe("/api/checkout", () => {
  it("is off without Stripe (503) and needs a signed-in client (401)", async () => {
    state.stripe = null;
    expect((await post({ plan: "creator" })).status).toBe(503);
    state.stripe = stripe;
    state.user = null;
    expect((await post({ plan: "creator" })).status).toBe(401);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("refuses unknown and custom plans, and a one-time length off the slider", async () => {
    for (const body of [{ plan: "free" }, { plan: "enterprise" }, { plan: "personal", seconds: 25 }, { plan: "personal", seconds: 600 }]) {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_plan" });
    }
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("prices a one-time video by its length on the server, records the order and links it to the session", async () => {
    const res = await post({ plan: "personal", seconds: 40, amount: 1 /* a price from the browser is ignored */ });
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/c/cs_test_1" });

    const s = created();
    expect(s.mode).toBe("payment");
    expect(s.line_items[0].price_data.unit_amount).toBe((299 + 2 * 119) * 100);
    expect(s.line_items[0].price_data.recurring).toBeUndefined();
    expect(s.metadata).toMatchObject({ user_id: "u1", plan_key: "personal", seconds: "40", purchase_type: "one_time", order_id: "order-1" });
    // The payment itself carries the same metadata (async bank payments are settled from it).
    expect(s.payment_intent_data.metadata).toEqual(s.metadata);
    expect(s.success_url).toBe("http://localhost:3000/en/my-projects?purchase=success");

    expect(orders.createPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ planKey: "personal", seconds: 40, oneTime: true }), "u1", "monthly");
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { stripe_session_id: "cs_test_1" });
  });

  it("starts an annual subscription: ten months' price, twelve months of seconds, billing in the metadata", async () => {
    await post({ plan: "creator", billing: "annual" });
    const s = created();
    expect(s.mode).toBe("subscription");
    expect(s.line_items[0].price_data).toMatchObject({ unit_amount: 389 * 10 * 100, recurring: { interval: "year" } });
    expect(s.subscription_data.metadata).toMatchObject({ plan_key: "creator", seconds: String(40 * 12), purchase_type: "subscription", billing: "annual", order_id: "order-1" });
  });

  it("never sells a second subscription to a live subscriber (409), but still sells them a one-time video", async () => {
    state.subscribed = true;
    const res = await post({ plan: "pro" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "already_subscribed" });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    expect(orders.createPendingOrder).not.toHaveBeenCalled();

    expect((await post({ plan: "personal" })).status).toBe(200);
  });

  it("still sells when the order cannot be recorded (no service role) - the metadata just has no order", async () => {
    orders.createPendingOrder.mockResolvedValueOnce(null as unknown as string);
    await post({ plan: "personal" });
    expect(created().metadata.order_id).toBeUndefined();
  });

  it("bills the client's own customer, collects the address and tax ID, and issues an invoice for a one-time video", async () => {
    state.user = { id: "u-invoice", email: "invoice@example.com" };
    await post({ plan: "personal" });
    const params = created();
    expect(params.customer).toBe("cus_test_1");
    expect(params.customer_email).toBeUndefined();
    expect(params.billing_address_collection).toBe("required");
    expect(params.customer_update).toEqual({ address: "auto", name: "auto" });
    expect(params.tax_id_collection).toEqual({ enabled: true });
    expect(params.automatic_tax).toEqual({ enabled: false }); // off until STRIPE_TAX_ENABLED=true
    expect(params.line_items[0].price_data.tax_behavior).toBe("exclusive");
    expect(params.invoice_creation.enabled).toBe(true);
    expect(params.invoice_creation.invoice_data.metadata).toEqual(params.metadata);
    // The Checkout Studio settings: the hosted page, its identifier, promotion codes, consent; submit_type in payment mode only.
    expect(params).toMatchObject({ ui_mode: "hosted_page", integration_identifier: "hosted_web_0001", origin_context: "web", allow_promotion_codes: true, phone_number_collection: { enabled: false }, consent_collection: { promotions: "auto" }, submit_type: "auto" });
    expect(params.payment_method_collection).toBeUndefined();
  });

  it("turns Stripe Tax on with the flag and leaves the subscription's invoices to Billing", async () => {
    vi.stubEnv("STRIPE_TAX_ENABLED", "true");
    state.user = { id: "u-tax", email: "tax@example.com" }; // its own rate-limit bucket
    await post({ plan: "creator", billing: "monthly" });
    expect(created().automatic_tax).toEqual({ enabled: true });
    expect(created().invoice_creation).toBeUndefined();
    // A subscription always saves a payment method for renewals; submit_type is a payment-mode setting.
    expect(created().payment_method_collection).toBe("always");
    expect(created().submit_type).toBeUndefined();
    vi.unstubAllEnvs();
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
