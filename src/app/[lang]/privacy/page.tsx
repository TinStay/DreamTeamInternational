import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyEnglishContent } from "@/components/legal/privacy-english-content";
import { PrivacyBulgarianContent } from "@/components/legal/privacy-bulgarian-content";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary, type Language } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const LAST_UPDATED = "February 20, 2026";

const META: Record<Language, { title: string; description: string }> = {
  en: {
    title: "Privacy Policy | DreamTeam",
    description:
      "How DreamTeam collects and uses personal data, cookies, analytics, and your GDPR rights.",
  },
  bg: {
    title: "Политика за поверителност | DreamTeam",
    description: "Политика за поверителност на DreamTeam.",
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
      canonical: `/${lang}/privacy`,
      languages: localeAlternates("/privacy"),
    },
  };
}

export default async function LocalePrivacyPage({
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
      docTitle={t.legal.privacyTitle}
      lastUpdatedLabel={t.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={t.legal.backToHome}
    >
      {lang === "bg" ? <PrivacyBulgarianContent /> : <PrivacyEnglishContent />}
    </LegalPageShell>
  );
}
