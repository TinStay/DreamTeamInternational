import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicesPageView } from "@/components/services/services-page-view";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { jsonLd } from "@/lib/seo";
import { servicesListGraph } from "@/lib/seo-graph";

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
    title: t.services.metaTitle,
    description: t.services.metaDescription,
    alternates: {
      canonical: `/${lang}/services`,
      languages: localeAlternates("/services"),
    },
  };
}

export default async function LocaleServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      {/* The four services as an ItemList of Service nodes (`lib/seo-graph.ts`). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(servicesListGraph(lang))} />
      <ServicesPageView />
    </>
  );
}
