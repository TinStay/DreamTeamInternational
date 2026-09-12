import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectsPageView } from "@/components/projects/projects-page-view";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";

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
  return <ProjectsPageView />;
}
