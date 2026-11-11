// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/stripe/webhook` - the only place video seconds are bought. Only Stripe may call it (the signature), only money
 * actually collected adds seconds, a payment is credited once, a real failure makes Stripe retry (500), and every
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
const notifications = vi.hoisted(() => ({ notifyProjectEvent: vi.fn(async () => ({ status: "sent", sent: 1 })) }));
vi.mock("@/lib/email/project-notifications", () => notifications);
const subNotify = vi.hoisted(() => ({ notifySubscriptionEvent: vi.fn(async () => {}) }));
vi.mock("@/lib/email/subscription-notifications", () => subNotify);
const invoicing = vi.hoisted(() => ({ startInvoicedSubscription: vi.fn(async (...args: unknown[]): Promise<string | null> => (void args, "sub_new")) }));
vi.mock("@/lib/invoice-orders", async (original) => ({ ...(await original<typeof import("@/lib/invoice-orders")>()), ...invoicing }));

process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
const { POST } = await import("./route");

const send = (type: string, object: Record<string, unknown>, signature = "valid") =>
  POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: JSON.stringify({ type, data: { object } }), headers: { "stripe-signature": signature } }));

const META = { user_id: "u1", plan_key: "personal", seconds: "40", order_id: "order-1" };
const session = (over: Record<string, unknown> = {}) => ({ id: "cs_1", mode: "payment", payment_status: "paid", metadata: META, ...over });

beforeEach(() => {
  inserts.length = 0;
  updates.length = 0;
  db.insertError = null;
  orders.updateOrder.mockClear();
  subs.saveSubscription.mockClear().mockResolvedValue(true);
  invoicing.startInvoicedSubscription.mockClear().mockResolvedValue("sub_new");
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
    // Saved: the subscription emails get their turn (bought / cancelled / changed / ended - decided in the notifier).
    expect(subNotify.notifySubscriptionEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: "customer.subscription.updated" }), expect.any(String));
    subNotify.notifySubscriptionEvent.mockClear();
    subs.saveSubscription.mockResolvedValueOnce(false);
    expect((await send("customer.subscription.deleted", { id: "sub_1", status: "canceled", metadata: { user_id: "u1" } })).status).toBe(500);
    // Not saved: no email until Stripe's retry succeeds.
    expect(subNotify.notifySubscriptionEvent).not.toHaveBeenCalled();
  });

  it("settles a paid change request for the team - and never turns it into video seconds", async () => {
    const meta = { user_id: "u1", request_id: "req-1", project_id: "p1", purchase_type: "project_request", kind: "deadline" };
    expect((await send("checkout.session.completed", session({ id: "cs_req", metadata: meta }))).status).toBe(200);
    expect(inserts).toHaveLength(0);
    expect(updates).toEqual([
      { table: "project_requests", patch: expect.objectContaining({ status: "requested", stripe_session_id: "cs_req" }), filters: [["id", "req-1"], ["user_id", "u1"], ["status", "awaiting_payment"]] },
    ]);
    // Paid: the team is emailed about the request, as the server itself.
    expect(notifications.notifyProjectEvent).toHaveBeenCalledWith(expect.objectContaining({ system: true }), { projectId: "p1", event: "change_request", requestId: "req-1" }, expect.any(String));
    // An unpaid (bank debit) completion settles nothing yet.
    notifications.notifyProjectEvent.mockClear();
    updates.length = 0;
    await send("checkout.session.completed", session({ id: "cs_req", payment_status: "unpaid", metadata: meta }));
    expect(updates).toHaveLength(0);
    expect(notifications.notifyProjectEvent).not.toHaveBeenCalled();
  });

  describe("orders paid by invoice", () => {
    const PACK = { ...META, flow: "invoice", purchase_type: "one_time", amount_cents: "53700" };
    const PLAN = { user_id: "u1", plan_key: "creator", seconds: "40", order_id: "order-plan", flow: "invoice", purchase_type: "subscription", billing: "monthly", amount_cents: "38900" };

    it("credits a pack once its invoice is paid, settles its order, and starts no subscription", async () => {
      expect((await send("invoice.paid", { id: "in_pack", status: "paid", customer: "cus_1", metadata: PACK })).status).toBe(200);
      expect(inserts).toEqual([expect.objectContaining({ user_id: "u1", seconds: 40, plan_key: "personal", external_ref: "in_pack", order_id: "order-1" })]);
      expect(orders.updateOrder).toHaveBeenCalledWith("order-1", expect.objectContaining({ status: "paid" }));
      expect(invoicing.startInvoicedSubscription).not.toHaveBeenCalled();
    });

    it("credits a plan's first period and then starts its subscription, noted on the order", async () => {
      expect((await send("invoice.paid", { id: "in_plan", status: "paid", customer: "cus_1", metadata: PLAN })).status).toBe(200);
      expect(inserts).toEqual([expect.objectContaining({ seconds: 40, plan_key: "creator", external_ref: "in_plan", note: "Subscription payment" })]);
      expect(invoicing.startInvoicedSubscription).toHaveBeenCalledWith(stripe, expect.objectContaining({ id: "in_plan", customer: "cus_1", paid: true }), "Creator");
      expect(orders.updateOrder).toHaveBeenCalledWith("order-plan", { stripe_subscription_id: "sub_new" });
    });

    it("lets Stripe retry when the subscription cannot be started", async () => {
      invoicing.startInvoicedSubscription.mockRejectedValueOnce(new Error("stripe down"));
      expect((await send("invoice.paid", { id: "in_plan", status: "paid", customer: "cus_1", metadata: PLAN })).status).toBe(500);
    });

    it("closes the order of a voided invoice, crediting nothing", async () => {
      await send("invoice.voided", { id: "in_pack", status: "void", customer: "cus_1", metadata: PACK });
      expect(inserts).toHaveLength(0);
      expect(orders.updateOrder).toHaveBeenCalledWith("order-1", { status: "expired" });
    });

    it("settles a change request paid on its invoice, with no seconds", async () => {
      const meta = { user_id: "u1", request_id: "req-9", project_id: "p1", purchase_type: "project_request", kind: "revision", flow: "invoice" };
      expect((await send("invoice.paid", { id: "in_req", status: "paid", customer: "cus_1", metadata: meta })).status).toBe(200);
      expect(inserts).toHaveLength(0);
      expect(updates).toContainEqual({ table: "project_requests", patch: expect.objectContaining({ status: "requested", stripe_session_id: "in_req" }), filters: [["id", "req-9"], ["user_id", "u1"], ["status", "awaiting_payment"]] });
    });

    it("leaves the team's own invoices and Checkout's invoices alone", async () => {
      await send("invoice.paid", { id: "in_custom", status: "paid", customer: "cus_1", metadata: { user_id: "u1", purchase_type: "custom_invoice" } });
      await send("invoice.paid", { id: "in_checkout", status: "paid", customer: "cus_1", metadata: { ...META, purchase_type: "one_time" } });
      expect(inserts).toHaveLength(0);
      expect(orders.updateOrder).not.toHaveBeenCalled();
    });
  });
});
