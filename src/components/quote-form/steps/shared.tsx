"use client";

import { motion } from "motion/react";

import type { QuoteFieldUpdater, QuoteFormData } from "@/lib/quote-form/constants";
import { cn } from "@/lib/utils";

/**
 * Shared classes for every text field in the quote form. `dark:bg-card-elevated`
 * is required (not redundant): it out-specifies the input primitives' own
 * translucent `dark:bg-input/30`, keeping fields byte-identical to the solid
 * `bg-card-elevated` section surfaces.
 */
export const QUOTE_FIELD_CLASS =
  "border-border/40 bg-card-elevated shadow-input-soft dark:bg-card-elevated placeholder:text-xs";

/**
 * Enter-only reveal for conditionally shown inputs. Exit animations are
 * deliberately avoided: AnimatePresence exit-gated unmounts hang with the
 * current motion/React versions.
 */
export function RevealOnEnter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/** Props every quote step receives; steps with uploads add their own on top. */
export type QuoteStepProps = {
  data: QuoteFormData;
  update: QuoteFieldUpdater;
};

/** Red asterisk marking a required field/group. */
export function RequiredMark() {
  return (
    <span className="text-xs font-semibold leading-none text-destructive" aria-hidden>
      *
    </span>
  );
}

/**
 * Question label above an option grid / field. `leading-none` + `mb-2.5`
 * mirror the `Label` primitive so paired columns align pixel-perfectly.
 */
export function GroupLabel({
  children,
  hint,
  required,
  className,
}: {
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mb-2.5", className)}>
      {/* block-level flex — inline-flex would add line-box space above and break
          cross-column label alignment */}
      <p className="flex items-baseline gap-0.5 text-sm leading-none font-semibold text-foreground">
        <span>{children}</span>
        {required ? <RequiredMark /> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Step heading (question group title + optional description). */
export function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
