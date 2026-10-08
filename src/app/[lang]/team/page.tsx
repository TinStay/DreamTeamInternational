import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TeamDashboardView } from "@/components/team-dashboard-view";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { homePath } from "@/lib/routes";
import { isTeamUser } from "@/lib/team";
import { projectFromRow } from "@/lib/client-projects";
import { SAMPLE_PROJECTS } from "@/lib/client-projects-sample";
import { clientFromRow, SAMPLE_CLIENTS } from "@/lib/clients";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // Internal: out of the search index.
  return { title: getDictionary(lang).team.metaTitle, robots: { index: false, follow: false } };
}

/**
 * `/team` - the team dashboard: every client's projects and the files they submitted, and (the Clients tab) every client
 * from `client_overview` - `null` when that view is missing (profiles.sql not run). Only accounts with the admin role
 * (supabase/team.sql) get in; anyone else is sent home. Row level security in Supabase enforces it again on the data itself.
 * `?sample=1` shows made-up projects (any signed-in account) to try the page without data.
 */
export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ sample?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  if (!supabaseConfigured) redirect(homePath(lang));
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(homePath(lang));

  const sample = (await searchParams).sample === "1";
  if (sample) return <TeamDashboardView projects={SAMPLE_PROJECTS} clients={SAMPLE_CLIENTS} sample />;

  if (!isTeamUser(auth.user)) redirect(homePath(lang));
  const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
  // How many comments each thread has and who wrote last (a thread whose last word is the client's needs a reply).
  const { data: comments } = await supabase.from("project_comments").select("project_id, is_team, created_at").order("created_at", { ascending: true });
  const thread = new Map<string, { count: number; lastIsTeam: boolean }>();
  for (const c of comments ?? []) {
    const cur = thread.get(c.project_id as string) ?? { count: 0, lastIsTeam: false };
    thread.set(c.project_id as string, { count: cur.count + 1, lastIsTeam: Boolean(c.is_team) });
  }
  const projects = (data ?? []).map((row) => {
    const project = projectFromRow(row as Record<string, unknown>);
    const t = thread.get(project.id);
    return { ...project, commentCount: t?.count ?? 0, awaitingReply: t ? !t.lastIsTeam : false };
  });
  // Every client (team accounts left out), with balance, projects and plan in one row each (supabase/profiles.sql).
  const { data: clientRows, error: clientsError } = await supabase
    .from("client_overview")
    .select("*")
    .eq("is_team", false)
    .order("last_activity", { ascending: false, nullsFirst: false });
  const clients = clientsError ? null : (clientRows ?? []).map((row) => clientFromRow(row as Record<string, unknown>));
  return <TeamDashboardView projects={projects} clients={clients} sample={false} />;
}
