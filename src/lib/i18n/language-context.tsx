"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { en } from "./en";
import { bg } from "./bg";

export type Language = "en" | "bg";
type Dictionary = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const routeLanguage = useMemo<Language>(() => {
    if (pathname?.startsWith("/bg")) return "bg";
    if (pathname?.startsWith("/en")) return "en";
    return "en";
  }, [pathname]);

  useEffect(() => {
    localStorage.setItem("app-lang", routeLanguage);
  }, [routeLanguage]);

  const [language, setLanguage] = useState<Language>(routeLanguage);

  useEffect(() => {
    setLanguage(routeLanguage);
  }, [routeLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (lang === routeLanguage) {
      setLanguage(lang);
      localStorage.setItem("app-lang", lang);
      return;
    }

    const toBg = (path: string) => {
      if (path.startsWith("/bg")) return path;
      if (path.startsWith("/en")) {
        const rest = path.slice(3);
        return rest === "" ? "/bg" : `/bg${rest}`;
      }
      return path;
    };

    const toEn = (path: string) => {
      if (path.startsWith("/en")) return path;
      if (path.startsWith("/bg")) {
        const rest = path.slice(3);
        return rest === "" ? "/en" : `/en${rest}`;
      }
      return path;
    };

    const nextPath = lang === "bg" ? toBg(pathname || "/") : toEn(pathname || "/");
    router.push(`${nextPath}${hash}`);
    setLanguage(lang);
    localStorage.setItem("app-lang", lang);
  };

  const t = language === "en" ? en : bg;

  // We always wrap with Provider to ensure useLanguage doesn't throw.
  // We avoid wrapping children in a visible/hidden div unless we need strict hydration.
  // Just rendering children directly resolves the next-theme script DOM issues.
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
