import { ONE_TIME } from "@/lib/pricing";
import type { ClientProject, ProjectStatus } from "@/lib/client-projects";

/**
 * Change requests on a project and the client's rating of it - the rules the browser shows. The database applies the
 * same rules and works out every price itself (`request_project_change()` in supabase/changes.sql): **keep the two in step.**
 *
 * - **Deadline**: $50 for every day it moves closer (moving it later is free), never sooner than 2 days from today.
 * - **Length**: the extra seconds come from the client's video time; seconds they don't have are bought on the spot at the
 *   one-time price (`TOPUP_CENTS_PER_SECOND`, $11.90), up to a 10-minute film.
 * - **Format**: one more format costs as many seconds as the film is long (missing seconds bought the same way).
 * - **Revision**: $49 for one more.
 * Seconds are spent when the request is sent and given back if the team declines it; a paid request goes through Stripe
 * before the team sees it.
 */
export const CHANGE_PRICES = { deadlinePerDayCents: 5000, extraRevisionCents: 4900 } as const;
export const DEADLINE_MIN_LEAD_DAYS = 2;
export const DURATION_STEP = 5;
/** The longest film a request can make. */
export const MAX_FILM_SECONDS = 600;
/** A second bought outside a plan: the one-time order's price for extra length ($119 per 10 seconds). */
export const TOPUP_CENTS_PER_SECOND = Math.round((ONE_TIME.extra * 100) / ONE_TIME.step);

/** Seconds a request costs, split into what the video time covers and what is bought (and for how much). */
export function splitCost(seconds: number, balance: number): { fromBalance: number; bought: number; cents: number } {
  const fromBalance = Math.min(seconds, Math.max(0, balance));
  const bought = seconds - fromBalance;
  return { fromBalance, bought, cents: bought * TOPUP_CENTS_PER_SECOND };
}

export type ChangeKind = "deadline" | "duration" | "format" | "revision";
export const CHANGE_KINDS: ChangeKind[] = ["deadline", "duration", "format", "revision"];

/** The stages a request can be made in (never once the film is delivered or approved). */
export const CHANGE_STAGES: Record<ChangeKind, ProjectStatus[]> = {
  deadline: ["brief", "scripting", "production"],
  duration: ["brief", "scripting", "production"],
  format: ["brief", "scripting", "production", "review"],
  revision: ["scripting", "production", "review"],
};

export function canRequest(project: Pick<ClientProject, "status" | "approvedAt">, kind: ChangeKind): boolean {
  return !project.approvedAt && CHANGE_STAGES[kind].includes(project.status);
}

// ---------------------------------------------------------------- formats

export type FormatKey = "vertical" | "horizontal" | "classic" | "portrait" | "square" | "cinema";
/**
 * The formats a film can be made in; `label` is what is stored on the project (and what the database accepts). The two
 * `primary` ones lead the picker as bigger cards.
 */
export const FORMAT_OPTIONS: { key: FormatKey; label: string; ratio: [number, number]; primary?: boolean }[] = [
  { key: "vertical", label: "9:16 vertical", ratio: [9, 16], primary: true },
  { key: "horizontal", label: "16:9 horizontal", ratio: [16, 9], primary: true },
  { key: "classic", label: "4:3 classic", ratio: [4, 3] },
  { key: "portrait", label: "3:4 portrait", ratio: [3, 4] },
  { key: "square", label: "1:1 square", ratio: [1, 1] },
  { key: "cinema", label: "21:9 cinema", ratio: [21, 9] },
];

const RATIO_OF: Record<FormatKey, string> = { vertical: "9:16", horizontal: "16:9", classic: "4:3", portrait: "3:4", square: "1:1", cinema: "21:9" };
const WORD_OF: [string, FormatKey][] = [["vertical", "vertical"], ["horizontal", "horizontal"], ["landscape", "horizontal"], ["classic", "classic"], ["portrait", "portrait"], ["4:5", "portrait"], ["square", "square"], ["cinema", "cinema"], ["widescreen", "cinema"]];

/** The formats a project's format text names ("9:16 vertical + 1:1 square", "16:9", "Vertical"), in order, no repeats. */
export function formatsOf(text: string | null | undefined): FormatKey[] {
  if (!text) return [];
  const found: FormatKey[] = [];
  for (const part of text.split(/\s*(?:\+|,|\/|&|\band\b)\s*/i)) {
    const p = part.toLowerCase();
    const key = (Object.keys(RATIO_OF) as FormatKey[]).find((k) => new RegExp(`(^|[^0-9])${RATIO_OF[k]}($|[^0-9])`).test(p)) ?? WORD_OF.find(([w]) => p.includes(w))?.[1] ?? null;
    if (key && !found.includes(key)) found.push(key);
  }
  return found;
}

// ---------------------------------------------------------------- length

/**
 * How far the length slider goes: past the video time left - the missing seconds can be bought - by up to two minutes,
 * never beyond a 10-minute film, in whole steps.
 */
export function maxExtraSeconds(current: number, balance: number): number {
  const room = Math.min(MAX_FILM_SECONDS - current, Math.floor(Math.max(0, balance) / DURATION_STEP) * DURATION_STEP + 120);
  return Math.max(0, Math.floor(room / DURATION_STEP) * DURATION_STEP);
}

// ---------------------------------------------------------------- deadline

const dayNumber = (iso: string) => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000);
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The soonest a deadline can be moved to: two days from today. */
export function minDeadline(today = new Date()): string {
  const d = new Date(today);
  d.setDate(d.getDate() + DEADLINE_MIN_LEAD_DAYS);
  return isoDate(d);
}

/** What moving the deadline costs: $50 for every day closer, nothing for later (or for a first date). */
export function deadlineCost(currentDue: string | null, nextDue: string): { daysEarlier: number; cents: number } {
  const daysEarlier = currentDue ? Math.max(0, dayNumber(currentDue.slice(0, 10)) - dayNumber(nextDue)) : 0;
  return { daysEarlier, cents: daysEarlier * CHANGE_PRICES.deadlinePerDayCents };
}

// ---------------------------------------------------------------- requests

export type RequestStatus = "awaiting_payment" | "requested" | "approved" | "declined" | "cancelled";
export type ProjectRequest = {
  id: string;
  projectId: string;
  kind: ChangeKind;
  details: Record<string, unknown>;
  costSeconds: number;
  costCents: number;
  status: RequestStatus;
  paidAt: string | null;
  teamNote: string | null;
  createdAt: string;
};

const STATUSES: RequestStatus[] = ["awaiting_payment", "requested", "approved", "declined", "cancelled"];

export function requestFromRow(row: Record<string, unknown>): ProjectRequest {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    kind: (CHANGE_KINDS.includes(row.kind as ChangeKind) ? row.kind : "deadline") as ChangeKind,
    details: row.details && typeof row.details === "object" ? (row.details as Record<string, unknown>) : {},
    costSeconds: typeof row.cost_seconds === "number" ? row.cost_seconds : 0,
    costCents: typeof row.cost_cents === "number" ? row.cost_cents : 0,
    status: (STATUSES.includes(row.status as RequestStatus) ? row.status : "requested") as RequestStatus,
    paidAt: typeof row.paid_at === "string" ? row.paid_at : null,
    teamNote: typeof row.team_note === "string" && row.team_note ? row.team_note : null,
    createdAt: String(row.created_at ?? ""),
  };
}

/** An open request of this kind blocks another one (the database allows one at a time). */
export const isOpen = (r: ProjectRequest) => r.status === "awaiting_payment" || r.status === "requested";

/** The database's refusals, as the dictionary's error keys (`projectsPage.changes.errors`). */
export type RequestError = "insufficient_credits" | "over_max_length" | "invalid_date" | "format_included" | "request_open" | "project_closed" | "not_allowed_now" | "generic";
export function requestErrorOf(message: string | null | undefined): RequestError {
  const known: RequestError[] = ["insufficient_credits", "over_max_length", "invalid_date", "format_included", "request_open", "project_closed", "not_allowed_now"];
  return known.find((k) => message?.includes(k)) ?? "generic";
}

// ---------------------------------------------------------------- reviews

export const REVIEW_ASPECTS = ["quality", "speed", "attitude"] as const;
export type ReviewAspect = (typeof REVIEW_ASPECTS)[number];
export type ProjectReview = Record<ReviewAspect, number> & { comment: string | null; updatedAt: string | null };

export function reviewFromRow(row: Record<string, unknown> | null | undefined): ProjectReview | null {
  if (!row) return null;
  const n = (v: unknown) => (typeof v === "number" && v >= 1 && v <= 5 ? v : null);
  const quality = n(row.quality);
  const speed = n(row.speed);
  const attitude = n(row.attitude);
  if (!quality || !speed || !attitude) return null;
  return { quality, speed, attitude, comment: typeof row.comment === "string" && row.comment ? row.comment : null, updatedAt: typeof row.updated_at === "string" ? row.updated_at : null };
}

/** The overall rating: the three aspects' average, to one decimal. */
export const reviewAverage = (r: Record<ReviewAspect, number>) => Math.round(((r.quality + r.speed + r.attitude) / 3) * 10) / 10;
