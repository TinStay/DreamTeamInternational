"use client";

import { useMemo } from "react";
import { StatsSection } from "@/components/ui/stats-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

/**
 * Rendered artwork for each stat, keyed by the item's `id` in the dictionaries.
 * The number lives inside the PNG, so the dictionary `value` becomes its alt
 * text — the figure stays in the DOM for screen readers and crawlers.
 */
export const STAT_IMAGE_BY_ID: Record<string, string> = {
  views: "/statistic_images/views_number.png",
  clients: "/statistic_images/clients_number.png",
  projects: "/statistic_images/projects_number.png",
};

export function CompanyStatsSection({ className }: { className?: string }) {
  const { t } = useLanguage();

  const items = useMemo(
    () =>
      t.stats.items.map((item) => ({
        ...item,
        imgSrc: STAT_IMAGE_BY_ID[item.id],
      })),
    [t.stats.items]
  );

  return (
    <section id="stats" className={cn("relative w-full overflow-visible", className)}>
      <StatsSection
        title1={t.stats.title1}
        title2={t.stats.title2}
        subline={t.stats.subline}
        items={items}
      />
    </section>
  );
}
