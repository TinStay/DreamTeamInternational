"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export type StatsSectionItem = {
  value: string;
  label: string;
};

export type StatsSectionProps = {
  headline: string;
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

const statItem: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease },
  },
};

const statValueClassName =
  "bg-linear-to-r from-zinc-950 to-zinc-600 bg-clip-text text-6xl font-bold text-transparent sm:text-7xl md:text-8xl dark:from-white dark:to-zinc-800";

const viewport = { once: true, margin: "-80px 0px -60px 0px" } as const;

export function StatsSection({ headline, subline, items, className }: StatsSectionProps) {
  return (
    <section className={cn("py-12 md:py-20", className)}>
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-12">
        <motion.div
          className="relative z-10 mx-auto max-w-2xl space-y-6 text-center"
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
            className="font-heading text-4xl font-medium text-foreground lg:text-5xl"
          >
            {headline}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-base text-muted-foreground md:text-lg">
            {subline}
          </motion.p>
        </motion.div>

        <motion.div
          className="grid gap-12 divide-y *:text-center md:grid-cols-3 md:gap-2 md:divide-x md:divide-y-0 md:divide-border"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
          }}
        >
          {items.map((item) => (
            <motion.div
              key={item.label}
              variants={statItem}
              className="space-y-4 pt-12 first:pt-0 md:pt-0"
            >
              <div className={statValueClassName}>{item.value}</div>
              <p className="text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
