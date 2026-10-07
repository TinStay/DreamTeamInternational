import { bunny, bunnyMp4Url, bunnyThumbnailUrl } from "@/lib/bunny-stream";

/** The stages every project moves through, in order (`projects.status` in Supabase - see supabase/projects.sql). */
export const PROJECT_STATUSES = ["brief", "scripting", "production", "review", "delivered"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type TimelineStep = { title: string; date: string | null; note: string | null; done: boolean };

export type BriefAnswer = { label: string; value: string };
/**
 * A deliverable to download: uploaded by the team to the private bucket `project-deliveries` at `path` (opened through a
 * short-lived signed link), or - on older rows and the sample projects - a plain `url`.
 */
export type ProjectFile = { name: string; url: string | null; path: string | null; size: string | null };
/** The finished film in the private bucket `project-deliveries` (supabase/delivery.sql). */
export type DeliveryVideo = { name: string; path: string; size: number | null; type: string | null };
/** The private bucket the team uploads finished work to. */
export const DELIVERY_BUCKET = "project-deliveries";
/** A file the client attached when submitting: stored in the private Supabase bucket `project-files` at `path`. */
export type BriefFile = { name: string; path: string; size: number | null };
export type RevisionEntry = { title: string; date: string | null; done: boolean };

export type ClientProject = {
  id: string;
  title: string;
  kind: string;
  status: ProjectStatus;
  brief: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  durationSeconds: number | null;
  dueDate: string | null;
  revisionsTotal: number;
  revisionsUsed: number;
  createdAt: string;
  /** The custom timeline if the row has one, else `null` (the page derives the five standard stages). */
  timeline: TimelineStep[] | null;
  format: string | null;
  managerName: string | null;
  nextStep: string | null;
  /** What the client filled in when ordering. */
  briefAnswers: BriefAnswer[];
  files: ProjectFile[];
  /** The finished film, uploaded by the team (private - played through a signed link). */
  deliveryVideo: DeliveryVideo | null;
  /** When the client approved the video. */
  approvedAt: string | null;
  /** Revision requests so far (the count used is `revisionsUsed`). */
  revisionHistory: RevisionEntry[];
  /** Who owns it (the team dashboard shows the client). */
  userId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  /** The files the client attached when submitting. */
  briefFiles: BriefFile[];
  /** Team dashboard only: how many comments the thread has, and whether the client wrote last (needs a reply). */
  commentCount?: number;
  awaitingReply?: boolean;
};

/** One `projects` row from Supabase -> a `ClientProject` (tolerant: a malformed value falls back, never throws). */
export const formatBytes = (n: number | null) =>
  n == null
    ? ""
    : n < 1024 * 1024
      ? `${Math.max(1, Math.round(n / 1024))} KB`
      : n < 1024 * 1024 * 1024
        ? `${(n / 1024 / 1024).toFixed(1)} MB`
        : `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;

export function projectFromRow(row: Record<string, unknown>): ClientProject {
  const status = PROJECT_STATUSES.includes(row.status as ProjectStatus) ? (row.status as ProjectStatus) : "brief";
  const custom = Array.isArray(row.timeline)
    ? (row.timeline as Record<string, unknown>[])
        .filter((s) => s && typeof s.title === "string")
        .map((s) => ({
          title: String(s.title),
          date: typeof s.date === "string" ? s.date : null,
          note: typeof s.note === "string" ? s.note : null,
          done: Boolean(s.done),
        }))
    : [];
  const list = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]).filter((x) => x && typeof x === "object") : []);
  const text = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    kind: String(row.kind ?? ""),
    status,
    brief: typeof row.brief === "string" ? row.brief : null,
    thumbnailUrl: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
    videoId: typeof row.video_id === "string" && row.video_id ? row.video_id : null,
    durationSeconds: typeof row.duration_seconds === "number" ? row.duration_seconds : null,
    dueDate: typeof row.due_date === "string" ? row.due_date : null,
    revisionsTotal: typeof row.revisions_total === "number" ? row.revisions_total : 0,
    revisionsUsed: typeof row.revisions_used === "number" ? row.revisions_used : 0,
    createdAt: String(row.created_at ?? ""),
    timeline: custom.length > 0 ? custom : null,
    format: text(row.format),
    managerName: text(row.manager_name),
    nextStep: text(row.next_step),
    briefAnswers: list(row.brief_answers)
      .filter((a) => typeof a.label === "string" && typeof a.value === "string")
      .map((a) => ({ label: String(a.label), value: String(a.value) })),
    files: list(row.files)
      .filter((f) => typeof f.name === "string" && (typeof f.url === "string" || typeof f.path === "string"))
      .map((f) => ({
        name: String(f.name),
        url: text(f.url),
        path: text(f.path),
        size: typeof f.size === "number" ? formatBytes(f.size) : text(f.size),
      })),
    deliveryVideo: deliveryFrom(row.delivery_video),
    approvedAt: text(row.approved_at),
    userId: text(row.user_id),
    clientName: text(row.client_name),
    clientEmail: text(row.client_email),
    briefFiles: list(row.brief_files)
      .filter((f) => typeof f.name === "string" && typeof f.path === "string")
      .map((f) => ({ name: String(f.name), path: String(f.path), size: typeof f.size === "number" ? f.size : null })),
    revisionHistory: list(row.revisions)
      .filter((r) => typeof r.title === "string")
      .map((r) => ({ title: String(r.title), date: text(r.date), done: Boolean(r.done) })),
  };
}

function deliveryFrom(v: unknown): DeliveryVideo | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.path !== "string" || !o.path) return null;
  return {
    name: typeof o.name === "string" && o.name ? o.name : (o.path.split("/").pop() ?? "video.mp4"),
    path: o.path,
    size: typeof o.size === "number" ? o.size : null,
    type: typeof o.type === "string" ? o.type : null,
  };
}

/** The timeline to draw: the row's own, or the five standard stages with the finished ones ticked off. */
export function timelineFor(project: ClientProject, labels: Record<ProjectStatus, string>): (TimelineStep & { current: boolean })[] {
  const steps: TimelineStep[] =
    project.timeline ??
    PROJECT_STATUSES.map((status, index) => {
      const at = PROJECT_STATUSES.indexOf(project.status);
      return {
        title: labels[status],
        date: index === 0 ? project.createdAt.slice(0, 10) : status === "delivered" ? project.dueDate : null,
        note: null,
        done: index < at || (project.status === "delivered" && index === at),
      };
    });
  const currentIndex = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, current: i === currentIndex }));
}

/** How far along, 0-100: the standard stages by status. */
export function progressOf(project: ClientProject): number {
  return Math.round(((PROJECT_STATUSES.indexOf(project.status) + 1) / PROJECT_STATUSES.length) * 100);
}

export function projectPoster(project: ClientProject): string | null {
  return project.thumbnailUrl ?? (project.videoId ? bunnyThumbnailUrl(bunny(project.videoId)) : null);
}

/** Whether there is a finished film to watch (uploaded, or an older row's Bunny id). */
export const hasFilm = (project: ClientProject) => Boolean(project.deliveryVideo || project.videoId);

/** A film that needs no signed link: an older row's (or a sample's) Bunny id. An uploaded `deliveryVideo` wins over it. */
export function projectFilm(project: ClientProject): string | null {
  return project.videoId ? bunnyMp4Url(bunny(project.videoId), 720) : null;
}
