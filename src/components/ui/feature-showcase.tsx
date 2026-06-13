"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip, type ChipColor } from "@/components/ui/heroui-chip";
import { ServiceStepsAccordion } from "@/components/ui/service-steps-accordion";
import { cn } from "@/lib/utils";

export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
};

export type ShowcaseStep = {
  id: string;
  title: string;
  text: string;
};

const STAT_CHIP_COLORS: ChipColor[] = ["accent", "success", "warning", "danger", "default"];

const SECTION_TAB_TRIGGER =
  "cursor-pointer rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-foreground/80 shadow-none transition-[transform,color] duration-200 sm:px-4 sm:py-2 sm:text-sm data-active:border-0 data-active:bg-gradient-to-r data-active:from-[var(--primary-gradient-start)] data-active:to-[var(--primary-gradient-end)] data-active:text-primary-foreground data-active:shadow-none hover:text-foreground data-active:hover:scale-[1.03] data-active:hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] data-active:hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)] data-active:hover:text-primary-foreground";

const MODAL_TAB_TRIGGER =
  "relative inline-flex !h-auto !min-h-0 !flex-none !grow-0 shrink-0 basis-auto cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent px-3 py-2 text-xs font-semibold leading-tight whitespace-nowrap shadow-none transition-colors sm:px-5 sm:py-2.5 sm:text-sm lg:px-6 lg:py-3 lg:text-base data-active:bg-transparent data-active:shadow-none hover:text-foreground";

export type FeatureShowcaseProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: string[];
  steps?: ShowcaseStep[];
  tabs: TabMedia[];
  defaultTab?: string;
  panelMinHeight?: number;
  className?: string;
  variant?: "section" | "modal";
};

export function FeatureShowcase({
  eyebrow = "Discover",
  title,
  description,
  stats = [],
  steps = [],
  tabs,
  defaultTab,
  panelMinHeight,
  className,
  variant = "section",
}: FeatureShowcaseProps) {
  const initial = defaultTab ?? tabs[0]?.value ?? "tab-0";
  const [activeTab, setActiveTab] = React.useState(initial);
  const isModal = variant === "modal";
  const resolvedPanelHeight = panelMinHeight ?? (isModal ? 520 : 720);
  const tabIndicatorId = isModal ? "feature-showcase-modal-tab" : "feature-showcase-section-tab";

  React.useEffect(() => {
    setActiveTab(initial);
  }, [initial]);

  return (
    <section
      className={cn(
        "w-full bg-background text-foreground",
        isModal ? "flex min-h-0 flex-1 flex-col px-0 py-0" : "px-6 py-16 md:py-10",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto grid grid-cols-1 gap-8",
          isModal
            ? "min-h-0 flex-1 max-w-none items-stretch gap-4 pb-2 lg:grid-cols-2 lg:gap-5 lg:pb-0"
            : "container max-w-7xl gap-10 md:grid-cols-12 lg:gap-14"
        )}
      >
        <div className={cn(isModal ? "" : "md:col-span-6")}>
          {!isModal && eyebrow ? (
            <Badge variant="outline" className="mb-4">
              {eyebrow}
            </Badge>
          ) : null}

          <h2
            className={cn(
              "text-balance font-bold leading-tight",
              isModal
                ? "font-heading text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
                : "text-4xl leading-[0.95] sm:text-5xl md:text-6xl"
            )}
          >
            {title}
          </h2>

          {description ? (
            <p
              className={cn(
                "mt-4 text-muted-foreground",
                isModal ? "text-sm leading-relaxed sm:text-base" : "mt-6 max-w-xl"
              )}
            >
              {description}
            </p>
          ) : null}

          {stats.length > 0 && (
            <div className={cn("flex flex-wrap gap-2", isModal ? "mt-4" : "mt-6")}>
              {stats.map((label, index) => (
                <Chip
                  key={label}
                  color={STAT_CHIP_COLORS[index % STAT_CHIP_COLORS.length]}
                  size={isModal ? "md" : "sm"}
                  variant="secondary"
                >
                  {label}
                </Chip>
              ))}
            </div>
          )}

          {steps.length > 0 && (
            <div className={cn(isModal ? "mt-5 max-w-none" : "mt-10 max-w-xl")}>
              {isModal ? (
                <ServiceStepsAccordion steps={steps} />
              ) : (
                <ServiceStepsAccordion steps={steps} className="max-w-xl" />
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            isModal ? "mb-10 flex min-h-0 flex-col lg:mb-0 lg:min-h-[560px]" : "md:col-span-6"
          )}
        >
          <Card
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border bg-card/40 p-0 shadow-sm",
              isModal && "min-h-[280px] flex-1 lg:min-h-0"
            )}
            style={
              isModal
                ? { minHeight: resolvedPanelHeight }
                : { height: resolvedPanelHeight, minHeight: resolvedPanelHeight }
            }
          >
            <Tabs
              value={activeTab}
              onValueChange={(value) => value && setActiveTab(value)}
              className="relative h-full w-full"
            >
              <div className="relative h-full w-full">
                {tabs.map((t, idx) => (
                  <TabsContent
                    key={t.value}
                    value={t.value}
                    className={cn(
                      "absolute inset-0 m-0 h-full w-full p-0",
                      "data-[hidden]:hidden"
                    )}
                  >
                    <motion.div
                      className="group/image relative h-full w-full overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <img
                        src={t.src}
                        alt={t.alt ?? t.label}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/image:scale-110"
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                    </motion.div>
                  </TabsContent>
                ))}
              </div>

              <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex w-full items-center justify-center px-2 pb-4 pt-2 sm:px-3 sm:pb-6 lg:pb-3 lg:pt-1">
                <TabsList
                  className={cn(
                    "relative inline-flex h-auto min-h-0 w-fit max-w-full flex-nowrap items-center justify-center overflow-visible rounded-full border border-border/40 bg-background/90 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/80 group-data-horizontal/tabs:h-auto",
                    isModal ? "gap-1.5 p-2 sm:gap-2 sm:p-2.5" : "gap-1.5 p-1"
                  )}
                >
                  {tabs.map((t) => {
                    const isActive = activeTab === t.value;

                    return (
                      <TabsTrigger
                        key={t.value}
                        value={t.value}
                        className={isModal ? MODAL_TAB_TRIGGER : SECTION_TAB_TRIGGER}
                      >
                        {isModal && isActive ? (
                          <motion.span
                            layoutId={tabIndicatorId}
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)]"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        ) : null}
                        <span
                          className={cn(
                            "relative z-10 flex items-center justify-center text-center transition-colors duration-200",
                            isModal && isActive && "px-1 text-primary-foreground",
                            isModal && !isActive && "px-0.5 text-foreground/75 hover:text-foreground"
                          )}
                        >
                          {t.label}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </section>
  );
}
