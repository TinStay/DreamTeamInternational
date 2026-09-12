import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioPageView } from "@/components/portfolio/portfolio-page-view";
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
    title: t.portfolio.metaTitle,
    description: t.portfolio.metaDescription,
    alternates: {
      canonical: `/${lang}/portfolio`,
      languages: localeAlternates("/portfolio"),
    },
  };
}

export default async function LocalePortfolioPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <PortfolioPageView />;
}
