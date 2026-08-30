"use client";

import { motion } from "motion/react";
import { IconCheck } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import type { QuoteOptionIcon } from "@/lib/quote-form/constants";

export type OptionCardProps = {
  icon: QuoteOptionIcon;
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
  /** Renders as a checkbox (multi-select) instead of a radio. */
  multi?: boolean;
  /** Smaller paddings/icon — for secondary groups (format, voice-over). */
  compact?: boolean;
  className?: string;
};

/**
 * Selectable card used for every choice in the quote form — icon, label and an
 * optional hint. Selection state is conveyed via a gradient icon chip, a
 * primary ring and a check badge.
 */
export function OptionCard({
  icon: Icon,
  label,
  hint,
  selected,
  onSelect,
  multi = false,
  compact = false,
  className,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex w-full cursor-pointer items-center rounded-2xl border text-left transition-colors",
        compact ? "gap-3 p-3 sm:p-3.5" : "gap-3 p-3 sm:gap-4 sm:p-5",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary/60 bg-card shadow-[0_10px_30px_var(--primary-soft-glow)]"
          : "border-border/50 bg-card/60 hover:border-border hover:bg-card",
        className
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl transition-colors",
          compact ? "size-9 rounded-xl sm:size-10" : "size-10 sm:size-13",
          selected
            ? "bg-primary-gradient text-white"
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden
      >
        <Icon className={cn(compact ? "size-4.5 sm:size-5" : "size-5 sm:size-6.5")} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-semibold text-foreground",
            compact ? "text-sm" : "text-sm sm:text-base"
          )}
        >
          {label}
        </span>
        {hint ? (
          <span
            className={cn(
              "block leading-snug text-muted-foreground",
              compact ? "mt-0.5 text-xs" : "mt-0.5 text-xs sm:mt-1 sm:text-sm"
            )}
          >
            {hint}
          </span>
        ) : null}
      </span>

      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border transition-all",
          multi ? "rounded-md" : "rounded-full",
          selected
            ? "border-transparent bg-primary-gradient text-white"
            : "border-border bg-transparent text-transparent"
        )}
        aria-hidden
      >
        <IconCheck className="size-3.5" stroke={3} />
      </span>
    </motion.button>
  );
}
