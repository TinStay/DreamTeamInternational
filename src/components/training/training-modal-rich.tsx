"use client";

import type { ElementType } from "react";
import {
  IconAdjustmentsFilled,
  IconAffiliateFilled,
  IconAwardFilled,
  IconBoltFilled,
  IconBookFilled,
  IconBulbFilled,
  IconChartPieFilled,
  IconClockHour4Filled,
  IconListCheckFilled,
  IconMessageCircleFilled,
  IconRosetteFilled,
  IconShieldCheckFilled,
  IconSparklesFilled,
  IconStack2Filled,
  IconVideoFilled,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURE_ICONS: Record<string, ElementType<{ className?: string }>> = {
  video: IconVideoFilled,
  wand: IconSparklesFilled,
  tool: IconAdjustmentsFilled,
  message: IconMessageCircleFilled,
  checklist: IconListCheckFilled,
  book: IconBookFilled,
  sparkles: IconSparklesFilled,
  users: IconAffiliateFilled,
  clock: IconClockHour4Filled,
  rocket: IconBoltFilled,
  shield: IconShieldCheckFilled,
  bulb: IconBulbFilled,
  stack: IconStack2Filled,
  certificate: IconAwardFilled,
  chart: IconChartPieFilled,
  target: IconRosetteFilled,
};

const iconClass = "h-5 w-5 shrink-0 text-lime-600 dark:text-lime-400";

export type TrainingModalRichCopy = {
  modalIntro: string;
  features: Array<{ icon: string; text: string }>;
  modalTabs: { highlights: string; more: string };
  outcomesTitle: string;
  outcomesSubtitle: string;
  outcomes: Array<{ icon: string; text: string }>;
  logisticsTitle: string;
  logistics: string[];
};

function FeatureIcon({ name }: { name: string }) {
  const Icon = FEATURE_ICONS[name] ?? IconSparklesFilled;
  return <Icon className={iconClass} aria-hidden />;
}

function FeatureList({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <ul className="flex flex-col gap-3.5">
      {copy.features.map((row, i) => (
        <motion.li
          key={`${row.text}-${i}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.08 + i * 0.07,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex gap-3 rounded-xl border border-lime-500/15 bg-lime-500/[0.06] px-3 py-2.5 dark:border-lime-400/20 dark:bg-lime-400/[0.08]"
        >
          <FeatureIcon name={row.icon} />
          <span className="text-[0.9375rem] leading-snug text-foreground/90">{row.text}</span>
        </motion.li>
      ))}
    </ul>
  );
}

function IntroBlock({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem] md:leading-relaxed"
    >
      {copy.modalIntro}
    </motion.p>
  );
}

function OutcomesCard({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <ul className="space-y-3">
      {copy.outcomes.map((row, i) => (
        <motion.li
          key={`${row.text}-${i}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.3 }}
          className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
        >
          <FeatureIcon name={row.icon} />
          <span className="text-foreground/85">{row.text}</span>
        </motion.li>
      ))}
    </ul>
  );
}

function LogisticsCard({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <Card size="sm" className="h-full border-border/40 bg-card/90">
      <CardHeader className="border-b border-border/30 pb-3">
        <CardTitle className="text-base font-bold">{copy.logisticsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-2">
        {copy.logistics.map((para, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {para}
          </motion.p>
        ))}
      </CardContent>
    </Card>
  );
}

function HighlightsPanel({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <div className="flex flex-col gap-5">
      <IntroBlock copy={copy} />
      <FeatureList copy={copy} />
    </div>
  );
}

function MorePanel({ copy }: { copy: TrainingModalRichCopy }) {
  const showLogistics = Boolean(copy.logisticsTitle) && copy.logistics.length > 0;
  return (
    <div className="flex flex-col gap-4 md:gap-5 lg:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <OutcomesCard copy={copy} />
      </motion.div>
      {showLogistics ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
        >
          <LogisticsCard copy={copy} />
        </motion.div>
      ) : null}
    </div>
  );
}

const sectionHeadingClass =
  "font-heading text-xs font-semibold uppercase tracking-[0.18em] text-foreground/80";

export function TrainingModalIncludes({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <section className="space-y-4" aria-labelledby="training-modal-includes">
      <h2 id="training-modal-includes" className={sectionHeadingClass}>
        {copy.modalTabs.highlights}
      </h2>
      <HighlightsPanel copy={copy} />
    </section>
  );
}

export function TrainingModalDetails({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <section className="space-y-4" aria-labelledby="training-modal-details">
      <h2 id="training-modal-details" className={sectionHeadingClass}>
        {copy.modalTabs.more}
      </h2>
      <MorePanel copy={copy} />
    </section>
  );
}

export function TrainingModalRich({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <div className="flex flex-col gap-10">
      <TrainingModalIncludes copy={copy} />
      <TrainingModalDetails copy={copy} />
    </div>
  );
}
