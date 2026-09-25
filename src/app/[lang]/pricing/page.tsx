import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingPageView } from "@/components/pricing/pricing-page-view";
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
    title: t.plans.metaTitle,
    description: t.plans.metaDescription,
    alternates: {
      canonical: `/${lang}/pricing`,
      languages: localeAlternates("/pricing"),
    },
  };
}

export default async function LocalePricingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <PricingPageView />;
}
