import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyEnglishContent } from "@/components/legal/privacy-english-content";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Политика за поверителност | DreamTeam Technology",
  description: "Политика за поверителност на DreamTeam.",
  alternates: {
    canonical: "/bg/privacy",
    languages: {
      en: "/privacy",
      bg: "/bg/privacy",
    },
  },
};

export default function PrivacyPageBg() {
  return (
    <LegalPageShell
      homeHref="/bg"
      homeLabel="Начало"
      docTitle="Политика за поверителност"
      lastUpdatedLabel="Последна актуализация:"
      lastUpdated={LAST_UPDATED}
      backLabel="Обратно към началото"
    >
      <p className="not-prose mb-8 rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Официалният текст по-долу е на <strong className="text-foreground">английски език</strong>.
      </p>
      <PrivacyEnglishContent />
    </LegalPageShell>
  );
}
