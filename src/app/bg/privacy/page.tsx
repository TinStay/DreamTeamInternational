import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyBulgarianContent } from "@/components/legal/privacy-bulgarian-content";
import { bg } from "@/lib/i18n/bg";

const LAST_UPDATED = "February 20, 2026";

export const metadata: Metadata = {
  title: "Политика за поверителност | DreamTeam",
  description: "Политика за поверителност на DreamTeam.",
  alternates: {
    canonical: "/bg/privacy",
    languages: {
      en: "/en/privacy",
      bg: "/bg/privacy",
    },
  },
};

export default function PrivacyPageBg() {
  return (
    <LegalPageShell
      homeHref="/bg"
      homeLabel={bg.legal.home}
      docTitle={bg.legal.privacyTitle}
      lastUpdatedLabel={bg.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={bg.legal.backToHome}
    >
      <PrivacyBulgarianContent />
    </LegalPageShell>
  );
}
