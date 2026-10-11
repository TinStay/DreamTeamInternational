// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Who may trigger which project email, and only when the database agrees it happened - the browser only names the event.
 */
const P = "11111111-2222-3333-4444-555555555555";
const OWNER = "aaaaaaaa-0000-0000-0000-000000000001";
const TEAM = "bbbbbbbb-0000-0000-0000-000000000002";
const COMMENT = "cccccccc-0000-0000-0000-000000000003";

const db = vi.hoisted(() => ({
  project: {} as Record<string, unknown>,
  comment: null as Record<string, unknown> | null,
  request: null as Record<string, unknown> | null,
}));
const sent = vi.hoisted(() => [] as { to: string; subject: string; idempotencyKey: string }[]);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const row = table === "projects" ? db.project : table === "profiles" ? { email: "ana@example.com", full_name: "Ana Petrova" } : table === "project_comments" ? db.comment : db.request;
      const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: row }) };
      return chain;
    },
  }),
}));
vi.mock("@/lib/email/send", () => ({
  teamInbox: () => "team@keplerbay.com",
  sendEmail: vi.fn(async (e: { to: string; subject: string; idempotencyKey: string }) => (sent.push(e), { ok: true, id: "em_1" })),
}));

const { notifyProjectEvent } = await import("@/lib/email/project-notifications");
const owner = { id: OWNER, isTeam: false };
const team = { id: TEAM, isTeam: true };
const notify = (caller: typeof owner, event: Parameters<typeof notifyProjectEvent>[1]["event"], extra = {}) => notifyProjectEvent(caller, { projectId: P, event, ...extra }, "https://keplerbay.com");

beforeEach(() => {
  sent.length = 0;
  db.project = { id: P, user_id: OWNER, title: "Launch film", status: "review", revisions_total: 2, revisions_used: 0, created_at: new Date().toISOString() };
  db.comment = null;
  db.request = null;
});

describe("notifyProjectEvent", () => {
  it("emails the client about a new stage - only when the team asks", async () => {
    expect((await notify(owner, "status")).status).toBe("forbidden");
    expect(sent).toHaveLength(0);
    const r = await notify(team, "status");
    expect(r).toEqual({ status: "sent", sent: 1 });
    expect(sent[0]).toMatchObject({ to: "ana@example.com", subject: "Your video is ready to review: Launch film", idempotencyKey: `status:${P}:review:0` });
  });

  it("sends the approval emails only when the project really is approved, and only for its client", async () => {
    expect((await notify(owner, "approved")).sent).toBe(0); // still in review
    db.project = { ...db.project, status: "delivered", approved_at: new Date().toISOString() };
    expect((await notify(team, "approved")).status).toBe("forbidden");
    expect((await notify(owner, "approved")).sent).toBe(2);
    expect(sent.map((e) => e.to)).toEqual(["ana@example.com", "team@keplerbay.com"]);
  });

  it("routes a comment by who wrote it, and refuses someone else's", async () => {
    db.comment = { id: COMMENT, user_id: TEAM, author_name: "Nikolay", is_team: true, body: "New cut is up" };
    expect((await notify(owner, "comment", { commentId: COMMENT })).status).toBe("forbidden");
    await notify(team, "comment", { commentId: COMMENT });
    expect(sent[0]).toMatchObject({ to: "ana@example.com", subject: "New message about Launch film" });

    db.comment = { id: COMMENT, user_id: OWNER, author_name: "Ana", is_team: false, body: "Looks great" };
    await notify(owner, "comment", { commentId: COMMENT });
    expect(sent[1]).toMatchObject({ to: "team@keplerbay.com" });
  });

  it("alerts the team to a change request only once it is really waiting for them", async () => {
    const REQ = "dddddddd-0000-0000-0000-000000000004";
    db.request = { id: REQ, kind: "deadline", status: "awaiting_payment", cost_cents: 5000, cost_seconds: 0 };
    expect((await notify(owner, "change_request", { requestId: REQ })).sent).toBe(0);
    db.request = { ...db.request, status: "requested" };
    expect((await notify({ id: "stripe-webhook", isTeam: false, system: true } as never, "change_request", { requestId: REQ })).sent).toBe(1);
    expect(sent[0].subject).toBe("Change request: Launch film (Ana Petrova)");
  });

  it("does not resend a brief confirmation for an old project", async () => {
    db.project = { ...db.project, status: "brief", created_at: "2026-01-01T00:00:00Z" };
    expect((await notify(owner, "submitted")).sent).toBe(0);
  });
});
