import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { RefundsEnglishContent } from "@/components/legal/refunds-english-content";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, getDictionary, type Language } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const LAST_UPDATED = "06-11-2026";

const META: Record<Language, { title: string; description: string }> = {
  en: {
    title: "Refund Policy | Keplerbay",
    description: "How refunds work for Keplerbay orders and subscriptions, handled by Paddle, our Merchant of Record.",
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
      canonical: `/${lang}/refunds`,
      languages: localeAlternates("/refunds"),
    },
  };
}

export default async function LocaleRefundsPage({
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
      docTitle={t.legal.refundsTitle}
      lastUpdatedLabel={t.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={t.legal.backToHome}
    >
      <RefundsEnglishContent />
    </LegalPageShell>
  );
}
