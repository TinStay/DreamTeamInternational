import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingPageView } from "@/components/training/training-page-view";
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
    title: t.training.metaTitle,
    description: t.training.metaDescription,
    alternates: {
      canonical: `/${lang}/training`,
      languages: localeAlternates("/training"),
    },
  };
}

export default async function LocaleTrainingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <TrainingPageView />;
}
