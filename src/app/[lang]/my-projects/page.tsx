import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MyProjectsPageView } from "@/components/my-projects-page-view";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { requireAccount } from "@/lib/supabase/account-page";
import { getMyProjects } from "@/lib/supabase/my-projects";
import { SAMPLE_PROJECTS } from "@/lib/client-projects-sample";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // A private page: out of the search index.
  return { title: getDictionary(lang).account.projectsMetaTitle, robots: { index: false, follow: false } };
}

/** `/my-projects` - YOUR PROJECTS. Signed-out visitors go to the home page. */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ sample?: string | string[]; purchase?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  await requireAccount(lang);
  // `?sample=1` shows four made-up projects to try the page with (see lib/client-projects-sample.ts).
  const query = await searchParams;
  const sample = query.sample === "1";
  const purchased = query.purchase === "success";
  const projects = sample ? SAMPLE_PROJECTS : await getMyProjects();
  return <MyProjectsPageView projects={projects} sample={sample} purchased={purchased} />;
}
