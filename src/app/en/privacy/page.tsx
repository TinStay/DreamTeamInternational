import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyEnglishContent } from "@/components/legal/privacy-english-content";
import { en } from "@/lib/i18n/en";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | DreamTeam",
  description:
    "How DreamTeam collects and uses personal data, cookies, analytics, and your GDPR rights.",
  alternates: {
    canonical: "/en/privacy",
    languages: {
      en: "/en/privacy",
      bg: "/bg/privacy",
    },
  },
};

export default function PrivacyPageEn() {
  return (
    <LegalPageShell
      homeHref="/en"
      homeLabel={en.legal.home}
      docTitle={en.legal.privacyTitle}
      lastUpdatedLabel={en.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={en.legal.backToHome}
    >
      <PrivacyEnglishContent />
    </LegalPageShell>
  );
}

