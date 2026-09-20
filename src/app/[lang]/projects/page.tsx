import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectsPageView } from "@/components/projects/projects-page-view";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { jsonLd } from "@/lib/seo";
import { projectsCollectionGraph } from "@/lib/seo-graph";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.projects.metaTitle,
    description: t.projects.metaDescription,
    alternates: {
      canonical: `/${lang}/projects`,
      languages: localeAlternates("/projects"),
    },
  };
}

export default async function LocaleProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      {/* The listing as a CollectionPage whose list is every case study (`lib/seo-graph.ts`). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(projectsCollectionGraph(lang))} />
      <ProjectsPageView />
    </>
  );
}
