import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsEnglishContent } from "@/components/legal/terms-english-content";
import { en } from "@/lib/i18n/en";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Terms and Conditions | DreamTeam Technology",
  description:
    "Terms and conditions for DreamTeam AI video production services, payments, revisions, and portfolio use.",
  alternates: {
    canonical: "/en/terms",
    languages: {
      en: "/en/terms",
      bg: "/bg/terms",
    },
  },
};

export default function TermsPageEn() {
  return (
    <LegalPageShell
      homeHref="/en"
      homeLabel={en.legal.home}
      docTitle={en.legal.termsTitle}
      lastUpdatedLabel={en.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={en.legal.backToHome}
    >
      <TermsEnglishContent />
    </LegalPageShell>
  );
}

