import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/app/home-page";
import { EnHomePage } from "@/app/en-home-page";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, getDictionary, isLocale } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// The home page's title, description and keywords live with the rest of the SEO copy (`seo.home` in the
// dictionaries), so the layout's site-wide defaults and this page never drift apart.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { home } = getDictionary(lang).seo;
  return {
    title: home.title,
    description: home.description,
    keywords: home.keywords,
    alternates: { canonical: `/${lang}`, languages: localeAlternates() },
  };
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // English gets its own home page file, so its layout can differ from the Bulgarian one.
  return lang === "en" ? <EnHomePage /> : <HomePage />;
}
