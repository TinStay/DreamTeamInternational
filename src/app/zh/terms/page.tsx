import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsChineseContent } from "@/components/legal/terms-chinese-content";
import { zh } from "@/lib/i18n/zh";
import { localeAlternates } from "@/lib/routes";

const LAST_UPDATED = "2026年2月20日";

export const metadata: Metadata = {
  title: "服务条款 | DreamTeam",
  description: "DreamTeam AI 视频制作服务条款与条件。",
  alternates: {
    canonical: "/zh/terms",
    languages: localeAlternates("/terms"),
  },
};

export default function TermsPageZh() {
  return (
    <LegalPageShell
      homeHref="/zh"
      homeLabel={zh.legal.home}
      docTitle={zh.legal.termsTitle}
      lastUpdatedLabel={zh.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={zh.legal.backToHome}
    >
      <TermsChineseContent />
    </LegalPageShell>
  );
}
