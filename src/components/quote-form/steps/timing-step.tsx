"use client";

import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MiniCalendar } from "@/components/ui/mini-calendar";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { QUOTE_FIELD_CLASS, GroupLabel, StepHeading, type QuoteStepProps } from "./shared";

export type TimingStepProps = QuoteStepProps & {
  title: string;
  deadlineLabel: string;
  /** Right column - typically an `OptionGroup` (where it will be used / published). */
  aside?: ReactNode;
};

/**
 * Deadline + notes (left) with a flow-specific group on the right - the last
 * question step of the images / mascot / automation flows (the video flow has
 * its own `DetailsStep`).
 */
export function TimingStep({ data, update, title, deadlineLabel, aside }: TimingStepProps) {
  const { t, language } = useLanguage();
  const d = t.quoteForm.details;
  const tm = t.quoteForm.timing;

  return (
    <div>
      <StepHeading title={title} />

      <div className={cn("grid grid-cols-1 items-start gap-8", aside && "lg:grid-cols-[4fr_6fr]")}>
        <div>
          <GroupLabel>{deadlineLabel}</GroupLabel>
          <MiniCalendar
            value={data.deadline}
            onChange={(next) => update("deadline", next)}
            locale={language}
            prevLabel={d.prevWeek}
            nextLabel={d.nextWeek}
            className={cn("transition-opacity", data.deadlineFlexible && "pointer-events-none opacity-50")}
          />
          <Label className="mt-3 cursor-pointer items-start gap-2.5 text-sm font-normal text-muted-foreground">
            <Checkbox
              checked={data.deadlineFlexible}
              onCheckedChange={(checked) => {
                const flexible = Boolean(checked);
                update("deadlineFlexible", flexible);
                if (flexible) update("deadline", "");
              }}
              className="mt-0.5 cursor-pointer"
            />
            {tm.noDeadline}
          </Label>

          <div className="mt-6">
            <Label htmlFor="quote-notes" className="mb-2.5 font-semibold">
              {tm.notesLabel}
            </Label>
            <Textarea
              id="quote-notes"
              rows={2}
              value={data.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={tm.notesPh}
              className={cn("min-h-0", QUOTE_FIELD_CLASS)}
              maxLength={3000}
            />
          </div>
        </div>

        {aside ? <div>{aside}</div> : null}
      </div>
    </div>
  );
}
