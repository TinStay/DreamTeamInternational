"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-1 bg-secondary rounded-full p-1 border border-border/20 ${className}`}>
      <button
        onClick={() => setLanguage("bg")}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          language === "bg" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        BG
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          language === "en" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
