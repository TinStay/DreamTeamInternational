"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export type AceternityTab = {
  title: string;
  value: string;
  content: React.ReactNode;
};

export function Tabs({
  tabs,
  className,
  tabsClassName,
  contentClassName,
  defaultValue,
}: {
  tabs: AceternityTab[];
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
  defaultValue?: string;
}) {
  const first = tabs[0]?.value;
  const [active, setActive] = React.useState<string>(defaultValue ?? first ?? "");

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.value === active)
  );

  const current = tabs[activeIndex] ?? tabs[0];

  return (
    <div
      className={cn(
        "w-full [perspective:1000px] relative flex flex-col max-w-7xl mx-auto items-start justify-start",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-x-auto no-scrollbar",
          "rounded-2xl border border-border/20 bg-background/40 backdrop-blur-md shadow-elevated-soft",
          "px-2 py-2",
          tabsClassName
        )}
      >
        {/* Edge fades hint scrolling on mobile */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background/80 to-transparent" />

        <div className="relative flex w-max min-w-full items-center gap-2 px-2">
          {tabs.map((tab) => {
            const isActive = tab.value === active;
            return (
              <button
                key={tab.value}
                onClick={() => setActive(tab.value)}
                className={cn(
                  "relative shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                  "text-foreground/70 hover:text-foreground",
                  isActive && "text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="aceternity-tab-pill"
                    className="absolute inset-0 rounded-xl bg-primary/15 border border-primary/25"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("mt-8 w-full", contentClassName)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.value}
            initial={{ opacity: 0, y: 10, rotateX: -2 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -10, rotateX: 2 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full"
          >
            {current?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

