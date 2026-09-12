import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCaseStudyView } from "@/components/projects/project-case-study-view";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { PROJECT_KEYS, getProject, isProjectKey } from "@/lib/projects";

// Every case study is pre-rendered; unknown slugs / locales 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PROJECT_KEYS.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang) || !isProjectKey(slug)) return {};
  const t = getDictionary(lang);
  const item = t.projects.items[slug];
  return {
    title: `${item.name} — ${item.headline} | ${t.projects.detail.metaTitle}`,
    description: item.description,
    alternates: {
      canonical: `/${lang}/projects/${slug}`,
      languages: localeAlternates(`/projects/${slug}`),
    },
  };
}

export default async function LocaleProjectPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const project = getProject(slug);
  if (!project) notFound();
  return <ProjectCaseStudyView project={project} />;
}
