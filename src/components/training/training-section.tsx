"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { TrainingCardsGrid } from "./training-cards-grid";

export function TrainingSection() {
  const { t } = useLanguage();
  const tr = t.training;

  return (
    <section id="training" className="relative w-full overflow-visible pt-12 pb-20 sm:pt-16 sm:pb-24">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        <header className="mb-10 text-center lg:mb-12">
          <h2 className="mb-6 font-heading text-4xl font-bold text-foreground md:text-5xl">
            <span className="text-section-accent">{tr.title1}</span> {tr.title2}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{tr.subtitle}</p>
        </header>

        <TrainingCardsGrid />
      </div>
    </section>
  );
}
