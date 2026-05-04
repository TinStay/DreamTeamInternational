"use client";

import type { ElementType } from "react";
import {
  IconBook2,
  IconBulb,
  IconCertificate,
  IconChartHistogram,
  IconClockHour4,
  IconListCheck,
  IconMessageCircle,
  IconRocket,
  IconShieldCheck,
  IconSparkles,
  IconStack2,
  IconTarget,
  IconTool,
  IconUsersGroup,
  IconVideo,
  IconWand,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs as AceternityTabs } from "@/components/ui/aceternity-tabs";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<string, ElementType<{ className?: string; stroke?: number }>> = {
  video: IconVideo,
  wand: IconWand,
  tool: IconTool,
  message: IconMessageCircle,
  checklist: IconListCheck,
  book: IconBook2,
  sparkles: IconSparkles,
  users: IconUsersGroup,
  clock: IconClockHour4,
  rocket: IconRocket,
  shield: IconShieldCheck,
  bulb: IconBulb,
  stack: IconStack2,
  certificate: IconCertificate,
  chart: IconChartHistogram,
  target: IconTarget,
};

const limeIcon = "h-5 w-5 shrink-0 text-lime-500 dark:text-lime-400";

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
  const Icon = FEATURE_ICONS[name] ?? IconSparkles;
  return <Icon className={limeIcon} stroke={1.75} aria-hidden />;
}

export function TrainingModalRich({ copy }: { copy: TrainingModalRichCopy }) {
  return (
    <div className="flex flex-col gap-6">
      <AceternityTabs
        className="max-w-full items-stretch"
        tabsClassName="rounded-2xl"
        contentClassName="mt-5"
        tabs={[
          {
            value: "highlights",
            title: copy.modalTabs.highlights,
            content: (
              <div className="flex flex-col gap-5">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {copy.modalIntro}
                </motion.p>
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
                      className="flex gap-3 rounded-xl border border-lime-500/15 bg-lime-500/[0.04] px-3 py-2.5 dark:border-lime-400/20 dark:bg-lime-400/[0.06]"
                    >
                      <FeatureIcon name={row.icon} />
                      <span className="text-[0.9375rem] leading-snug text-foreground/90">{row.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ),
          },
          {
            value: "more",
            title: copy.modalTabs.more,
            content: (
              <div className="grid gap-4 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <Card size="sm" className="h-full border-lime-500/15 bg-gradient-to-b from-card to-lime-500/[0.03] dark:from-card dark:to-lime-400/[0.04]">
                    <CardHeader className="border-b border-border/30 pb-3">
                      <CardTitle className="text-base">{copy.outcomesTitle}</CardTitle>
                      <CardDescription className="text-xs">{copy.outcomesSubtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pt-2">
                      {copy.outcomes.map((row, i) => (
                        <motion.div
                          key={`${row.text}-${i}`}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i, duration: 0.3 }}
                          className="flex gap-2.5 text-sm text-muted-foreground"
                        >
                          <FeatureIcon name={row.icon} />
                          <span className="text-foreground/85">{row.text}</span>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
                >
                  <Card size="sm" className="h-full border-border/40 bg-card/90">
                    <CardHeader className="border-b border-border/30 pb-3">
                      <CardTitle className="text-base">{copy.logisticsTitle}</CardTitle>
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
                </motion.div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
