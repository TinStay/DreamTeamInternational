import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPageView } from "@/components/about-page-view";
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
    title: t.about.metaTitle,
    description: t.about.metaDescription,
    alternates: { canonical: `/${lang}/about`, languages: localeAlternates("/about") },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <AboutPageView />;
}
