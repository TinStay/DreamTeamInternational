"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import {
  MASCOT_DELIVERABLE_OPTIONS,
  MASCOT_STYLE_OPTIONS,
  MASCOT_TYPE_OPTIONS,
  MASCOT_USAGE_OPTIONS,
  toggleInArray,
} from "@/lib/quote-form/constants";
import { BriefStep, type BriefStepProps } from "./brief-step";
import { OptionGroup } from "./option-group";
import { StepHeading, type QuoteStepProps } from "./shared";
import { TimingStep } from "./timing-step";

/** Brand mascot, step 1: 2D / 3D, style, where it will live. */
export function MascotStyleStep({ data, update }: QuoteStepProps) {
  const { t } = useLanguage();
  const m = t.quoteForm.mascot;
  return (
    <div>
      <StepHeading title={m.styleTitle} />
      <div className="space-y-8">
        <OptionGroup
          required
          label={m.typeLabel}
          options={MASCOT_TYPE_OPTIONS}
          labelOf={(k) => m.types[k].label}
          hintOf={(k) => m.types[k].hint}
          selected={data.mascotType}
          onSelect={(k) => update("mascotType", k)}
          columns={3}
        />
        <OptionGroup
          required
          label={m.styleLabel}
          options={MASCOT_STYLE_OPTIONS}
          labelOf={(k) => m.styles[k]}
          selected={data.mascotStyle}
          onSelect={(k) => update("mascotStyle", k)}
          columns={4}
        />
        <OptionGroup
          multi
          label={m.usageLabel}
          options={MASCOT_USAGE_OPTIONS}
          labelOf={(k) => m.usages[k]}
          selected={data.mascotUsage}
          onSelect={(k) => update("mascotUsage", (prev) => toggleInArray(prev, k))}
          columns={4}
        />
      </div>
    </div>
  );
}

/** Brand mascot, step 2: the character brief + brand assets. */
export function MascotBriefStep(props: Omit<BriefStepProps, "labels">) {
  const { t } = useLanguage();
  const m = t.quoteForm.mascot;
  return (
    <BriefStep
      {...props}
      labels={{
        title: m.briefTitle,
        briefLabel: m.briefLabel,
        briefPh: m.briefPh,
        uploadLabel: m.uploadLabel,
        uploadHint: m.uploadHint,
        linksLabel: m.linksLabel,
        linksPh: m.linksPh,
      }}
    />
  );
}

/** Brand mascot, step 3: deliverables + deadline. */
export function MascotTimingStep({ data, update }: QuoteStepProps) {
  const { t } = useLanguage();
  const m = t.quoteForm.mascot;
  return (
    <TimingStep
      data={data}
      update={update}
      title={m.timingTitle}
      deadlineLabel={m.deadlineLabel}
      aside={
        <OptionGroup
          multi
          label={m.deliverablesLabel}
          options={MASCOT_DELIVERABLE_OPTIONS}
          labelOf={(k) => m.deliverables[k]}
          selected={data.mascotDeliverables}
          onSelect={(k) => update("mascotDeliverables", (prev) => toggleInArray(prev, k))}
          columns={2}
        />
      }
    />
  );
}
