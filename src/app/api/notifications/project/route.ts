import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeamUser } from "@/lib/team";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";
import { PROJECT_EVENTS, isUuid, notifyProjectEvent, type ProjectEvent } from "@/lib/email/project-notifications";

export const runtime = "nodejs";

// A busy team member saving stages and replying to comments - well under this.
const isRateLimited = createRateLimiter(60_000, 30);

const STATUS: Record<string, number> = { sent: 200, skipped: 200, forbidden: 403, not_found: 404, not_configured: 503 };

/**
 * `POST { projectId, event, commentId?, requestId? }` - the app says something happened to a project (the team moved it
 * to a new stage, the client approved it, someone wrote a comment…) and the right person gets an email
 * (`lib/email/project-notifications.ts`). The browser only names the event: who gets what, and whether it is true, is
 * read from the database. Fire and forget - the caller never waits on it.
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { projectId?: unknown; event?: unknown; commentId?: unknown; requestId?: unknown };
  if (!isUuid(body.projectId) || !PROJECT_EVENTS.includes(body.event as ProjectEvent)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const result = await notifyProjectEvent(
    { id: auth.user.id, isTeam: isTeamUser(auth.user) },
    {
      projectId: body.projectId,
      event: body.event as ProjectEvent,
      commentId: typeof body.commentId === "string" ? body.commentId : null,
      requestId: typeof body.requestId === "string" ? body.requestId : null,
    },
    new URL(request.url).origin,
  );
  return NextResponse.json(result, { status: STATUS[result.status] ?? 200 });
}
