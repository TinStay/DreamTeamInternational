"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { GOAL_OPTIONS } from "@/lib/quote-form/constants";
import { OptionCard } from "@/components/quote-form/option-card";
import { QUOTE_FIELD_CLASS, RevealOnEnter, StepHeading, type QuoteStepProps } from "./shared";

/** Main goal of the video — the step title itself asks the question. */
export function GoalStep({ data, update }: QuoteStepProps) {
  const { t } = useLanguage();
  const v = t.quoteForm.video;

  return (
    <div>
      <StepHeading title={v.title} />

      <div
        role="radiogroup"
        aria-label={v.goalLabel}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {GOAL_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.key}
            compact
            icon={opt.icon}
            label={v.goals[opt.key]}
            selected={data.goal === opt.key}
            onSelect={() => update("goal", opt.key)}
          />
        ))}
      </div>

      {data.goal === "other" ? (
        <RevealOnEnter>
          <div className="pt-4">
            <Label htmlFor="quote-goal-other" className="mb-2.5 font-semibold">
              {v.goalOtherLabel}
            </Label>
            <Input
              id="quote-goal-other"
              value={data.goalOther}
              onChange={(e) => update("goalOther", e.target.value)}
              placeholder={v.goalOtherPh}
              className={cn("h-9", QUOTE_FIELD_CLASS)}
              maxLength={300}
            />
          </div>
        </RevealOnEnter>
      ) : null}
    </div>
  );
}
