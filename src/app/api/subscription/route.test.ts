// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/subscription` - the client cancels (or resumes) their own plan. Only from our own pages, only signed in, only
 * the two actions, and the error says what went wrong.
 */
const state = vi.hoisted(() => ({ user: { id: "u1" } as { id: string } | null }));
const setCancel = vi.hoisted(() =>
  vi.fn(async (_stripe: unknown, _uid: string, cancel: boolean): Promise<{ ok: true; cancelAtPeriodEnd: boolean; periodEnd: string | null } | { ok: false; error: string }> => ({
    ok: true,
    cancelAtPeriodEnd: cancel,
    periodEnd: "2026-11-08T00:00:00Z",
  }))
);

vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ fake: true }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock("@/lib/subscriptions", () => ({ setCancelAtPeriodEnd: setCancel }));

const { POST } = await import("./route");

const post = (body: unknown, headers: Record<string, string> = { origin: "http://localhost:3000" }) =>
  POST(new Request("http://localhost:3000/api/subscription", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers: { "Content-Type": "application/json", ...headers } }));

let n = 0;
beforeEach(() => {
  // A fresh client each test, so the per-client rate limit never carries over.
  state.user = { id: `u${++n}` };
  setCancel.mockClear();
});

describe("/api/subscription", () => {
  it("cancels the signed-in client's own subscription at the period's end", async () => {
    const res = await post({ action: "cancel" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cancelAtPeriodEnd: true, periodEnd: "2026-11-08T00:00:00Z" });
    expect(setCancel).toHaveBeenCalledWith({ fake: true }, state.user!.id, true);
  });

  it("resumes it", async () => {
    expect(await (await post({ action: "resume" })).json()).toMatchObject({ cancelAtPeriodEnd: false });
    expect(setCancel.mock.calls[0][2]).toBe(false);
  });

  it("refuses another site (CSRF), an unknown action, a broken body and a signed-out visitor", async () => {
    expect((await post({ action: "cancel" }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await post({ action: "delete" })).status).toBe(400);
    expect((await post("{not json")).status).toBe(400);
    state.user = null;
    expect((await post({ action: "cancel" })).status).toBe(401);
    expect(setCancel).not.toHaveBeenCalled();
  });

  it("maps the outcome to a status: no plan 404, not set up 503, Stripe failed 502", async () => {
    for (const [error, status] of [["no_subscription", 404], ["not_configured", 503], ["failed", 502]] as const) {
      setCancel.mockResolvedValueOnce({ ok: false, error });
      const res = await post({ action: "cancel" });
      expect(res.status).toBe(status);
      expect(await res.json()).toEqual({ error });
    }
  });

  it("blunts a burst from one client", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await post({ action: "cancel" })).status);
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
  });
});
