import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyChineseContent } from "@/components/legal/privacy-chinese-content";
import { zh } from "@/lib/i18n/zh";
import { localeAlternates } from "@/lib/routes";

const LAST_UPDATED = "2026年2月20日";

export const metadata: Metadata = {
  title: "隐私政策 | DreamTeam",
  description: "DreamTeam 如何收集和使用个人数据、Cookie、分析工具及您的 GDPR 权利。",
  alternates: {
    canonical: "/zh/privacy",
    languages: localeAlternates("/privacy"),
  },
};

export default function PrivacyPageZh() {
  return (
    <LegalPageShell
      homeHref="/zh"
      homeLabel={zh.legal.home}
      docTitle={zh.legal.privacyTitle}
      lastUpdatedLabel={zh.legal.lastUpdated}
      lastUpdated={LAST_UPDATED}
      backLabel={zh.legal.backToHome}
    >
      <PrivacyChineseContent />
    </LegalPageShell>
  );
}
