import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailPageView } from "@/components/services/service-detail-page-view";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary, type Language } from "@/lib/i18n/config";
import { SERVICE_SLUGS, getServiceIconBySlug } from "@/lib/services/constants";

const BASE_URL = "https://dreamteam.video";

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

  const t = getDictionary(lang);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.title,
        serviceType: service.modal.eyebrow,
        description: service.seoDescription,
        url: `${BASE_URL}/${lang}/services/${slug}`,
        provider: { "@id": `${BASE_URL}/#organization` },
        areaServed: [{ "@type": "Country", name: "Bulgaria" }, "Worldwide"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "DreamTeam", item: `${BASE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: t.header.services, item: `${BASE_URL}/${lang}/services` },
          { "@type": "ListItem", position: 3, name: service.title, item: `${BASE_URL}/${lang}/services/${slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ServiceDetailPageView slug={slug} />
    </>
  );
}
