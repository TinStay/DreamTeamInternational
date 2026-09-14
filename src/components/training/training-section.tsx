"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { JourneyItem } from "@/components/ui/scroll-journey";
import { TrainingCardsGrid } from "./training-cards-grid";

export function TrainingSection() {
  const { t } = useLanguage();
  const tr = t.training;

  return (
    <section id="training" className="relative w-full overflow-visible pt-12 pb-20 sm:pt-16 sm:pb-24">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        {/* Journey part (home): the heading arrives first; the cards are marked in `TrainingExpandableCards`. */}
        <JourneyItem kind="title" as="header" className="mb-10 text-center lg:mb-12">
          <h2 className="mb-6 font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl text-foreground">
            <span className="text-section-accent">{tr.title1}</span> {tr.title2}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{tr.subtitle}</p>
        </JourneyItem>

        <TrainingCardsGrid />
      </div>
    </section>
  );
}
