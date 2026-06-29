import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingDetailPageView } from "@/components/training/training-detail-page-view";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";

// Known training slugs are pre-rendered. `dynamicParams` is left at its default
// (true) so any other slug still renders the fallback view, matching the prior
// behavior; the locale, however, is validated below and 404s when unknown.
const TRAINING_SLUGS = ["individual", "skool", "team", "corporate"] as const;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    TRAINING_SLUGS.map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const map = getDictionary(lang).training.cards;
  const normalized = slug.toLowerCase();
  const title =
    normalized === "skool"
      ? map.skool.title
      : normalized === "team" || normalized === "corporate"
        ? map.team.title
        : map.individual.title;

  return {
    title: `${title} | ${getDictionary(lang).training.metaTitle}`,
    description: getDictionary(lang).training.metaDescription,
    alternates: {
      canonical: `/${lang}/training/${slug}`,
      languages: localeAlternates(`/training/${slug}`),
    },
  };
}

export default async function LocaleTrainingDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  return <TrainingDetailPageView slug={slug} />;
}
