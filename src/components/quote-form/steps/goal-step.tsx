"use client";

import { motion } from "motion/react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/language-context";
import { GOAL_OPTIONS } from "@/lib/quote-form/constants";
import { OptionCard } from "@/components/quote-form/option-card";
import { StepHeading, type QuoteStepProps } from "./shared";

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
            icon={opt.icon}
            label={v.goals[opt.key]}
            selected={data.goal === opt.key}
            onSelect={() => update("goal", opt.key)}
          />
        ))}
      </div>

      {/* Enter-only reveal — exit-gated unmounts hang with current motion/React. */}
      {data.goal === "other" ? (
        <motion.div
          key="goal-other"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="pt-4">
            <Label htmlFor="quote-goal-other" className="mb-2.5 font-semibold">
              {v.goalOtherLabel}
            </Label>
            <Input
              id="quote-goal-other"
              value={data.goalOther}
              onChange={(e) => update("goalOther", e.target.value)}
              placeholder={v.goalOtherPh}
              className="h-9 bg-background/40"
              maxLength={300}
            />
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
