"use client";

import { OptionCard } from "@/components/quote-form/option-card";
import type { QuoteOption } from "@/lib/quote-form/constants";
import { cn } from "@/lib/utils";
import { GroupLabel } from "./shared";

const COLUMNS = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
} as const;

export type OptionGroupProps<K extends string> = {
  label: string;
  hint?: string;
  required?: boolean;
  options: readonly QuoteOption<K>[];
  labelOf: (key: K) => string;
  hintOf?: (key: K) => string | undefined;
  /** Current pick(s): a key (or "") for radios, an array for checkboxes. */
  selected: K | "" | readonly K[];
  onSelect: (key: K) => void;
  multi?: boolean;
  columns?: keyof typeof COLUMNS;
  className?: string;
};

/**
 * A labelled grid of `OptionCard`s - the building block of every choice in
 * the quote wizard (radio or multi-select). Handlers must use the updater form
 * of `update` (see `QuoteFieldUpdater`).
 */
export function OptionGroup<K extends string>({
  label,
  hint,
  required,
  options,
  labelOf,
  hintOf,
  selected,
  onSelect,
  multi = false,
  columns = 3,
  className,
}: OptionGroupProps<K>) {
  const isSelected = (key: K) => (Array.isArray(selected) ? selected.includes(key) : selected === key);
  return (
    <div className={className}>
      <GroupLabel required={required} hint={hint}>
        {label}
      </GroupLabel>
      <div role={multi ? "group" : "radiogroup"} aria-label={label} className={cn("grid gap-3 sm:gap-4", COLUMNS[columns])}>
        {options.map((opt) => (
          <OptionCard
            key={opt.key}
            compact
            multi={multi}
            icon={opt.icon}
            label={labelOf(opt.key)}
            hint={hintOf?.(opt.key)}
            selected={isSelected(opt.key)}
            onSelect={() => onSelect(opt.key)}
          />
        ))}
      </div>
    </div>
  );
}
