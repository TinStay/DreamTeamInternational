"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { TrainingCardsGrid } from "./training-cards-grid";

export function TrainingSection() {
  const { t } = useLanguage();
  const tr = t.training;

  return (
    <section id="training" className="relative w-full overflow-visible pt-12 pb-20 sm:pt-16 sm:pb-24">
      <div className="relative z-10 mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10">
        <header className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{tr.eyebrow}</p>
          <h2 className="font-heading mb-3 text-4xl font-bold text-foreground md:text-5xl">{tr.title}</h2>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">{tr.subtitle}</p>
        </header>

        <TrainingCardsGrid />
      </div>
    </section>
  );
}
