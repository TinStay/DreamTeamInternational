import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyEnglishContent } from "@/components/legal/privacy-english-content";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | DreamTeam Technology",
  description:
    "How DreamTeam collects and uses personal data, cookies, analytics, and your GDPR rights.",
  alternates: {
    canonical: "/privacy",
    languages: {
      en: "/privacy",
      bg: "/bg/privacy",
    },
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      homeHref="/"
      homeLabel="Home"
      docTitle="Privacy Policy"
      lastUpdatedLabel="Last updated:"
      lastUpdated={LAST_UPDATED}
      backLabel="Back to home"
    >
      <PrivacyEnglishContent />
    </LegalPageShell>
  );
}
