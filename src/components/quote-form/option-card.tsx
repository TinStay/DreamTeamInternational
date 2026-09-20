"use client";

import * as React from "react";
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
 *
 * Memoized with a comparator that ignores `onSelect` identity, so keystrokes
 * in sibling fields don't re-render every motion card.
 *
 * CONTRACT: because unchanged cards keep the `onSelect` closure from an older
 * render, handlers must NOT read form state directly — derive the next value
 * with the updater form of `update` (see `QuoteFieldUpdater`). Reading
 * `data.formats`/`data.platforms` inside a handler makes a stale card clobber
 * selections made after its last render.
 */
function OptionCardImpl({
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
        // Subtle resting shadow so cards lift off the page in both themes.
        "shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.28)]",
        selected
          ? "border-primary/60 bg-card-elevated shadow-[0_10px_30px_var(--primary-soft-glow)] dark:shadow-[0_10px_30px_var(--primary-soft-glow)]"
          : "border-border/50 bg-card-elevated hover:border-border",
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
            // 15px on phones either way (the client found the card text small there); the desktop sizes stay.
            compact ? "text-[15px] sm:text-sm" : "text-[15px] sm:text-base"
          )}
        >
          {label}
        </span>
        {hint ? (
          <span
            className={cn(
              "block leading-snug text-muted-foreground",
              compact ? "mt-0.5 text-[13px] sm:text-xs" : "mt-0.5 text-[13px] sm:mt-1 sm:text-sm"
            )}
          >
            {hint}
          </span>
        ) : null}
      </span>

      {/* Selection indicator: square checkbox for multi-select, radio dot otherwise.
          Gradient fill with NO border when selected — a gradient painted under a
          1px transparent border is what caused the red/purple hairline fringes.
          Explicit 5px radius: the theme's rounded-md is ~18px. */}
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center transition-all",
          multi ? "rounded-[5px]" : "rounded-full",
          selected
            ? "bg-primary-gradient text-white"
            : "border border-border bg-transparent text-transparent"
        )}
        aria-hidden
      >
        {multi ? (
          <IconCheck className="size-3.5" stroke={3} />
        ) : (
          <span
            className={cn(
              "size-2 rounded-full transition-colors",
              selected ? "bg-white" : "bg-transparent"
            )}
          />
        )}
      </span>
    </motion.button>
  );
}

export const OptionCard = React.memo(
  OptionCardImpl,
  (prev, next) =>
    prev.icon === next.icon &&
    prev.label === next.label &&
    prev.hint === next.hint &&
    prev.selected === next.selected &&
    prev.multi === next.multi &&
    prev.compact === next.compact &&
    prev.className === next.className
);
