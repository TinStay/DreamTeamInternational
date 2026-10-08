import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/components/project-detail-view";
import { isLocale, getDictionary } from "@/lib/i18n/config";
import { requireAccount } from "@/lib/supabase/account-page";
import { createClient } from "@/lib/supabase/server";
import { projectFromRow } from "@/lib/client-projects";
import { SAMPLE_COMMENTS, SAMPLE_PROJECTS } from "@/lib/client-projects-sample";

// Project ids come from the database, never from generateStaticParams - every one is rendered on request (the
// `[lang]` layout's `dynamicParams = false` is for the locale only).
export const dynamicParams = true;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // A private page: out of the search index.
  return { title: getDictionary(lang).account.projectsMetaTitle, robots: { index: false, follow: false } };
}

/**
 * `/my-projects/[id]` - one of the signed-in client's projects on its own page (`ProjectDetailView`). Only their own:
 * the query is filtered to their id on top of row level security, so a team account sees its own here too, and
 * anything else is a 404. `?sample=1` opens a made-up project (the sample ids) to preview the page.
 */
export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ sample?: string | string[] }> }) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  await requireAccount(lang);

  if ((await searchParams).sample === "1") {
    const project = SAMPLE_PROJECTS.find((x) => x.id === id);
    if (!project) notFound();
    return <ProjectDetailView project={project} sample seedComments={SAMPLE_COMMENTS[project.id] ?? []} />;
  }

  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).eq("user_id", auth.user?.id ?? "").maybeSingle();
  if (error || !data) notFound();
  return <ProjectDetailView project={projectFromRow(data as Record<string, unknown>)} />;
}
