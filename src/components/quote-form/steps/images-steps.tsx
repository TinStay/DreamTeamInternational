"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import {
  IMAGE_COUNT_OPTIONS,
  IMAGE_RATIO_OPTIONS,
  IMAGE_RESOLUTION_OPTIONS,
  IMAGE_USAGE_OPTIONS,
  toggleInArray,
} from "@/lib/quote-form/constants";
import { BriefStep, type BriefStepProps } from "./brief-step";
import { OptionGroup } from "./option-group";
import { StepHeading, type QuoteStepProps } from "./shared";
import { TimingStep } from "./timing-step";

/** AI images, step 1: how many, which resolution, which aspect ratios. */
export function ImagesSpecsStep({ data, update }: QuoteStepProps) {
  const { t } = useLanguage();
  const im = t.quoteForm.images;
  return (
    <div>
      <StepHeading title={im.specsTitle} />
      <div className="space-y-8">
        <OptionGroup
          required
          label={im.countLabel}
          options={IMAGE_COUNT_OPTIONS}
          labelOf={(k) => im.counts[k]}
          selected={data.imageCount}
          onSelect={(k) => update("imageCount", k)}
          columns={4}
        />
        <OptionGroup
          required
          label={im.resolutionLabel}
          options={IMAGE_RESOLUTION_OPTIONS}
          labelOf={(k) => im.resolutions[k]}
          selected={data.imageResolution}
          onSelect={(k) => update("imageResolution", k)}
          columns={3}
        />
        <OptionGroup
          required
          multi
          label={im.ratioLabel}
          hint={im.ratioHint}
          options={IMAGE_RATIO_OPTIONS}
          labelOf={(k) => im.ratios[k].label}
          hintOf={(k) => im.ratios[k].hint}
          selected={data.imageRatios}
          onSelect={(k) => update("imageRatios", (prev) => toggleInArray(prev, k))}
          columns={3}
        />
      </div>
    </div>
  );
}

/** AI images, step 2: the brief + product / example images. */
export function ImagesBriefStep(props: Omit<BriefStepProps, "labels">) {
  const { t } = useLanguage();
  const im = t.quoteForm.images;
  return (
    <BriefStep
      {...props}
      labels={{
        title: im.briefTitle,
        briefLabel: im.briefLabel,
        briefPh: im.briefPh,
        uploadLabel: im.uploadLabel,
        uploadHint: im.uploadHint,
        linksLabel: im.linksLabel,
        linksPh: im.linksPh,
      }}
    />
  );
}

/** AI images, step 3: where they will be used + deadline. */
export function ImagesTimingStep({ data, update }: QuoteStepProps) {
  const { t } = useLanguage();
  const im = t.quoteForm.images;
  return (
    <TimingStep
      data={data}
      update={update}
      title={im.timingTitle}
      deadlineLabel={im.deadlineLabel}
      aside={
        <OptionGroup
          multi
          label={im.usageLabel}
          options={IMAGE_USAGE_OPTIONS}
          labelOf={(k) => im.usages[k]}
          selected={data.imageUsage}
          onSelect={(k) => update("imageUsage", (prev) => toggleInArray(prev, k))}
          columns={2}
        />
      }
    />
  );
}
