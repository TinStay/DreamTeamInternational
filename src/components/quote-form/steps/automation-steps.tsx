"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import {
  AUTOMATION_INPUT_OPTIONS,
  AUTOMATION_TASK_OPTIONS,
  AUTOMATION_VOLUME_OPTIONS,
  PLATFORM_OPTIONS,
  toggleInArray,
} from "@/lib/quote-form/constants";
import { BriefStep, type BriefStepProps } from "./brief-step";
import { OptionGroup } from "./option-group";
import { StepHeading, type QuoteStepProps } from "./shared";
import { TimingStep } from "./timing-step";

/** Automation, step 1: what to produce automatically and how much per month. */
export function AutomationScopeStep({ data, update }: QuoteStepProps) {
  const { t } = useLanguage();
  const a = t.quoteForm.automation;
  return (
    <div>
      <StepHeading title={a.scopeTitle} />
      <div className="space-y-8">
        <OptionGroup
          required
          multi
          label={a.tasksLabel}
          options={AUTOMATION_TASK_OPTIONS}
          labelOf={(k) => a.tasks[k]}
          selected={data.automationTasks}
          onSelect={(k) => update("automationTasks", (prev) => toggleInArray(prev, k))}
          columns={3}
        />
        <OptionGroup
          required
          label={a.volumeLabel}
          options={AUTOMATION_VOLUME_OPTIONS}
          labelOf={(k) => a.volumes[k]}
          selected={data.automationVolume}
          onSelect={(k) => update("automationVolume", k)}
          columns={4}
        />
      </div>
    </div>
  );
}

/** Automation, step 2: what they already have + how the pipeline should work. */
export function AutomationBriefStep(props: Omit<BriefStepProps, "labels" | "before">) {
  const { t } = useLanguage();
  const a = t.quoteForm.automation;
  const { data, update } = props;
  return (
    <BriefStep
      {...props}
      labels={{
        title: a.briefTitle,
        briefLabel: a.briefLabel,
        briefPh: a.briefPh,
        uploadLabel: a.uploadLabel,
        uploadHint: a.uploadHint,
        linksLabel: a.linksLabel,
        linksPh: a.linksPh,
      }}
      before={
        <OptionGroup
          multi
          label={a.inputsLabel}
          options={AUTOMATION_INPUT_OPTIONS}
          labelOf={(k) => a.inputs[k]}
          selected={data.automationInputs}
          onSelect={(k) => update("automationInputs", (prev) => toggleInArray(prev, k))}
          columns={3}
        />
      }
    />
  );
}

/** Automation, step 3: destinations + start date. */
export function AutomationTimingStep({ data, update }: QuoteStepProps) {
  const { t } = useLanguage();
  const a = t.quoteForm.automation;
  const d = t.quoteForm.details;
  return (
    <TimingStep
      data={data}
      update={update}
      title={a.timingTitle}
      deadlineLabel={a.deadlineLabel}
      aside={
        <OptionGroup
          multi
          label={a.platformsLabel}
          options={PLATFORM_OPTIONS}
          labelOf={(k) => d.platforms[k]}
          selected={data.platforms}
          onSelect={(k) => update("platforms", (prev) => toggleInArray(prev, k))}
          columns={2}
        />
      }
    />
  );
}
