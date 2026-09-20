import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCaseStudyView } from "@/components/projects/project-case-study-view";
import { localeAlternates, projectPath } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { PROJECT_KEYS, getProject, isProjectKey } from "@/lib/projects";
import { jsonLd, openGraphFor } from "@/lib/seo";
import { caseStudyGraph, projectImage } from "@/lib/seo-graph";

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
  const project = getProject(slug);
  const t = getDictionary(lang);
  const item = t.projects.items[slug];
  const title = `${item.name} — ${item.headline} | ${t.projects.detail.metaTitle}`;
  return {
    title,
    description: item.description,
    alternates: {
      canonical: `/${lang}/projects/${slug}`,
      languages: localeAlternates(`/projects/${slug}`),
    },
    // The film's YouTube poster as the share image (the branded fallback for a film that is not on YouTube).
    openGraph: openGraphFor(lang, {
      title,
      description: item.description,
      path: projectPath(lang, slug),
      image: project?.videoId
        ? { url: projectImage(project), width: 480, height: 360, alt: `${item.name} — ${item.headline}` }
        : undefined,
    }),
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
  return (
    <>
      {/* The case study as structured data: the page about the client, its film as a VideoObject (`lib/seo-graph.ts`). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(caseStudyGraph(project, lang))} />
      <ProjectCaseStudyView project={project} />
    </>
  );
}
