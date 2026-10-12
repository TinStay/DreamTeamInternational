import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvestorsPageView } from "@/components/investors-page-view";
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
    title: t.investors.metaTitle,
    description: t.investors.metaDescription,
    alternates: { canonical: `/${lang}/investors`, languages: localeAlternates("/investors") },
  };
}

export default async function InvestorsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <InvestorsPageView />;
}
