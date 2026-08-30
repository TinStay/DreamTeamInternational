"use client";

import * as React from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** yyyy-mm-dd in the LOCAL calendar (toISOString would shift near midnight). */
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export type MiniCalendarProps = {
  /** Selected date as yyyy-mm-dd; empty string = nothing selected. */
  value: string;
  /** Called with yyyy-mm-dd, or "" when the selected day is tapped again. */
  onChange: (value: string) => void;
  /** BCP-47 locale for month/weekday names (e.g. "bg", "en"). */
  locale: string;
  prevLabel: string;
  nextLabel: string;
  className?: string;
};

/**
 * Week-strip date picker: shows 7 upcoming days at a time, starting from
 * tomorrow. Arrows page a week at a time; past days are never shown.
 * Tapping the selected day clears the selection (the field is optional).
 */
export function MiniCalendar({
  value,
  onChange,
  locale,
  prevLabel,
  nextLabel,
  className,
}: MiniCalendarProps) {
  // Earliest visible day: tomorrow (a deadline of "today" isn't actionable).
  const [minDay] = React.useState(() => addDays(startOfDay(new Date()), 1));
  const [weekStart, setWeekStart] = React.useState<Date>(() => {
    const selected = parseKey(value);
    if (!selected || selected < minDay) return minDay;
    const offsetDays = Math.floor((selected.getTime() - minDay.getTime()) / 86_400_000);
    return addDays(minDay, Math.floor(offsetDays / 7) * 7);
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const canGoBack = weekStart > minDay;

  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const shortMonthFmt = new Intl.DateTimeFormat(locale, { month: "short" });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dayAriaFmt = new Intl.DateTimeFormat(locale, { dateStyle: "full" });

  const stripEnd = days[6];
  const monthLabel =
    weekStart.getMonth() === stripEnd.getMonth()
      ? monthFmt.format(weekStart)
      : `${shortMonthFmt.format(weekStart)} - ${shortMonthFmt.format(stripEnd)} ${stripEnd.getFullYear()}`;

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border/50 bg-card/60 p-3 sm:p-4",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label={prevLabel}
          disabled={!canGoBack}
          onClick={() => {
            const prev = addDays(weekStart, -7);
            setWeekStart(prev < minDay ? minDay : prev);
          }}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <IconChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold text-foreground first-letter:uppercase">
          {monthLabel}
        </span>
        <button
          type="button"
          aria-label={nextLabel}
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <IconChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toKey(day);
          const isSelected = key === value;
          return (
            <button
              key={key}
              type="button"
              aria-label={dayAriaFmt.format(day)}
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? "" : key)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors sm:py-2",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected
                  ? "bg-primary-gradient text-white shadow-[0_8px_22px_var(--primary-soft-glow)]"
                  : "hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase",
                  isSelected ? "text-white/80" : "text-muted-foreground"
                )}
              >
                {weekdayFmt.format(day)}
              </span>
              <time
                dateTime={key}
                className={cn(
                  "text-sm font-semibold",
                  isSelected ? "text-white" : "text-foreground"
                )}
              >
                {day.getDate()}
              </time>
            </button>
          );
        })}
      </div>
    </div>
  );
}
