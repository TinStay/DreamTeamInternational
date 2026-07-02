"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip, type ChipColor } from "@/components/ui/heroui-chip";
import { ServiceStepsAccordion, type ServiceStep } from "@/components/ui/service-steps-accordion";
import { cn } from "@/lib/utils";

export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
};

export type { ServiceStep as ShowcaseStep };

const STAT_CHIP_COLORS: ChipColor[] = ["accent", "success", "warning", "danger", "default"];

const SECTION_TAB_TRIGGER =
  "cursor-pointer rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-foreground/80 shadow-none transition-[transform,color] duration-200 sm:px-4 sm:py-2 sm:text-sm data-active:border-0 data-active:bg-gradient-to-r data-active:from-[var(--primary-gradient-start)] data-active:to-[var(--primary-gradient-end)] data-active:text-primary-foreground data-active:shadow-none hover:text-foreground data-active:hover:scale-[1.03] data-active:hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] data-active:hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)] data-active:hover:text-primary-foreground";

const MODAL_TAB_TRIGGER =
  "relative inline-flex !h-auto !min-h-0 !flex-none !grow-0 shrink-0 basis-auto cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent px-2.5 py-1.5 text-[11px] font-semibold leading-tight whitespace-nowrap shadow-none transition-colors sm:px-3.5 sm:py-2 sm:text-xs lg:px-4 lg:py-2 lg:text-sm data-active:bg-transparent data-active:shadow-none hover:text-foreground";

export type FeatureShowcaseProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  stats?: string[];
  steps?: ServiceStep[];
  tabs: TabMedia[];
  defaultTab?: string;
  panelMinHeight?: number;
  className?: string;
  variant?: "section" | "modal";
  titleAs?: "h1" | "h2";
};

function ModalCarouselTabs({
  tabs,
  activeTab,
  setActiveTab,
  tabIndicatorId,
  isModal = true,
}: {
  tabs: TabMedia[];
  activeTab: string;
  setActiveTab: (value: string) => void;
  tabIndicatorId: string;
  isModal?: boolean;
}) {
  return (
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
            className={cn("absolute inset-0 m-0 h-full w-full p-0", "data-[hidden]:hidden")}
          >
            <motion.div
              className="group/image relative h-full w-full overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Image
                src={t.src}
                alt={t.alt ?? t.label}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                priority={idx === 0}
                className="object-cover transition-transform duration-500 ease-out group-hover/image:scale-110"
              />
            </motion.div>
          </TabsContent>
        ))}
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex w-full items-center justify-center px-2 pb-4 pt-2 sm:px-3 sm:pb-6 lg:pb-3 lg:pt-1">
        <TabsList
          className={cn(
            "relative inline-flex h-auto min-h-0 w-fit max-w-full flex-nowrap items-center justify-center overflow-visible rounded-full border border-border/40 bg-background/90 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/80 group-data-horizontal/tabs:h-auto",
            isModal ? "gap-1 p-1.5 sm:gap-1.5 sm:p-2" : "gap-1.5 p-1"
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
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)]"
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
  );
}

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
  titleAs = "h2",
}: FeatureShowcaseProps) {
  const initial = defaultTab ?? tabs[0]?.value ?? "tab-0";
  const [activeTab, setActiveTab] = React.useState(initial);
  const isModal = variant === "modal";
  const TitleTag = titleAs;
  const resolvedPanelHeight = panelMinHeight ?? (isModal ? 620 : 720);
  const tabIndicatorId = isModal ? "feature-showcase-modal-tab" : "feature-showcase-section-tab";

  React.useEffect(() => {
    setActiveTab(initial);
  }, [initial]);

  return (
    <section
      className={cn(
        "w-full text-foreground",
        isModal
          ? "flex flex-col max-lg:flex-none max-lg:min-h-0 lg:min-h-0 lg:flex-1 bg-white px-0 py-0 dark:bg-neutral-950"
          : "bg-background px-6 py-16 md:py-10",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto grid grid-cols-1 gap-8",
          isModal
            ? "max-w-none gap-4 max-lg:block max-lg:flex-none max-lg:pb-0 lg:grid lg:min-h-0 lg:flex-1 lg:h-full lg:grid-cols-2 lg:gap-5 lg:pb-0"
            : "w-full max-w-none gap-6 md:grid-cols-12 lg:gap-8"
        )}
      >
        <div className={cn(isModal ? "flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden" : "md:col-span-6")}>
          {!isModal && eyebrow ? (
            <Badge variant="outline" className="mb-4">
              {eyebrow}
            </Badge>
          ) : null}

          {title ? (
            <TitleTag
              className={cn(
                "text-balance font-bold leading-tight",
                isModal
                  ? "font-heading text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
                  : "font-heading text-3xl tracking-tight sm:text-4xl md:text-5xl"
              )}
            >
              {title}
            </TitleTag>
          ) : null}

          {description ? (
            <p
              className={cn(
                "mt-4 text-muted-foreground",
                isModal ? "text-sm leading-relaxed sm:text-base" : "mt-3"
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
                  size="md"
                  variant={isModal ? "primary" : "secondary"}
                  className={isModal ? undefined : "px-3.5 tracking-wide"}
                >
                  {label}
                </Chip>
              ))}
            </div>
          )}

          {steps.length > 0 && (
            <div
              className={cn(
                isModal ? "mt-5 flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden" : "mt-8 w-full"
              )}
            >
              <ServiceStepsAccordion
                steps={steps}
                // Mobile: whole modal scrolls. Desktop: accordion column scrolls via className below.
                scrollable={false}
                className={cn(
                  isModal &&
                    "max-lg:overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-y-contain lg:pr-3",
                  !isModal && "w-full"
                )}
              />
            </div>
          )}

          {isModal ? (
            <div className="mt-5 mb-1 lg:hidden">
              <Card
                className="relative aspect-[3/4] w-full min-h-[min(72vw,480px)] shrink-0 overflow-hidden rounded-2xl border border-border bg-card/40 p-0 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <ModalCarouselTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  tabIndicatorId={`${tabIndicatorId}-mobile`}
                />
              </Card>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            isModal ? "hidden min-h-0 flex-col lg:flex lg:h-full lg:min-h-0" : "md:col-span-6"
          )}
        >
          <Card
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border bg-card/40 p-0 shadow-sm",
              isModal && "min-h-[640px] flex-1 dark:border-neutral-800 dark:bg-neutral-900/40 lg:h-full lg:min-h-0"
            )}
            style={
              isModal
                ? undefined
                : { height: resolvedPanelHeight, minHeight: resolvedPanelHeight }
            }
          >
            <ModalCarouselTabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabIndicatorId={tabIndicatorId}
              isModal={isModal}
            />
          </Card>
        </div>
      </div>
    </section>
  );
}
