// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/project-requests/checkout` - paying for a change request. Only the client's own request, only while it waits for
 * payment, and always for the amount the database worked out - never one from the browser.
 */
const state = vi.hoisted(() => ({
  user: { id: "u1", email: "client@example.com" } as { id: string; email: string } | null,
  row: null as Record<string, unknown> | null,
  filters: [] as [string, unknown][],
  updates: [] as Record<string, unknown>[],
}));
const create = vi.hoisted(() => vi.fn(async (...args: [Record<string, unknown>]) => (void args, { id: "cs_req", url: "https://checkout.stripe.com/c/cs_req" })));

const flow = vi.hoisted(() => ({ value: "checkout" as "checkout" | "invoice" }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ checkout: { sessions: { create } } }), paymentsPaused: () => false, purchaseFlow: () => flow.value }));
const invoicing = vi.hoisted(() => ({
  sendOrderInvoice: vi.fn(async (...args: [unknown, Record<string, unknown>]) => (void args, { id: "in_req_1", number: "000000-0091", customer_email: "client@example.com", total: 15000, total_excluding_tax: 15000, currency: "usd", created: 1794000000, due_date: 1794604800, status: "open" })),
  voidOpenOrderInvoices: vi.fn(async (...args: [unknown, string, (m: Record<string, string>) => boolean]) => (void args, [] as string[])),
}));
vi.mock("@/lib/invoice-orders", () => invoicing);
const billing = vi.hoisted(() => ({ saveBillingDetails: vi.fn(async () => true), billingDetailsOf: vi.fn(async (): Promise<{ name: string; address: unknown; company: boolean } | null> => null) }));
vi.mock("@/lib/billing-details", async (original) => ({ ...(await original<typeof import("@/lib/billing-details")>()), ...billing }));
vi.mock("@/lib/stripe-customers", () => ({ customerFor: vi.fn(async () => "cus_test_1") }));
vi.mock("@/lib/subscriptions", () => ({ hasLiveSubscription: vi.fn(async () => false) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => {
        const chain = {
          eq: (col: string, val: unknown) => (state.filters.push([col, val]), chain),
          maybeSingle: async () => ({ data: state.row }),
        };
        return chain;
      },
      update: (patch: Record<string, unknown>) => ({ eq: async () => (state.updates.push(patch), { error: null }) }),
    }),
  }),
}));

const { POST } = await import("./route");

const ID = "0f8a3b2c-1d4e-4f5a-9b6c-7d8e9f0a1b2c";
const post = (body: unknown, origin = "http://localhost:3000") =>
  POST(new Request("http://localhost:3000/api/project-requests/checkout", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json", origin } }));

let n = 0;
beforeEach(() => {
  flow.value = "checkout";
  invoicing.sendOrderInvoice.mockClear();
  invoicing.voidOpenOrderInvoices.mockClear();
  billing.billingDetailsOf.mockReset().mockResolvedValue(null);
  billing.saveBillingDetails.mockClear().mockResolvedValue(true);
  state.user = { id: `u${++n}`, email: "client@example.com" };
  state.row = { id: ID, project_id: "p1", user_id: state.user.id, kind: "deadline", cost_cents: 15000, status: "awaiting_payment", projects: { title: "Holiday Spot" } };
  state.filters.length = 0;
  state.updates.length = 0;
  create.mockClear();
});

describe("/api/project-requests/checkout", () => {
  it("opens a Stripe payment for exactly the request's price, marked as a project request", async () => {
    const res = await post({ requestId: ID, amount: 1 /* ignored */ });
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/c/cs_req" });
    const s = create.mock.calls[0][0] as { mode: string; line_items: { price_data: { unit_amount: number } }[]; metadata: Record<string, string>; success_url: string };
    expect(s.mode).toBe("payment");
    expect(s.line_items[0].price_data.unit_amount).toBe(15000);
    expect(s.metadata).toMatchObject({ request_id: ID, purchase_type: "project_request", user_id: state.user!.id });
    expect(s.success_url).toBe("http://localhost:3000/en/my-projects/p1?request=paid");
    // Only this client's request was looked up, and the session is remembered on it.
    expect(state.filters).toContainEqual(["user_id", state.user!.id]);
    expect(state.updates).toEqual([{ stripe_session_id: "cs_req" }]);
  });

  it("refuses another client's request, one already paid or free, a bad id, a signed-out visitor and another site", async () => {
    state.row = null;
    expect((await post({ requestId: ID })).status).toBe(404);
    state.row = { id: ID, project_id: "p1", kind: "revision", cost_cents: 4900, status: "requested" };
    expect((await post({ requestId: ID })).status).toBe(409);
    state.row = { id: ID, project_id: "p1", kind: "duration", cost_cents: 0, status: "awaiting_payment" };
    expect((await post({ requestId: ID })).status).toBe(409);
    expect((await post({ requestId: "../x" })).status).toBe(400);
    expect((await post({ requestId: ID }, "https://evil.example")).status).toBe(403);
    state.user = null;
    expect((await post({ requestId: ID })).status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("/api/project-requests/checkout - paid by invoice", () => {
  const DETAILS = { name: "Ada Client", address: { line1: "1 Main St", city: "Austin", state: "TX", postal_code: "78701", country: "US" } };

  it("asks for the billing details first when Stripe holds no address for the client", async () => {
    flow.value = "invoice";
    const res = await post({ requestId: ID });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "billing_required" });
    expect(invoicing.sendOrderInvoice).not.toHaveBeenCalled();
  });

  it("emails the request's invoice for the database's amount, replacing its earlier one", async () => {
    flow.value = "invoice";
    const res = await post({ requestId: ID, details: DETAILS });
    expect(res.status).toBe(200);
    expect((await res.json()).invoice).toMatchObject({ number: "000000-0091", email: "client@example.com", totalCents: 15000 });
    expect(create).not.toHaveBeenCalled();
    const order = invoicing.sendOrderInvoice.mock.calls[0][1] as { amountCents: number; metadata: Record<string, string> };
    expect(order.amountCents).toBe(15000);
    expect(order.metadata).toMatchObject({ purchase_type: "project_request", request_id: ID, project_id: "p1" });
    expect(invoicing.voidOpenOrderInvoices.mock.calls[0][2]({ request_id: ID })).toBe(true);
    expect(state.updates).toContainEqual({ stripe_session_id: "in_req_1" });
  });

  it("uses the address Stripe already holds, without asking again", async () => {
    flow.value = "invoice";
    billing.billingDetailsOf.mockResolvedValue({ name: "Ada", address: DETAILS.address, company: false });
    expect((await post({ requestId: ID })).status).toBe(200);
    expect(billing.saveBillingDetails).not.toHaveBeenCalled();
  });
});
