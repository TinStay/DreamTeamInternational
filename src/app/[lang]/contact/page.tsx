import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactPageView } from "@/components/contact-page-view";
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
    title: t.contactPage.metaTitle,
    description: t.contactPage.metaDescription,
    alternates: { canonical: `/${lang}/contact`, languages: localeAlternates("/contact") },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ContactPageView />;
}
