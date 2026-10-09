import { formatVideoTime } from "@/lib/account-info";
import { isApproved, projectFromRow, type ClientProject } from "@/lib/client-projects";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, teamInbox } from "@/lib/email/send";
import {
  approvedEmail,
  requestResolvedEmail,
  statusEmail,
  submittedEmail,
  teamAlertEmail,
  teamCommentEmail,
  type ProjectEmail,
} from "@/lib/email/project-emails";

/**
 * Which email a project event sends, and to whom - decided on the server from the database, never from what the browser
 * says happened. The browser only names the event (`/api/notifications/project`); here the project, the comment or the
 * request is read back with the service role, the caller must be the one who could have done it (the project's client,
 * or the team), and the thing must actually be so (the project really is in review, the comment really is theirs).
 * Resend's idempotency key makes every email once-only for 24 hours.
 */

export const PROJECT_EVENTS = ["submitted", "status", "approved", "revision", "comment", "change_request", "request_resolved"] as const;
export type ProjectEvent = (typeof PROJECT_EVENTS)[number];

/** Who is asking: a signed-in account, or the server itself (`system` - the Stripe webhook, once a change is paid for). */
export type Caller = { id: string; isTeam: boolean; system?: boolean };
export type NotifyInput = { projectId: string; event: ProjectEvent; commentId?: string | null; requestId?: string | null };
export type NotifyResult = { status: "sent" | "skipped" | "forbidden" | "not_found" | "not_configured"; sent: number };

type Owner = { id: string; email: string | null; name: string | null };
type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

async function loadProject(admin: Admin, projectId: string): Promise<{ project: ClientProject; owner: Owner } | null> {
  const { data: row } = await admin.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!row) return null;
  const project = projectFromRow(row as Record<string, unknown>);
  const ownerId = String((row as Record<string, unknown>).user_id ?? "");
  const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", ownerId).maybeSingle();
  return { project, owner: { id: ownerId, email: (profile?.email as string | null) ?? project.clientEmail, name: (profile?.full_name as string | null) ?? project.clientName } };
}

/** Sends a batch of emails; how many went (a missing address or a failure just counts as not sent). */
async function deliver(items: { to: string | null; email: ProjectEmail | null; key: string; tag: string; replyTo?: string }[]): Promise<number> {
  let sent = 0;
  for (const item of items) {
    if (!item.to || !item.email) continue;
    const result = await sendEmail({
      to: item.to,
      ...item.email,
      idempotencyKey: item.key,
      replyTo: item.replyTo,
      tags: [{ name: "kind", value: item.tag }],
    });
    if (result.ok) sent += 1;
  }
  return sent;
}

const done = (sent: number): NotifyResult => ({ status: sent > 0 ? "sent" : "skipped", sent });

export async function notifyProjectEvent(caller: Caller, input: NotifyInput, origin: string): Promise<NotifyResult> {
  const admin = createAdminClient();
  if (!admin) return { status: "not_configured", sent: 0 };
  const loaded = await loadProject(admin, input.projectId);
  if (!loaded) return { status: "not_found", sent: 0 };
  const { project: p, owner } = loaded;
  const isOwner = caller.id === owner.id;
  const client = { name: owner.name, email: owner.email };

  switch (input.event) {
    // The client sent a new project: their confirmation (the team already gets the brief from /api/quote).
    case "submitted": {
      if (!isOwner) return { status: "forbidden", sent: 0 };
      const fresh = Date.now() - new Date(p.createdAt).getTime() < 60 * 60 * 1000;
      if (!fresh) return done(0);
      return done(await deliver([{ to: owner.email, email: submittedEmail(p, owner.name, origin), key: `submitted:${p.id}`, tag: "submitted" }]));
    }

    // The team moved the project on: the stage it is in now decides the email (once per stage and revision round).
    case "status": {
      if (!caller.isTeam) return { status: "forbidden", sent: 0 };
      if (isApproved(p)) return done(0); // approved by the client - they already got the thank-you
      return done(
        await deliver([{ to: owner.email, email: statusEmail(p, owner.name, origin), key: `status:${p.id}:${p.status}:${p.revisionsUsed}`, tag: `status_${p.status}` }]),
      );
    }

    // The client approved: their thank-you (files + rating) and the team's alert.
    case "approved": {
      if (!isOwner) return { status: "forbidden", sent: 0 };
      if (!isApproved(p)) return done(0);
      return done(
        await deliver([
          { to: owner.email, email: approvedEmail(p, owner.name, origin), key: `approved:${p.id}`, tag: "approved" },
          { to: teamInbox(), email: teamAlertEmail(p, client, { kind: "approved" }, origin), key: `team-approved:${p.id}`, tag: "team_approved", replyTo: owner.email ?? undefined },
        ]),
      );
    }

    // The client asked for a revision: the team's alert, with the note (the newest entry of the revision log).
    case "revision": {
      if (!isOwner) return { status: "forbidden", sent: 0 };
      if (p.status !== "production" || p.revisionsUsed < 1) return done(0);
      const note = p.revisionHistory[p.revisionHistory.length - 1]?.title ?? "";
      return done(
        await deliver([
          {
            to: teamInbox(),
            email: teamAlertEmail(p, client, { kind: "revision", note }, origin),
            key: `team-revision:${p.id}:${p.revisionsUsed}`,
            tag: "team_revision",
            replyTo: owner.email ?? undefined,
          },
        ]),
      );
    }

    // A comment: from the team, it goes to the client; from the client, to the team. Only the comment's own author can ask.
    case "comment": {
      if (!isUuid(input.commentId)) return { status: "not_found", sent: 0 };
      const { data: c } = await admin.from("project_comments").select("id, user_id, author_name, is_team, body").eq("id", input.commentId).eq("project_id", p.id).maybeSingle();
      if (!c) return { status: "not_found", sent: 0 };
      if (String(c.user_id) !== caller.id) return { status: "forbidden", sent: 0 };
      const body = String(c.body ?? "");
      if (c.is_team) {
        if (!caller.isTeam) return { status: "forbidden", sent: 0 };
        return done(
          await deliver([{ to: owner.email, email: teamCommentEmail(p, owner.name, String(c.author_name ?? ""), body, origin), key: `comment:${c.id}`, tag: "team_comment" }]),
        );
      }
      if (!isOwner) return { status: "forbidden", sent: 0 };
      return done(
        await deliver([
          { to: teamInbox(), email: teamAlertEmail(p, client, { kind: "comment", body }, origin), key: `team-comment:${c.id}`, tag: "team_comment_alert", replyTo: owner.email ?? undefined },
        ]),
      );
    }

    // The client asked for a change - free, or paid (then the Stripe webhook calls this once the money is in).
    case "change_request": {
      if (!isOwner && !caller.system) return { status: "forbidden", sent: 0 };
      const req = await loadRequest(admin, input.requestId, p.id);
      if (!req || req.status !== "requested") return done(0);
      const cost = req.costCents > 0 ? `$${(req.costCents / 100).toFixed(2)}` : req.costSeconds > 0 ? formatVideoTime(req.costSeconds) : null;
      return done(
        await deliver([
          {
            to: teamInbox(),
            email: teamAlertEmail(p, client, { kind: "request", request: req.kind, cost }, origin),
            key: `team-request:${req.id}`,
            tag: "team_request",
            replyTo: owner.email ?? undefined,
          },
        ]),
      );
    }

    // The team approved or declined a change request: the client hears which, with the team's note.
    case "request_resolved": {
      if (!caller.isTeam) return { status: "forbidden", sent: 0 };
      const req = await loadRequest(admin, input.requestId, p.id);
      if (!req || (req.status !== "approved" && req.status !== "declined")) return done(0);
      return done(
        await deliver([
          {
            to: owner.email,
            email: requestResolvedEmail(p, owner.name, { kind: req.kind, status: req.status, teamNote: req.teamNote }, origin),
            key: `request:${req.id}:${req.status}`,
            tag: `request_${req.status}`,
          },
        ]),
      );
    }
  }
}

async function loadRequest(admin: Admin, requestId: string | null | undefined, projectId: string) {
  if (!isUuid(requestId)) return null;
  const { data } = await admin.from("project_requests").select("id, kind, status, cost_cents, cost_seconds, team_note").eq("id", requestId).eq("project_id", projectId).maybeSingle();
  if (!data) return null;
  return {
    id: String(data.id),
    kind: String(data.kind),
    status: String(data.status),
    costCents: Number(data.cost_cents) || 0,
    costSeconds: Number(data.cost_seconds) || 0,
    teamNote: (data.team_note as string | null) ?? null,
  };
}
