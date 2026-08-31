"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  FORMAT_OPTIONS,
  LENGTH_TICKS,
  VOICEOVER_OPTIONS,
  formatLengthSec,
  toggleInArray,
  type FormatOptionKey,
} from "@/lib/quote-form/constants";
import { cn } from "@/lib/utils";
import { OptionCard } from "@/components/quote-form/option-card";
import { FileUploadField } from "@/components/quote-form/file-upload";
import { QUOTE_FIELD_CLASS, GroupLabel, StepHeading, type QuoteStepProps } from "./shared";

export type VideoStepProps = QuoteStepProps & {
  refFiles: File[];
  onRefFiles: (files: File[]) => void;
  /** Bytes used by the script uploads (shared budget). */
  otherBytes: number;
};

/** Duration + materials on the left, aspect ratio + voice-over + example links on the right. */
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

  // Updater form (not `data.formats`) — see `QuoteFieldUpdater`.
  function toggleFormat(key: FormatOptionKey) {
    update("formats", (prev) => toggleInArray(prev, key));
  }

  // The slider moves over tick indices (5s steps below 1 min, 10s above).
  const tickIndex = Math.max(0, LENGTH_TICKS.indexOf(data.lengthSec));

  return (
    <div>
      <StepHeading title={v.specsTitle} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[4fr_6fr]">
        {/* Left column: duration on top, then video materials. */}
        <div>
          <div className="rounded-2xl border border-border/50 bg-card-elevated p-4 sm:p-5">
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
              value={tickIndex}
              onValueChange={(value) => {
                const idx = Array.isArray(value) ? value[0] : value;
                update("lengthSec", LENGTH_TICKS[idx] ?? LENGTH_TICKS[0]);
              }}
              min={0}
              max={LENGTH_TICKS.length - 1}
              step={1}
              disabled={data.lengthFlexible}
              aria-label={v.lengthLabel}
            />
            <Label className="mt-3 cursor-pointer items-start gap-2.5 text-sm font-normal text-muted-foreground">
              <Checkbox
                checked={data.lengthFlexible}
                onCheckedChange={(checked) => update("lengthFlexible", Boolean(checked))}
                className="mt-0.5 cursor-pointer"
              />
              {v.lengthFlexibleLabel}
            </Label>
          </div>

          <div className="mt-6">
            <GroupLabel hint={s.refsUploadHint}>{s.refsUploadLabel}</GroupLabel>
            <FileUploadField
              id="quote-ref-upload"
              files={refFiles}
              onChange={onRefFiles}
              otherBytes={otherBytes}
            />
          </div>
        </div>

        {/* Right column: aspect ratio, voice-over, then example links. */}
        <div>
          <GroupLabel required>{v.formatLabel}</GroupLabel>
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

          <div className="mt-6">
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

          </div>

          <div className="mt-6">
            <Label htmlFor="quote-ref-links" className="mb-2.5 font-semibold">
              {s.refsLabel}
            </Label>
            <Input
              id="quote-ref-links"
              value={data.refLinks}
              onChange={(e) => update("refLinks", e.target.value)}
              placeholder={s.refsPh}
              className={cn("h-9", QUOTE_FIELD_CLASS)}
              maxLength={2000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
