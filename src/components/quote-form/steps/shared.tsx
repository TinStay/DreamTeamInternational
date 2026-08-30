"use client";

import type { QuoteFormData } from "@/lib/quote-form/constants";
import { cn } from "@/lib/utils";

/** Props every quote step receives; steps with uploads add their own on top. */
export type QuoteStepProps = {
  data: QuoteFormData;
  update: <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => void;
};

/** Red asterisk marking a required field/group. */
export function RequiredMark() {
  return (
    <span className="text-xs font-semibold leading-none text-destructive" aria-hidden>
      *
    </span>
  );
}

/** Question label above an option grid / field. */
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
    <div className={cn("mb-4", className)}>
      <p className="inline-flex items-baseline gap-0.5 text-sm font-semibold text-foreground">
        <span>{children}</span>
        {required ? <RequiredMark /> : null}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
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
