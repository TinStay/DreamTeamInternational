"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { en } from "./en";
import { bg } from "./bg";
import { zh } from "./zh";

export const LOCALES = ["en", "bg", "zh"] as const;
export type Language = (typeof LOCALES)[number];
type Dictionary = typeof en;

const dictionaries: Record<Language, Dictionary> = { en, bg, zh };

function getRouteLanguage(pathname: string | null): Language {
  if (pathname?.startsWith("/zh")) return "zh";
  if (pathname?.startsWith("/bg")) return "bg";
  if (pathname?.startsWith("/en")) return "en";
  return "en";
}

function switchLocalePath(path: string, target: Language): string {
  for (const locale of LOCALES) {
    if (path === `/${locale}`) return `/${target}`;
    if (path.startsWith(`/${locale}/`)) {
      return `/${target}${path.slice(`/${locale}`.length)}`;
    }
  }
  return `/${target}`;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const routeLanguage = useMemo(() => getRouteLanguage(pathname), [pathname]);

  useEffect(() => {
    localStorage.setItem("app-lang", routeLanguage);
  }, [routeLanguage]);

  const [language, setLanguage] = useState<Language>(routeLanguage);

  useEffect(() => {
    setLanguage(routeLanguage);
  }, [routeLanguage]);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (lang === routeLanguage) {
      setLanguage(lang);
      localStorage.setItem("app-lang", lang);
      return;
    }

    const nextPath = switchLocalePath(pathname || "/", lang);
    router.push(`${nextPath}${hash}`, { scroll: false });
    setLanguage(lang);
    localStorage.setItem("app-lang", lang);
  };

  const t = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
