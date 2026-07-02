"use client";

import Link from "next/link";
import Image from "next/image";
import { IconHourglassFilled } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { primaryGradientInteractiveClassName } from "@/components/ui/button";
import type { TrainingExpandableCard } from "./use-training-cards";

type TrainingExpandableCardsProps = {
  cards: TrainingExpandableCard[];
  className?: string;
};

const cardHoverTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };
const ctaHoverTransition = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] as const };

const cardHoverVariants = {
  initial: { y: 0, boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.06)" },
  hover: {
    y: -4,
    boxShadow: "0 12px 20px -6px rgba(0, 0, 0, 0.1), 0 6px 8px -4px rgba(0, 0, 0, 0.06)",
  },
};

const imageHoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2 },
};

const buttonHoverVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.015 },
};

export function TrainingExpandableCards({ cards, className }: TrainingExpandableCardsProps) {
  const { language } = useLanguage();

  return (
    <motion.ul
      className={cn(
        "grid w-full max-w-none grid-cols-1 gap-5 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6",
        className
      )}
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
          <Link href={`/${language}/training/${card.id}`} className="block h-full">
            <motion.div
              role="link"
              tabIndex={0}
              className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/30 bg-card/80 p-5 shadow-md backdrop-blur-sm transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:border-primary/35 hover:bg-card hover:shadow-lg md:p-6"
              whileHover="hover"
              initial="initial"
              variants={cardHoverVariants}
              transition={cardHoverTransition}
            >
              <motion.div className="flex w-full flex-1 flex-col gap-3.5 md:gap-4">
                <motion.div
                  className="overflow-hidden rounded-lg"
                  variants={imageHoverVariants}
                  transition={cardHoverTransition}
                >
                  <Image
                    width={560}
                    height={360}
                    src={card.src}
                    alt={card.title}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-52 w-full object-cover object-center sm:h-56 md:h-60"
                  />
                </motion.div>

                <div className="flex flex-col gap-1.5">
                  <motion.div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <h3 className="font-heading text-center text-lg font-semibold text-foreground md:text-left">
                      {card.title}
                    </h3>
                    {card.comingSoon && card.comingSoonLabel ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-50">
                        <IconHourglassFilled className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {card.comingSoonLabel}
                      </span>
                    ) : null}
                  </motion.div>
                  <p className="text-center text-base leading-snug text-muted-foreground md:text-left">
                    {card.description}
                  </p>
                </div>

                <motion.span
                  className={cn(
                    "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-center text-sm font-semibold shadow-md transition-[transform,box-shadow,background] duration-[650ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-transform md:text-base",
                    primaryGradientInteractiveClassName,
                    card.comingSoon
                      ? "pointer-events-none cursor-not-allowed opacity-55"
                      : "group-hover:shadow-[0_8px_24px_var(--primary-elevated-shadow)]"
                  )}
                  variants={buttonHoverVariants}
                  transition={ctaHoverTransition}
                  aria-disabled={card.comingSoon ? true : undefined}
                >
                  {card.comingSoon ? (
                    <IconHourglassFilled className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  ) : null}
                  {card.ctaText}
                </motion.span>
              </motion.div>
            </motion.div>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}
