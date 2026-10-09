import { PROJECT_STATUSES, isApproved, type ClientProject } from "@/lib/client-projects";
import { formatDateDisplay } from "@/lib/dates";
import { myProjectPath, teamPath } from "@/lib/routes";
import { renderBrandEmail, type EmailButton, type EmailFact } from "@/lib/email/layout";
import { clientEmail, copy, fill, firstName, type ProjectEmail } from "@/lib/email/compose";

export type { ProjectEmail } from "@/lib/email/compose";

/**
 * Every email a video project sends, built from the project as it is in the database and the copy in `en.ts`
 * (`emails`). Client emails take the client back into the app with buttons that open the right place on their project
 * page - the review card, the revision form, the files, the comments, the rating; team alerts open the project's window
 * in the team dashboard. The site is English only, so the emails are too.
 */

type Project = Pick<ClientProject, "id" | "title" | "status" | "dueDate" | "durationSeconds" | "format" | "revisionsTotal" | "revisionsUsed" | "approvedAt">;

/** A film's length the way people say it: "45 sec", "1 min", "1 min 30 sec". */
const length = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m === 0 ? `${s} sec` : s === 0 ? `${m} min` : `${m} min ${s} sec`;
};
/** Quoted text in an email: trimmed, and cut at a sensible length. */
const excerpt = (text: string, max = 900) => (text.trim().length > max ? `${text.trim().slice(0, max).trimEnd()}…` : text.trim());

/** Links back into the app - absolute, on the site the request came from (localhost in dev, the live domain in production). */
function links(origin: string, id: string) {
  const page = `${origin}${myProjectPath("en", id)}`;
  return {
    page,
    approve: `${page}?action=approve`,
    files: `${page}#project-files`,
    comments: `${page}#project-comments`,
    review: `${page}#review`,
    team: `${origin}${teamPath("en")}?project=${id}`,
  };
}

function facts(p: Project, extra: EmailFact[] = []): EmailFact[] {
  const e = copy();
  const rows: EmailFact[] = [{ label: e.facts.project, value: p.title }];
  rows.push({ label: e.facts.stage, value: e.stageNames[p.status] ?? p.status });
  if (p.dueDate && p.status !== "delivered") rows.push({ label: e.facts.due, value: formatDateDisplay(p.dueDate.slice(0, 10)) });
  if (p.durationSeconds) rows.push({ label: e.facts.length, value: length(p.durationSeconds) });
  if (p.format) rows.push({ label: e.facts.format, value: p.format });
  return [...rows, ...extra];
}

function progress(p: Project) {
  const step = PROJECT_STATUSES.indexOf(p.status) + 1;
  return { step, label: `${copy().stageNames[p.status] ?? p.status} · ${fill(copy().progress, { step })}` };
}

/** The client sent a new project. */
export function submittedEmail(p: Project, name: string | null, origin: string): ProjectEmail {
  const c = copy().submitted;
  const l = links(origin, p.id);
  return clientEmail(fill(c.subject, { title: p.title }), name, {
    eyebrow: c.eyebrow,
    title: c.title,
    paragraphs: [fill(c.intro, { title: p.title }), c.body],
    progress: progress(p),
    facts: facts(p),
    buttons: [{ label: copy().buttons.open, href: l.page }],
  });
}

/**
 * The team moved the project to a new stage - or `null` for a stage with nothing to tell (the brief). Ready for review
 * carries the two decisions as buttons; a rework after a revision request reads as such.
 */
export function statusEmail(p: Project, name: string | null, origin: string): ProjectEmail | null {
  const e = copy();
  const l = links(origin, p.id);
  if (p.status === "brief") return null;
  if (p.status === "review") {
    const c = e.status.review;
    const left = Math.max(0, p.revisionsTotal - p.revisionsUsed);
    // One button: approving or asking for changes both happen on the project page, under the film.
    const buttons: EmailButton[] = [{ label: e.buttons.approve, href: l.approve }];
    return clientEmail(fill(c.subject, { title: p.title }), name, {
      eyebrow: c.eyebrow,
      title: c.title,
      paragraphs: [fill(c.intro, { title: p.title }), left > 0 ? fill(c.body, { left, total: p.revisionsTotal }) : c.bodyNoRevisions],
      progress: progress(p),
      facts: facts(p, [{ label: e.facts.revisions, value: `${left} / ${p.revisionsTotal}` }]),
      buttons,
    });
  }
  if (p.status === "delivered") {
    const c = e.status.delivered;
    return clientEmail(fill(c.subject, { title: p.title }), name, {
      eyebrow: c.eyebrow,
      title: c.title,
      paragraphs: [fill(c.intro, { title: p.title }), c.body],
      progress: progress(p),
      facts: facts(p),
      buttons: [
        { label: e.buttons.download, href: l.files },
        ...(isApproved(p) ? [] : [{ label: e.buttons.open, href: l.page, variant: "secondary" as const }]),
      ],
    });
  }
  const c = p.status === "production" && p.revisionsUsed > 0 ? e.status.reworking : e.status[p.status];
  return clientEmail(fill(c.subject, { title: p.title }), name, {
    eyebrow: c.eyebrow,
    title: c.title,
    paragraphs: [fill(c.intro, { title: p.title }), c.body],
    progress: progress(p),
    facts: facts(p),
    buttons: [{ label: e.buttons.follow, href: l.page }],
  });
}

/** The client approved their video: thanks, the files, and the rating. */
export function approvedEmail(p: Project, name: string | null, origin: string): ProjectEmail {
  const e = copy();
  const c = e.approved;
  const l = links(origin, p.id);
  return clientEmail(fill(c.subject, { title: p.title }), name, {
    eyebrow: c.eyebrow,
    title: c.title,
    paragraphs: [fill(c.intro, { title: p.title }), c.body],
    progress: progress(p),
    buttons: [
      { label: e.buttons.download, href: l.files },
      { label: e.buttons.rate, href: l.review, variant: "secondary" },
    ],
  });
}

/** A team member wrote in the project's comments. */
export function teamCommentEmail(p: Project, name: string | null, author: string, body: string, origin: string): ProjectEmail {
  const e = copy();
  const c = e.teamComment;
  const who = firstName(author) || e.signoff;
  return clientEmail(fill(c.subject, { title: p.title }), name, {
    eyebrow: c.eyebrow,
    title: fill(c.title, { name: who }),
    paragraphs: [fill(c.intro, { title: p.title })],
    quote: { label: author || undefined, text: excerpt(body) },
    buttons: [{ label: e.buttons.reply, href: links(origin, p.id).comments }],
  });
}

/** The team approved or declined a change request (an earlier deadline, a longer cut, a format, an extra revision). */
export function requestResolvedEmail(p: Project, name: string | null, request: { kind: string; status: "approved" | "declined"; teamNote: string | null }, origin: string): ProjectEmail {
  const e = copy();
  const c = e.request[request.status];
  const kind = e.request.kinds[request.kind] ?? request.kind;
  return clientEmail(fill(c.subject, { title: p.title }), name, {
    eyebrow: c.eyebrow,
    title: c.title,
    paragraphs: [fill(c.intro, { title: p.title, kind }), c.body],
    quote: request.teamNote ? { label: e.request.note, text: excerpt(request.teamNote) } : undefined,
    facts: facts(p),
    buttons: [{ label: e.buttons.open, href: links(origin, p.id).page }],
  });
}

export type TeamAlert =
  | { kind: "approved" }
  | { kind: "revision"; note: string }
  | { kind: "comment"; body: string }
  | { kind: "request"; request: string; cost: string | null };

/** What a client did, for the team inbox - with the button that opens the project in the dashboard. */
export function teamAlertEmail(p: Project, client: { name: string | null; email: string | null }, alert: TeamAlert, origin: string): ProjectEmail {
  const e = copy();
  const c = e.team[alert.kind];
  const who = client.name?.trim() || client.email || "A client";
  const kind = alert.kind === "request" ? (e.request.kinds[alert.request] ?? alert.request) : "";
  const subject = fill(c.subject, { title: p.title, client: who });
  const quote = alert.kind === "revision" ? alert.note : alert.kind === "comment" ? alert.body : "";
  const extra: EmailFact[] = [{ label: e.facts.client, value: client.email ? `${who} (${client.email})` : who }];
  if (alert.kind === "request" && alert.cost) extra.push({ label: e.facts.cost, value: alert.cost });
  const { html, text } = renderBrandEmail({
    preheader: fill(c.intro, { title: p.title, client: who, kind }),
    eyebrow: e.team.eyebrow,
    title: fill(c.title, { client: who }),
    paragraphs: [fill(c.intro, { title: p.title, client: who, kind })],
    quote: quote ? { text: excerpt(quote) } : undefined,
    facts: facts(p, extra),
    buttons: [{ label: e.buttons.team, href: links(origin, p.id).team }],
    footnotes: [e.teamReason],
  });
  return { subject, html, text };
}
