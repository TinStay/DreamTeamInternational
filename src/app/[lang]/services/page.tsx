import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicesPageView } from "@/components/services/services-page-view";
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
  return <ServicesPageView />;
}
