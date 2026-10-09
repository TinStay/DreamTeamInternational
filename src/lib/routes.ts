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
 * hreflang alternates for a path suffix (e.g. `/contact`, `` for home): the English page, also as `x-default` (the
 * site is English only).
 */
export function localeAlternates(pathSuffix = "") {
  return {
    en: `/en${pathSuffix}`,
    "x-default": `/en${pathSuffix}`,
  };
}

export function accountPath(language: Language) {
  return `/${language}/account`;
}

export function myProjectsPath(language: Language) {
  return `/${language}/my-projects`;
}

/** The admin dashboard (team accounts only) - it was `/team`, which now redirects here. */
export function adminPath(language: Language) {
  return `/${language}/admin`;
}

/** The admin dashboard, by its old name (emails, menus). */
export const teamPath = adminPath;

export function careersPath(language: Language) {
  return `/${language}/careers`;
}

export function aboutPath(language: Language) {
  return `/${language}/about`;
}

/** One of the client's projects, on its own page. */
export function myProjectPath(language: Language, id: string) {
  return `/${language}/my-projects/${id}`;
}

/**
 * A path to come back to after signing in (`?next=` on the home page, the auth callback): a path on this site only -
 * starting with one `/`, no scheme, no backslash - or `null`, so the parameter can never bounce a visitor elsewhere.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 300 || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /^\/[^/]*:/.test(raw)) return null;
  return raw;
}

/** The home page with the log-in popup open, returning the visitor to `next` once signed in. */
export function loginPath(language: Language, next: string) {
  return `${homePath(language)}?login=1&next=${encodeURIComponent(next)}`;
}
