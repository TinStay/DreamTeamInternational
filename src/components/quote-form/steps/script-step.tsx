"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { SCRIPT_OPTIONS } from "@/lib/quote-form/constants";
import { OptionCard } from "@/components/quote-form/option-card";
import { FileUploadField } from "@/components/quote-form/file-upload";
import { QUOTE_FIELD_CLASS, RevealOnEnter, GroupLabel, StepHeading, type QuoteStepProps } from "./shared";

export type ScriptStepProps = QuoteStepProps & {
  scriptFiles: File[];
  onScriptFiles: (files: File[]) => void;
  /** Bytes used by the reference uploads (shared budget). */
  otherBytes: number;
};

export function ScriptStep({
  data,
  update,
  scriptFiles,
  onScriptFiles,
  otherBytes,
}: ScriptStepProps) {
  const { t } = useLanguage();
  const s = t.quoteForm.script;
  const showDetails = data.script === "ready";

  return (
    <div>
      <StepHeading title={s.title} />

      <div role="radiogroup" aria-label={s.title} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SCRIPT_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.key}
            icon={opt.icon}
            label={s.options[opt.key].label}
            hint={s.options[opt.key].hint}
            selected={data.script === opt.key}
            onSelect={() => {
              update("script", opt.key);
              // "No script" hides the details — clear them so stale text/files
              // aren't submitted or silently counted against the upload budget.
              if (opt.key === "none") {
                update("scriptText", "");
                onScriptFiles([]);
              }
            }}
          />
        ))}
      </div>

      {showDetails ? (
        <RevealOnEnter>
          <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2">
            <div>
              <Label htmlFor="quote-script-text" className="mb-2.5 font-semibold">
                {s.textLabel}
              </Label>
              <Textarea
                id="quote-script-text"
                value={data.scriptText}
                onChange={(e) => update("scriptText", e.target.value)}
                placeholder={s.textPh}
                className={cn("min-h-[140px]", QUOTE_FIELD_CLASS)}
                maxLength={5000}
              />
            </div>
            <div>
              <GroupLabel>{s.uploadLabel}</GroupLabel>
              <FileUploadField
                id="quote-script-upload"
                files={scriptFiles}
                onChange={onScriptFiles}
                otherBytes={otherBytes}
              />
            </div>
          </div>
        </RevealOnEnter>
      ) : null}
    </div>
  );
}
