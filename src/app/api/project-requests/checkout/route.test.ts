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

vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ checkout: { sessions: { create } } }) }));
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
