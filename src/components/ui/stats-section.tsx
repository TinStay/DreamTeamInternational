"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { JourneyItem, type JourneySide } from "@/components/ui/scroll-journey";
import { cn } from "@/lib/utils";

export type StatsSectionItem = {
  value: string;
  label: string;
  /** Optional artwork rendered in place of the number; `value` becomes its alt. */
  imgSrc?: string;
};

export type StatsSectionProps = {
  title1: string;
  title2: string;
  subline: string;
  items: StatsSectionItem[];
  className?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease },
  },
};

const statImage: Variants = {
  hidden: { opacity: 0, scale: 0.78, y: 24, rotate: -2.5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.8, ease },
  },
};

const statValueClassName =
  "bg-linear-to-r from-zinc-950 to-zinc-600 bg-clip-text text-6xl font-bold text-transparent sm:text-7xl md:text-8xl dark:from-white dark:to-zinc-800";

const viewport = { once: true, margin: "-80px 0px -60px 0px" } as const;
const STAT_SIDES: JourneySide[] = ["left", "bottom", "right"];

export function StatsSection({ title1, title2, subline, items, className }: StatsSectionProps) {
  return (
    <section className={cn("py-12 md:py-20", className)}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 md:space-y-12">
        {/* Journey parts (home): the heading block arrives first, then the three stats from the left / below / right. */}
        <JourneyItem kind="title">
        <motion.div
          className="relative z-10 mx-auto max-w-2xl space-y-3 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.h2
            variants={fadeUp}
            className="font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl text-foreground"
          >
            <span className="text-section-accent">{title1}</span> {title2}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground">
            {subline}
          </motion.p>
        </motion.div>
        </JourneyItem>

        <motion.div
          className="grid divide-y divide-border *:text-center md:grid-cols-3 md:gap-2 md:divide-x md:divide-y-0"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
          }}
        >
          {items.map((item, index) => (
            <JourneyItem
              key={item.label}
              index={index}
              from={STAT_SIDES[index % STAT_SIDES.length]}
              className="space-y-0 py-12 md:py-0"
            >
              {item.imgSrc ? (
                <motion.div
                  variants={statImage}
                  whileHover={{ scale: 1.05, transition: { duration: 0.3, ease } }}
                  className="relative mx-auto h-44 w-full md:h-56"
                >
                  <Image
                    src={item.imgSrc}
                    alt={item.value}
                    fill
                    sizes="(min-width: 768px) 420px, 320px"
                    quality={100}
                    className="object-contain"
                  />
                </motion.div>
              ) : (
                <div className={statValueClassName}>{item.value}</div>
              )}
              <p className="-mt-3 text-xl font-medium text-muted-foreground md:-mt-4 md:text-2xl">{item.label}</p>
            </JourneyItem>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
