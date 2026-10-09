import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsEnglishContent } from "@/components/legal/terms-english-content";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary, type Language } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const LAST_UPDATED = "February 20, 2026";

const META: Record<Language, { title: string; description: string }> = {
  en: {
    title: "Terms and Conditions | Keplerbay",
    description:
      "Terms and conditions for Keplerbay AI video production services, payments, revisions, and portfolio use.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: META[lang].title,
    description: META[lang].description,
    alternates: {
      canonical: `/${lang}/terms`,
      languages: localeAlternates("/terms"),
    },
  };
}

export default async function LocaleTermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <LegalPageShell
      homeHref={`/${lang}`}
      docTitle={t.legal.termsTitle}
      lastUpdatedLabel={t.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={t.legal.backToHome}
    >
      <TermsEnglishContent />
    </LegalPageShell>
  );
}
