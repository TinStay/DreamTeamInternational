import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactProcessLayout } from "@/components/contact-process-layout";
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
    title: t.contactPage.metaTitle,
    description: t.contactPage.metaDescription,
    alternates: {
      canonical: `/${lang}/contact`,
      languages: localeAlternates("/contact"),
    },
  };
}

export default async function LocaleContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ContactProcessLayout />;
}
