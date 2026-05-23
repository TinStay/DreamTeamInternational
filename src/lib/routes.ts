import type { Language } from "@/lib/i18n/language-context";

/** Localized home path, matching locale segment routing. */
export function homePath(language: Language) {
  return `/${language}`;
}

/** Localized path for the combined Process + Contact page. */
export function contactProcessPath(language: Language) {
  return `/${language}/contact`;
}

/** Localized training hub path. */
export function trainingPath(language: Language) {
  return `/${language}/training`;
}

/** Localized terms page path. */
export function termsPath(language: Language) {
  return `/${language}/terms`;
}

/** Localized privacy page path. */
export function privacyPath(language: Language) {
  return `/${language}/privacy`;
}

/** hreflang alternates for a path suffix (e.g. `/contact`, `` for home). */
export function localeAlternates(pathSuffix = "") {
  return {
    en: `/en${pathSuffix}`,
    bg: `/bg${pathSuffix}`,
    zh: `/zh${pathSuffix}`,
  };
}
