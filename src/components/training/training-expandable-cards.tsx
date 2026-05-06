"use client";

import Link from "next/link";
import React, { useId } from "react";
import { IconHourglassFilled } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { primaryGradientInteractiveClassName } from "@/components/ui/button";

export type TrainingExpandableCard = {
  id: string;
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  /** When true, CTA is non-interactive and a “coming soon” chip is shown. */
  comingSoon?: boolean;
  comingSoonLabel?: string;
  includes: React.ReactNode | (() => React.ReactNode);
  details: React.ReactNode | (() => React.ReactNode);
};

type TrainingExpandableCardsProps = {
  cards: TrainingExpandableCard[];
};

export function TrainingExpandableCards({ cards }: TrainingExpandableCardsProps) {
  const { t, language } = useLanguage();
  const id = useId();
  return (
    <>
      <motion.ul
        className="grid w-full max-w-none grid-cols-1 gap-7 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.14, delayChildren: 0.08 },
          },
        }}
      >
        {cards.map((card) => (
          <motion.li
            key={card.id}
            className="list-none"
            variants={{
              hidden: { opacity: 0, y: 32, scale: 0.97 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <Link
              href={`/${language}/training/${card.id}`}
              className="block h-full"
            >
              <motion.div
                layoutId={`card-${card.id}-${id}`}
                role="link"
                tabIndex={0}
                className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/80 p-5 shadow-md backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-card hover:shadow-lg md:p-6"
              >
              <div className="flex w-full flex-col gap-4">
                <motion.div layoutId={`image-${card.id}-${id}`} className="overflow-hidden rounded-xl">
                  <img
                    width={560}
                    height={360}
                    src={card.src}
                    alt={card.title}
                    className="h-52 w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02] sm:h-56 md:h-60"
                  />
                </motion.div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <motion.h3
                      layoutId={`title-${card.id}-${id}`}
                      className="font-heading text-center text-lg font-semibold text-foreground md:text-left"
                    >
                      {card.title}
                    </motion.h3>
                    {card.comingSoon && card.comingSoonLabel ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-50">
                        <IconHourglassFilled className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {card.comingSoonLabel}
                      </span>
                    ) : null}
                  </div>
                  <motion.p
                    layoutId={`description-${card.id}-${id}`}
                    className="text-center text-base leading-snug text-muted-foreground md:text-left"
                  >
                    {card.description}
                  </motion.p>
                </div>
                <motion.span
                  layoutId={`button-${card.id}-${id}`}
                  className={cn(
                    "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-center text-sm font-semibold shadow-md md:text-base",
                    primaryGradientInteractiveClassName,
                    card.comingSoon
                      ? "pointer-events-none cursor-not-allowed opacity-55"
                      : "group-hover:scale-[1.03] group-hover:shadow-[0_12px_30px_var(--primary-elevated-shadow)] group-hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] group-hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)]"
                  )}
                  aria-disabled={card.comingSoon ? true : undefined}
                >
                  {card.comingSoon ? (
                    <IconHourglassFilled className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  ) : null}
                  {card.ctaText}
                </motion.span>
              </div>
              </motion.div>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </>
  );
}
