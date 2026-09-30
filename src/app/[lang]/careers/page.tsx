import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareersPageView } from "@/components/careers-page-view";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.careers.metaTitle,
    description: t.careers.metaDescription,
    alternates: { canonical: `/${lang}/careers`, languages: localeAlternates("/careers") },
  };
}

export default async function CareersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <CareersPageView />;
}
