// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/team/invoices` - only the team bills a client, never across sites, and never without a billing address (Paddle
 * needs one on every invoice it issues).
 */
const CLIENT = "11111111-1111-1111-1111-111111111111";
const state = vi.hoisted(() => ({
  user: null as { id: string; app_metadata: { role?: string } } | null,
  addressId: null as string | null,
}));
const send = vi.hoisted(() =>
  vi.fn(async (...args: unknown[]) => (void args, { id: "txn_inv", status: "billed", invoice_number: "325-1", collection_mode: "manual", created_at: "2026-10-12T00:00:00Z", custom_data: null, details: { totals: { grand_total: "5000", tax: "0" } } })),
);
const customers = vi.hoisted(() => ({
  customerFor: vi.fn(async () => "ctm_1"),
  addressIdFor: vi.fn(async () => state.addressId),
  addAddress: vi.fn(async () => "add_new"),
}));

vi.mock("@/lib/paddle", async (orig) => ({ ...(await orig<typeof import("@/lib/paddle")>()), paddleConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: CLIENT, paddle_customer_id: "ctm_1" } }) }) }) }) }),
}));
vi.mock("@/lib/paddle-customers", () => customers);
vi.mock("@/lib/invoices", async (orig) => ({ ...(await orig<typeof import("@/lib/invoices")>()), sendCustomInvoice: send }));

const { POST } = await import("./route");

const body = { userId: CLIENT, lines: [{ description: "Product film", amountCents: 5000 }] };
const post = (b: unknown, headers: Record<string, string> = {}) =>
  POST(new Request("http://localhost:3000/api/team/invoices", { method: "POST", body: JSON.stringify(b), headers: { "Content-Type": "application/json", ...headers } }));

let n = 0;
beforeEach(() => {
  // A fresh team member each test, so the per-member rate limit never carries over.
  state.user = { id: `team-${++n}`, app_metadata: { role: "admin" } };
  state.addressId = "add_1";
  send.mockClear();
  customers.addAddress.mockClear();
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

  it("sends a valid invoice on the client's address on file, and refuses a malformed one", async () => {
    expect((await post({ ...body, lines: [{ description: "x", amountCents: 10 }] })).status).toBe(400);
    const res = await post(body);
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledWith("ctm_1", "add_1", CLIENT, expect.objectContaining({ daysUntilDue: 14 }), state.user!.id);
    expect((await res.json()).invoice).toMatchObject({ id: "txn_inv", status: "open", totalCents: 5000 });
  });

  it("wants a billing address before it sends - and adds one that is given", async () => {
    state.addressId = null;
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("address_required");
    const address = { line1: "1 Market St", city: "San Francisco", state: "CA", postal_code: "94105", country: "US" };
    expect((await post({ ...body, address })).status).toBe(200);
    expect(customers.addAddress).toHaveBeenCalledWith("ctm_1", expect.objectContaining({ state: "CA", country: "US" }));
    expect(send).toHaveBeenCalledWith("ctm_1", "add_new", CLIENT, expect.anything(), expect.any(String));
  });
});
