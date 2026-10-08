import { PLAN_SECONDS } from "@/lib/credits";

/** A client as the team's Clients tab lists them - one `client_overview` row (supabase/profiles.sql). */
export type ClientOverview = {
  id: string;
  email: string | null;
  fullName: string | null;
  company: string | null;
  phone: string | null;
  country: string | null;
  isTeam: boolean;
  createdAt: string;
  balanceSeconds: number;
  projectCount: number;
  openProjects: number;
  /** The live subscription's pack, if any. */
  planKey: string | null;
  /** Stripe's status of the latest subscription (active, past_due, canceled, ...), if they ever had one. */
  subscriptionStatus: string | null;
  lastActivity: string | null;
};

/** One of the team's private notes about a client (`client_notes`). */
export type ClientNote = { id: string; authorName: string | null; body: string; createdAt: string };

/** One change to the client's video seconds (`credit_ledger`), newest first in the client window. */
export type LedgerRow = { id: string; seconds: number; kind: string; planKey: string | null; note: string | null; projectId: string | null; createdAt: string };

/** The profile fields the client and the team may edit. */
export type ProfileFields = { fullName: string; company: string; phone: string; country: string };

const text = (v: unknown) => (typeof v === "string" && v ? v : null);
const int = (v: unknown) => (typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10) || 0);

export function clientFromRow(row: Record<string, unknown>): ClientOverview {
  const plan = text(row.plan_key);
  return {
    id: String(row.id),
    email: text(row.email),
    fullName: text(row.full_name),
    company: text(row.company),
    phone: text(row.phone),
    country: text(row.country),
    isTeam: Boolean(row.is_team),
    createdAt: String(row.created_at ?? ""),
    balanceSeconds: int(row.balance_seconds),
    projectCount: int(row.project_count),
    openProjects: int(row.open_projects),
    planKey: plan && plan in PLAN_SECONDS ? plan : null,
    subscriptionStatus: text(row.subscription_status),
    lastActivity: text(row.last_activity),
  };
}

export const noteFromRow = (r: Record<string, unknown>): ClientNote => ({
  id: String(r.id),
  authorName: text(r.author_name),
  body: String(r.body ?? ""),
  createdAt: String(r.created_at ?? ""),
});

export const ledgerFromRow = (r: Record<string, unknown>): LedgerRow => ({
  id: String(r.id),
  seconds: int(r.seconds),
  kind: String(r.kind ?? ""),
  planKey: text(r.plan_key),
  note: text(r.note),
  projectId: text(r.project_id),
  createdAt: String(r.created_at ?? ""),
});

/** The name to show for a client: their name, else the part of the email before the @. */
export const clientLabel = (c: Pick<ClientOverview, "fullName" | "email">, fallback: string) => c.fullName ?? c.email?.split("@")[0] ?? fallback;

/** The profile row's columns for an edit (blank fields saved as null). */
export const profilePatch = (f: ProfileFields) => ({
  full_name: f.fullName.trim() || null,
  company: f.company.trim() || null,
  phone: f.phone.trim() || null,
  country: f.country.trim() || null,
});

/** Made-up clients for `/team?sample=1` - the same people as the sample projects. */
export const SAMPLE_CLIENTS: ClientOverview[] = [
  {
    id: "sample-user",
    email: "maria@bloomcosmetics.example",
    fullName: "Maria Ivanova",
    company: "Bloom Cosmetics",
    phone: null,
    country: "Bulgaria",
    isTeam: false,
    createdAt: "2026-09-12T09:00:00Z",
    balanceSeconds: 60,
    projectCount: 4,
    openProjects: 3,
    planKey: "creator",
    subscriptionStatus: "active",
    lastActivity: "2026-10-05T14:20:00Z",
  },
  {
    id: "sample-user-2",
    email: "georgi@titanwok.example",
    fullName: "Georgi Petrov",
    company: "Titan Wok",
    phone: null,
    country: "Bulgaria",
    isTeam: false,
    createdAt: "2026-09-28T11:30:00Z",
    balanceSeconds: 15,
    projectCount: 0,
    openProjects: 0,
    planKey: null,
    subscriptionStatus: null,
    lastActivity: "2026-09-28T11:42:00Z",
  },
];

export const SAMPLE_LEDGER: Record<string, LedgerRow[]> = {
  "sample-user": [
    { id: "l3", seconds: -30, kind: "spend", planKey: null, note: "Summer Sale reel", projectId: null, createdAt: "2026-10-01T10:00:00Z" },
    { id: "l2", seconds: 30, kind: "adjustment", planKey: null, note: "Launch gift", projectId: null, createdAt: "2026-09-20T10:00:00Z" },
    { id: "l1", seconds: 60, kind: "purchase", planKey: "creator", note: "Subscription payment", projectId: null, createdAt: "2026-09-12T09:05:00Z" },
  ],
  "sample-user-2": [{ id: "l4", seconds: 15, kind: "purchase", planKey: "personal", note: "Pack purchase", projectId: null, createdAt: "2026-09-28T11:40:00Z" }],
};

export const SAMPLE_NOTES: Record<string, ClientNote[]> = {
  "sample-user": [{ id: "n1", authorName: "Nikolay", body: "Prefers short, punchy cuts. Always wants a 9:16 and a 1:1 version.", createdAt: "2026-09-21T08:00:00Z" }],
};
