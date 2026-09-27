// Server-safe i18n config. No "use client" / React imports here, so it can be
// used from Server Components (e.g. generateMetadata, generateStaticParams) as
// well as from the client-side LanguageProvider.
import { en } from "./en";

/** Supported locales. The International site is English only (the Bulgarian site lives in the original repo); `/bg/*`
 * links redirect to their English page (`next.config.ts`). */
export const LOCALES = ["en"] as const;
export type Language = (typeof LOCALES)[number];
export type Dictionary = typeof en;

export const dictionaries: Record<Language, Dictionary> = { en };

/** Runtime guard that also narrows `value` to `Language`. */
export function isLocale(value: string): value is Language {
  return (LOCALES as readonly string[]).includes(value);
}

/** Localized dictionary for a known locale. */
export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang];
}
