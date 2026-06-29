import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/app/home-page";
import { localeAlternates } from "@/lib/routes";
import { LOCALES, isLocale, type Language } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const META: Record<
  Language,
  { title: string; description: string; keywords: string[] }
> = {
  en: {
    title: "DreamTeam | AI Video Production",
    description:
      "DreamTeam is an AI video production company creating AI-generated video ads, product videos, brand mascots, and AI-avatar stories for brands in Bulgaria and worldwide. Fast turnaround, accessible pricing.",
    keywords: [
      "AI video production",
      "AI video company",
      "AI video ads",
      "product videos",
      "brand mascots",
      "AI avatars",
      "social media video",
      "corporate video",
      "DreamTeam",
    ],
  },
  bg: {
    title: "DreamTeam | AI Видео Продукция за Брандове",
    description:
      "DreamTeam е компания за AI видео продукция — рекламни видеа с изкуствен интелект, продуктови видеа, корпоративно видео, AI аватари и талисмани за брандове в България и по света. Бързи срокове и достъпни цени.",
    keywords: [
      "AI видео продукция",
      "рекламни видеа с изкуствен интелект",
      "видео реклами за бизнес",
      "продуктови видеа",
      "корпоративно видео",
      "AI аватари",
      "AI талисмани",
      "видео за социални мрежи",
      "генериране на видео с изкуствен интелект",
    ],
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
    keywords: META[lang].keywords,
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
