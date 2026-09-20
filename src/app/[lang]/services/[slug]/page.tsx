import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailPageView } from "@/components/services/service-detail-page-view";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary, type Language } from "@/lib/i18n/config";
import { jsonLd } from "@/lib/seo";
import { serviceNode } from "@/lib/seo-graph";
import { SERVICE_SLUGS, getServiceIconBySlug } from "@/lib/services/constants";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    SERVICE_SLUGS.map((slug) => ({ lang, slug }))
  );
}

function findService(lang: Language, slug: string) {
  const icon = getServiceIconBySlug(slug);
  return icon
    ? getDictionary(lang).services.items.find((item) => item.imgSrc === icon)
    : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const service = findService(lang, slug);
  if (!service) return {};
  return {
    title: service.seoTitle,
    description: service.seoDescription,
    alternates: {
      canonical: `/${lang}/services/${slug}`,
      languages: localeAlternates(`/services/${slug}`),
    },
  };
}

export default async function LocaleServiceDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const service = findService(lang, slug);
  if (!service) notFound();

  // The service as structured data (`lib/seo-graph.ts`); the breadcrumb list comes with the breadcrumbs themselves.
  const structuredData = { "@context": "https://schema.org", ...serviceNode(lang, slug) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <ServiceDetailPageView slug={slug} />
    </>
  );
}
