"use client";

import { motion } from "motion/react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  FORMAT_OPTIONS,
  LENGTH_SLIDER,
  VOICEOVER_OPTIONS,
  formatLengthSec,
  type FormatOptionKey,
} from "@/lib/quote-form/constants";
import { cn } from "@/lib/utils";
import { OptionCard } from "@/components/quote-form/option-card";
import { FileUploadField } from "@/components/quote-form/file-upload";
import { GroupLabel, StepHeading, type QuoteStepProps } from "./shared";

export type VideoStepProps = QuoteStepProps & {
  refFiles: File[];
  onRefFiles: (files: File[]) => void;
  /** Bytes used by the script uploads (shared budget). */
  otherBytes: number;
};

/** Duration + aspect ratio + voice-over, with the style references at the bottom. */
export function VideoStep({
  data,
  update,
  refFiles,
  onRefFiles,
  otherBytes,
}: VideoStepProps) {
  const { t } = useLanguage();
  const v = t.quoteForm.video;
  const s = t.quoteForm.style;

  function toggleFormat(key: FormatOptionKey) {
    update(
      "formats",
      data.formats.includes(key)
        ? data.formats.filter((f) => f !== key)
        : [...data.formats, key]
    );
  }

  return (
    <div>
      <StepHeading title={v.specsTitle} />

      {/* Two aligned columns: format + duration on the left, voice-over on the right. */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <div>
          <GroupLabel required hint={v.formatHint}>
            {v.formatLabel}
          </GroupLabel>
          <div
            role="group"
            aria-label={v.formatLabel}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                multi
                compact
                icon={opt.icon}
                label={v.formats[opt.key].label}
                hint={v.formats[opt.key].hint}
                selected={data.formats.includes(opt.key)}
                onSelect={() => toggleFormat(opt.key)}
              />
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-border/50 bg-card/60 p-4 sm:p-5">
            <GroupLabel className="mb-1">{v.lengthLabel}</GroupLabel>
            <p
              className={cn(
                "font-heading text-2xl font-bold transition-opacity",
                data.lengthFlexible ? "opacity-40" : "text-section-accent"
              )}
              aria-live="polite"
            >
              {formatLengthSec(data.lengthSec, v)}
            </p>
            <Slider
              value={data.lengthSec}
              onValueChange={(value) =>
                update("lengthSec", Array.isArray(value) ? value[0] : value)
              }
              min={LENGTH_SLIDER.min}
              max={LENGTH_SLIDER.max}
              step={LENGTH_SLIDER.step}
              disabled={data.lengthFlexible}
              aria-label={v.lengthLabel}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {LENGTH_SLIDER.min} {v.seconds}
              </span>
              <span>{v.lengthMax}</span>
            </div>
            <Label className="mt-4 cursor-pointer items-start gap-2.5 text-sm font-normal text-muted-foreground">
              <Checkbox
                checked={data.lengthFlexible}
                onCheckedChange={(checked) => update("lengthFlexible", Boolean(checked))}
                className="mt-0.5 cursor-pointer"
              />
              {v.lengthFlexibleLabel}
            </Label>
          </div>
        </div>

        <div>
          <GroupLabel required>{s.voiceLabel}</GroupLabel>
          {/* Two options, always on one row. */}
          <div
            role="radiogroup"
            aria-label={s.voiceLabel}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {VOICEOVER_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                compact
                icon={opt.icon}
                label={s.voices[opt.key]}
                selected={data.voiceover === opt.key}
                onSelect={() => update("voiceover", opt.key)}
              />
            ))}
          </div>

          {/* Enter-only reveal — exit-gated unmounts hang with current motion/React. */}
          {data.voiceover === "yes" ? (
            <motion.div
              key="voice-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="pt-4">
                <Label htmlFor="quote-voice-details" className="mb-2.5 font-semibold">
                  {s.voiceDetailsLabel}
                </Label>
                <Input
                  id="quote-voice-details"
                  value={data.voiceDetails}
                  onChange={(e) => update("voiceDetails", e.target.value)}
                  placeholder={s.voiceDetailsPh}
                  className="h-9 bg-background/40"
                  maxLength={300}
                />
              </div>
            </motion.div>
          ) : null}

          {/* Example / reference videos, right under the voice-over choice. */}
          <div className="mt-6">
            <Label htmlFor="quote-ref-links" className="mb-3 font-semibold">
              {s.refsLabel}
            </Label>
            <Textarea
              id="quote-ref-links"
              value={data.refLinks}
              onChange={(e) => update("refLinks", e.target.value)}
              placeholder={s.refsPh}
              className="min-h-[100px] bg-background/40"
              maxLength={2000}
            />
          </div>

          <div className="mt-6">
            <GroupLabel className="mb-3">{s.refsUploadLabel}</GroupLabel>
            <FileUploadField
              id="quote-ref-upload"
              files={refFiles}
              onChange={onRefFiles}
              otherBytes={otherBytes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
