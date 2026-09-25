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
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ for?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // `?for=individual` (the header's "Individual plans" link) opens that tab; anything else opens Business. Keyed, so a
  // link to the other audience switches the tab even while the page is open.
  const audience = (await searchParams).for === "individual" ? "individual" : "business";
  return <PricingPageView key={audience} initialAudience={audience} />;
}
