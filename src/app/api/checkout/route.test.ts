// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/checkout` - the start of every purchase. The price must come from the server, a one-time video's length must be
 * validated, a live subscriber must never be sold a second plan, and every checkout must carry its order.
 */
const stripe = { checkout: { sessions: { create: vi.fn() } } };
const state = { stripe: stripe as unknown, user: { id: "u1", email: "client@example.com" } as { id: string; email: string } | null, subscribed: false };

vi.mock("@/lib/stripe", () => ({
  getStripe: () => state.stripe,
  paymentsPaused: () => process.env.PAYMENTS_PAUSED === "true",
  purchaseFlow: () => (process.env.PURCHASE_FLOW === "checkout" ? "checkout" : "invoice"),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => null }));
const invoicing = vi.hoisted(() => ({
  sendOrderInvoice: vi.fn(async (...args: [unknown, Record<string, unknown>]) => (void args, { id: "in_order_1", number: "000000-0090", customer_email: "client@example.com", total: 35880, total_excluding_tax: 29900, currency: "usd", created: 1794000000, due_date: 1794604800, status: "open" })),
  voidOpenOrderInvoices: vi.fn(async (...args: [unknown, string, (m: Record<string, string>) => boolean]) => (void args, [] as string[])),
}));
vi.mock("@/lib/invoice-orders", () => invoicing);
const billing = vi.hoisted(() => ({ saveBillingDetails: vi.fn(async () => true), billingDetailsOf: vi.fn(async () => null) }));
vi.mock("@/lib/billing-details", async (original) => ({ ...(await original<typeof import("@/lib/billing-details")>()), ...billing }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock("@/lib/subscriptions", () => ({ hasLiveSubscription: vi.fn(async () => state.subscribed) }));
const orders = vi.hoisted(() => ({ createPendingOrder: vi.fn(async () => "order-1"), updateOrder: vi.fn(async () => {}) }));
vi.mock("@/lib/orders", () => orders);
vi.mock("@/lib/stripe-customers", () => ({ customerFor: vi.fn(async () => "cus_test_1") }));

const { POST } = await import("./route");

const post = (body: unknown) => POST(new Request("http://localhost:3000/api/checkout", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));
const created = () => stripe.checkout.sessions.create.mock.calls[0][0];

const DETAILS = { name: "Ada Client", address: { line1: "1 Main St", city: "Austin", state: "TX", postal_code: "78701", country: "US" } };

beforeEach(() => {
  // The Checkout tests below run the `checkout` flow; the invoice flow (the default) has its own block.
  process.env.PURCHASE_FLOW = "checkout";
  invoicing.sendOrderInvoice.mockClear();
  invoicing.voidOpenOrderInvoices.mockClear().mockResolvedValue([]);
  billing.saveBillingDetails.mockClear().mockResolvedValue(true);
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
    // No business fields at checkout - a company is known from its account page.
    expect(params.customer_update).toEqual({ address: "auto" });
    expect(params.tax_id_collection).toBeUndefined();
    expect(params.name_collection).toBeUndefined();
    expect(params.automatic_tax).toEqual({ enabled: false }); // off until STRIPE_TAX_ENABLED=true
    expect(params.line_items[0].price_data.tax_behavior).toBe("exclusive");
    expect(params.invoice_creation.enabled).toBe(true);
    expect(params.invoice_creation.invoice_data.metadata).toEqual(params.metadata);
    // The Checkout Studio settings: the hosted page, its identifier, promotion codes, consent; submit_type in payment mode only.
    expect(params).toMatchObject({ ui_mode: "hosted_page", integration_identifier: "hosted_web_0001", origin_context: "web", allow_promotion_codes: true, phone_number_collection: { enabled: false }, submit_type: "auto" });
    expect(params.consent_collection).toBeUndefined();
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

  it("is off while payments are paused (PAYMENTS_PAUSED=true)", async () => {
    process.env.PAYMENTS_PAUSED = "true";
    try {
      expect((await post({ plan: "personal" })).status).toBe(503);
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    } finally {
      delete process.env.PAYMENTS_PAUSED;
    }
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

describe("/api/checkout - paid by invoice (the default flow)", () => {
  beforeEach(() => {
    delete process.env.PURCHASE_FLOW;
    state.user = { id: `u-inv-${Math.random()}`, email: "client@example.com" };
  });

  it("emails an invoice instead of opening a checkout: the server's price, the order, the flow's metadata", async () => {
    const res = await post({ plan: "personal", seconds: 40, details: DETAILS, amount: 1 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ invoice: { number: "000000-0090", email: "client@example.com", totalCents: 35880, currency: "usd", dueAt: new Date(1794604800 * 1000).toISOString() } });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();

    const order = invoicing.sendOrderInvoice.mock.calls[0][1];
    expect(order).toMatchObject({ customer: "cus_test_1", amountCents: (299 + 2 * 119) * 100 });
    expect(order.metadata).toMatchObject({ user_id: state.user?.id, plan_key: "personal", seconds: "40", purchase_type: "one_time", order_id: "order-1", amount_cents: String((299 + 2 * 119) * 100) });
    expect(billing.saveBillingDetails).toHaveBeenCalledWith(stripe, "cus_test_1", DETAILS);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { stripe_session_id: "in_order_1" });
    // A one-time video never replaces another invoice.
    expect(invoicing.voidOpenOrderInvoices).not.toHaveBeenCalled();
  });

  it("needs the billing details before anything is made", async () => {
    for (const details of [undefined, { name: "Ada", address: { country: "US" } }, { name: "Ada", address: { ...DETAILS.address, state: "" } }]) {
      const res = await post({ plan: "personal", details });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_details" });
    }
    expect(orders.createPendingOrder).not.toHaveBeenCalled();
    expect(invoicing.sendOrderInvoice).not.toHaveBeenCalled();
  });

  it("invoices a plan's first period, states the renewal, and replaces a plan invoice still unpaid", async () => {
    invoicing.voidOpenOrderInvoices.mockResolvedValueOnce(["order-old"]);
    await post({ plan: "creator", billing: "annual", details: DETAILS });
    const order = invoicing.sendOrderInvoice.mock.calls[0][1] as { amountCents: number; line: string; memo: string; metadata: Record<string, string> };
    expect(order.amountCents).toBe(389 * 10 * 100);
    expect(order.line).toContain("first year");
    expect(order.memo).toContain("renews every year by invoice");
    expect(order.metadata).toMatchObject({ purchase_type: "subscription", billing: "annual", seconds: String(40 * 12), amount_cents: String(389 * 10 * 100) });
    // Only plan invoices are replaced, and their orders are closed.
    const match = invoicing.voidOpenOrderInvoices.mock.calls[0][2];
    expect(match({ purchase_type: "subscription" })).toBe(true);
    expect(match({ purchase_type: "one_time" })).toBe(false);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-old", { status: "expired" });
  });

  it("still never sells a second plan to a live subscriber, and marks the order failed when Stripe refuses the invoice", async () => {
    state.subscribed = true;
    expect((await post({ plan: "pro", details: DETAILS })).status).toBe(409);
    state.subscribed = false;
    invoicing.sendOrderInvoice.mockRejectedValueOnce(new Error("stripe down"));
    const res = await post({ plan: "personal", details: DETAILS });
    expect(res.status).toBe(502);
    expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { status: "failed" });
  });
});
