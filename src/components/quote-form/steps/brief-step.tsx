"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/quote-form/file-upload";
import { cn } from "@/lib/utils";
import { QUOTE_FIELD_CLASS, GroupLabel, RequiredMark, StepHeading, type QuoteStepProps } from "./shared";

export type BriefStepLabels = {
  title: string;
  briefLabel: string;
  briefPh: string;
  uploadLabel: string;
  uploadHint: string;
  linksLabel: string;
  linksPh: string;
};

export type BriefStepProps = QuoteStepProps & {
  labels: BriefStepLabels;
  refFiles: File[];
  onRefFiles: (files: File[]) => void;
  /** Bytes used by the other upload field (shared budget). */
  otherBytes: number;
  /** Rendered above the brief (e.g. the automation "what do you have" group). */
  before?: ReactNode;
};

/**
 * The free-text brief shared by the images / mascot / automation flows:
 * description (required) on the left, materials upload + example links on the
 * right. Copy comes from the calling flow so each service asks in its own words.
 */
export function BriefStep({ data, update, labels, refFiles, onRefFiles, otherBytes, before }: BriefStepProps) {
  return (
    <div>
      <StepHeading title={labels.title} />
      {before ? <div className="mb-8">{before}</div> : null}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <div>
          <Label htmlFor="quote-brief" className="mb-2.5 gap-0.5 font-semibold">
            {labels.briefLabel} <RequiredMark />
          </Label>
          <Textarea
            id="quote-brief"
            value={data.brief}
            onChange={(e) => update("brief", e.target.value)}
            placeholder={labels.briefPh}
            className={cn("min-h-[160px]", QUOTE_FIELD_CLASS)}
            maxLength={5000}
            required
          />
        </div>

        <div>
          <GroupLabel hint={labels.uploadHint}>{labels.uploadLabel}</GroupLabel>
          <FileUploadField id="quote-ref-upload" files={refFiles} onChange={onRefFiles} otherBytes={otherBytes} />

          <div className="mt-6">
            <Label htmlFor="quote-ref-links" className="mb-2.5 font-semibold">
              {labels.linksLabel}
            </Label>
            <Input
              id="quote-ref-links"
              value={data.refLinks}
              onChange={(e) => update("refLinks", e.target.value)}
              placeholder={labels.linksPh}
              className={cn("h-9", QUOTE_FIELD_CLASS)}
              maxLength={2000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
