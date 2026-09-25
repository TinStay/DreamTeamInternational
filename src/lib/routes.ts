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

/** Localized monthly plans page. */
export function pricingPath(language: Language) {
  return `/${language}/pricing`;
}

/** Localized services hub path. */
export function servicesPath(language: Language) {
  return `/${language}/services`;
}

/** Localized path for a single service page. */
export function servicePath(language: Language, slug: string) {
  return `/${language}/services/${slug}`;
}

/** Localized portfolio page path. */
export function portfolioPath(language: Language) {
  return `/${language}/portfolio`;
}

/** Localized projects (case studies) hub path. */
export function projectsPath(language: Language) {
  return `/${language}/projects`;
}

/** Localized path for a single project case study. */
export function projectPath(language: Language, slug: string) {
  return `/${language}/projects/${slug}`;
}

/** Localized terms page path. */
export function termsPath(language: Language) {
  return `/${language}/terms`;
}

/** Localized privacy page path. */
export function privacyPath(language: Language) {
  return `/${language}/privacy`;
}

/**
 * hreflang alternates for a path suffix (e.g. `/contact`, `` for home): both locales and `x-default` - the English
 * page, where the bare domain sends a visitor whose browser is not Bulgarian (`next.config.ts`).
 */
export function localeAlternates(pathSuffix = "") {
  return {
    en: `/en${pathSuffix}`,
    bg: `/bg${pathSuffix}`,
    "x-default": `/en${pathSuffix}`,
  };
}
