// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/team/invoices` - only the team bills a client, never across sites, and with tax on an invoice is never sent to a
 * client Stripe cannot tax (no billing address).
 */
const CLIENT = "11111111-1111-1111-1111-111111111111";
const state = vi.hoisted(() => ({
  user: null as { id: string; app_metadata: { role?: string } } | null,
  customerAddress: null as { country: string } | null,
}));
const send = vi.hoisted(() => vi.fn(async () => ({ id: "in_1", number: "KEPL-0001", created: 1_760_000_000, total: 5000, total_excluding_tax: 5000, currency: "usd", status: "open", lines: { data: [] } })));
const stripe = { customers: { retrieve: vi.fn(async () => ({ id: "cus_1", address: state.customerAddress })), update: vi.fn(async () => ({})) } };

vi.mock("@/lib/stripe", () => ({ getStripe: () => stripe }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: CLIENT, stripe_customer_id: "cus_1" } }) }) }) }) }),
}));
vi.mock("@/lib/stripe-customers", () => ({ customerFor: vi.fn(async () => "cus_1") }));
vi.mock("@/lib/invoices", async (orig) => ({ ...(await orig<typeof import("@/lib/invoices")>()), sendCustomInvoice: send }));

const { POST } = await import("./route");

const body = { userId: CLIENT, lines: [{ description: "Product film", amountCents: 5000 }] };
const post = (b: unknown, headers: Record<string, string> = {}) =>
  POST(new Request("http://localhost:3000/api/team/invoices", { method: "POST", body: JSON.stringify(b), headers: { "Content-Type": "application/json", ...headers } }));

beforeEach(() => {
  state.user = { id: "team-1", app_metadata: { role: "admin" } };
  state.customerAddress = null;
  send.mockClear();
  stripe.customers.update.mockClear();
  vi.unstubAllEnvs();
});

describe("/api/team/invoices", () => {
  it("needs a signed-in team member", async () => {
    state.user = null;
    expect((await post(body)).status).toBe(401);
    state.user = { id: "client-1", app_metadata: {} };
    expect((await post(body)).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it("refuses a request from another site", async () => {
    expect((await post(body, { origin: "https://evil.example" })).status).toBe(403);
  });

  it("sends a valid invoice and refuses a malformed one", async () => {
    expect((await post({ ...body, lines: [{ description: "x", amountCents: 10 }] })).status).toBe(400);
    const res = await post(body);
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
  });

  it("with tax on, wants a billing address before it sends - and saves one that is given", async () => {
    vi.stubEnv("STRIPE_TAX_ENABLED", "true");
    state.user = { id: "team-2", app_metadata: { role: "admin" } };
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("address_required");
    const address = { line1: "1 Market St", city: "San Francisco", state: "CA", postal_code: "94105", country: "US" };
    expect((await post({ ...body, address })).status).toBe(200);
    expect(stripe.customers.update).toHaveBeenCalledWith("cus_1", { address: expect.objectContaining({ state: "CA" }) });
  });
});
