"use client";

import { StatsSection } from "@/components/ui/stats-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export function CompanyStatsSection({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <section id="stats" className={cn("relative w-full overflow-visible", className)}>
      <StatsSection
        title1={t.stats.title1}
        title2={t.stats.title2}
        subline={t.stats.subline}
        items={t.stats.items}
      />
    </section>
  );
}
