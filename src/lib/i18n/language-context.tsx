"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "./en";
import { bg } from "./bg";

type Language = "en" | "bg";
type Dictionary = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("bg"); // default to bg as requested
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-lang") as Language;
    if (saved === "en" || saved === "bg") {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
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
