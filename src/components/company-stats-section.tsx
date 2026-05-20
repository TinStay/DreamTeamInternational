"use client";

import { StatsSection } from "@/components/ui/stats-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export function CompanyStatsSection({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <section id="stats" className={cn("relative w-full overflow-visible", className)}>
      <StatsSection
        headline={t.stats.headline}
        subline={t.stats.subline}
        items={t.stats.items}
      />
    </section>
  );
}
