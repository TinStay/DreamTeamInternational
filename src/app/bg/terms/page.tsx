import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsBulgarianContent } from "@/components/legal/terms-bulgarian-content";
import { bg } from "@/lib/i18n/bg";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Общи условия | DreamTeam",
  description: "Общи условия за услугите на DreamTeam (AI видео продукция).",
  alternates: {
    canonical: "/bg/terms",
    languages: {
      en: "/en/terms",
      bg: "/bg/terms",
    },
  },
};

export default function TermsPageBg() {
  return (
    <LegalPageShell
      homeHref="/bg"
      homeLabel={bg.legal.home}
      docTitle={bg.legal.termsTitle}
      lastUpdatedLabel={bg.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={bg.legal.backToHome}
    >
      <TermsBulgarianContent />
    </LegalPageShell>
  );
}
