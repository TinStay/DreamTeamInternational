import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/app/home-page";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, type Language } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const META: Record<Language, { title: string; description: string }> = {
  en: {
    title: "DreamTeam | AI Video Production",
    description:
      "DreamTeam creates high-impact AI video for brands worldwide — photoreal, stylized, or hybrid. Scripting, production, and fast turnaround.",
  },
  bg: {
    title: "DreamTeam | AI Видео Продукция",
    description:
      "DreamTeam създава високоефективни AI видеа за брандове по света — реалистични, анимирани или хибридни. Сценарий, продукция и бързи срокове.",
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
  return <HomePage />;
}
