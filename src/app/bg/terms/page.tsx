import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsEnglishContent } from "@/components/legal/terms-english-content";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Общи условия | DreamTeam Technology",
  description: "Общи условия за услугите на DreamTeam (AI видео продукция).",
  alternates: {
    canonical: "/bg/terms",
    languages: {
      en: "/terms",
      bg: "/bg/terms",
    },
  },
};

export default function TermsPageBg() {
  return (
    <LegalPageShell
      homeHref="/bg"
      homeLabel="Начало"
      docTitle="Общи условия"
      lastUpdatedLabel="Последна актуализация:"
      lastUpdated={LAST_UPDATED}
      backLabel="Обратно към началото"
    >
      <p className="not-prose mb-8 rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Официалният правен текст по-долу е на <strong className="text-foreground">английски език</strong>.
      </p>
      <TermsEnglishContent />
    </LegalPageShell>
  );
}
