import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsEnglishContent } from "@/components/legal/terms-english-content";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Terms and Conditions | DreamTeam Technology",
  description:
    "Terms and conditions for DreamTeam AI video production services, payments, revisions, and portfolio use.",
  alternates: {
    canonical: "/terms",
    languages: {
      en: "/terms",
      bg: "/bg/terms",
    },
  },
};

export default function TermsPage() {
  return (
    <LegalPageShell
      homeHref="/"
      homeLabel="Home"
      docTitle="Terms and Conditions"
      lastUpdatedLabel="Last updated:"
      lastUpdated={LAST_UPDATED}
      backLabel="Back to home"
    >
      <TermsEnglishContent />
    </LegalPageShell>
  );
}
