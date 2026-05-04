import type { Language } from "@/lib/i18n/language-context";

/** Localized home path (`/bg` vs `/en`), matching locale segment routing. */
export function homePath(language: Language) {
  return language === "bg" ? "/bg" : "/en";
}

/** Localized path for the combined Process + Contact page. */
export function contactProcessPath(language: Language) {
  return language === "bg" ? "/bg/contact" : "/en/contact";
}
