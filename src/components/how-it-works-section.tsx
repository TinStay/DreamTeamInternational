"use client";

import type { ComponentType } from "react";
import { motion } from "motion/react";
import { IconCircleCheck, IconMessage2, IconPackages, IconSparkles } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";

const EASE = [0.22, 1, 0.36, 1] as const;

/** One icon per step of `process.steps`, in order. */
const STEP_ICONS: ComponentType<{ className?: string; stroke?: number }>[] = [
  IconPackages,
  IconMessage2,
  IconSparkles,
  IconCircleCheck,
];

/**
 * "How it works" in the English site's style (the home page, right after the packages, and the contact page): a
 * left-aligned heading on the page margin with an orange eyebrow, then the four steps (`process.steps`) as dark cards -
 * the step's icon in the orange pearl ring the package cards wear, a big faint number, the title in Archivo and its
 * line. A thin orange line runs through the icons from lg and draws itself as the row scrolls in; the cards rise in
 * one after another. Replaces the 3D number badges of `process-section.tsx`.
 */
export function HowItWorksSection() {
  const { t } = useLanguage();
  const p = t.process;

  return (
    <section id="process" className="relative px-[max(1.25rem,3vw)] py-20 text-white sm:py-28">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{p.eyebrow}</p>
        <h2 className="mt-3 font-heading text-[clamp(30px,3.8vw,60px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance">
          {p.title1} <span className="text-section-accent">{p.title2}</span>
        </h2>
        <p className="mt-4 max-w-[62ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/65">{p.subtitle}</p>
      </header>

      <div className="relative mt-10 lg:mt-14">
        {/* The connector: through the icons' centres (card padding 1.5rem + half the 3.5rem icon), drawn on view. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-[calc(1.5rem+1.75rem)] right-[12.5%] left-[12.5%] hidden h-px origin-left bg-[linear-gradient(90deg,rgba(255,106,20,0.7),rgba(255,210,161,0.8)_50%,rgba(255,106,20,0.7))] lg:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: EASE }}
        />

        <ol className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? IconSparkles;
            return (
              <motion.li
                key={step.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_60%)] p-6 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-[#ff7a1a]/45 hover:shadow-[0_30px_60px_-28px_rgba(255,106,20,0.35)] lg:items-center lg:text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.12 * index, ease: EASE }}
              >
                {/* The step's number, big and faint, in the card's corner. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-3 right-4 font-heading text-6xl font-black leading-none text-white/[0.05] transition-colors duration-300 group-hover:text-[#ff8a1f]/15"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] p-px shadow-[0_0_22px_rgba(255,110,20,0.3)]">
                  <span className="flex size-full items-center justify-center rounded-[15px] bg-[#141518]">
                    <Icon className="size-7 text-[#ffb066]" stroke={1.6} />
                  </span>
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">
                  {p.stepLabel} {index + 1}
                </p>
                <h3 className="mt-1.5 font-heading text-lg font-black uppercase leading-tight tracking-tight xl:text-xl">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{step.description}</p>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
