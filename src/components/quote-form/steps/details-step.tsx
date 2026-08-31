"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MiniCalendar } from "@/components/ui/mini-calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { PLATFORM_OPTIONS, type PlatformOptionKey, toggleInArray } from "@/lib/quote-form/constants";
import { OptionCard } from "@/components/quote-form/option-card";
import { QUOTE_FIELD_CLASS, GroupLabel, StepHeading, type QuoteStepProps } from "./shared";

export function DetailsStep({ data, update }: QuoteStepProps) {
  const { t, language } = useLanguage();
  const d = t.quoteForm.details;

  // Updater form (not `data.platforms`) — see `QuoteFieldUpdater`.
  function togglePlatform(key: PlatformOptionKey) {
    update("platforms", (prev) => toggleInArray(prev, key));
  }

  return (
    <div>
      <StepHeading title={d.title} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[4fr_6fr]">
        {/* Left column: deadline on top, notes below. */}
        <div>
          <GroupLabel>{d.deadlineLabel}</GroupLabel>
          <MiniCalendar
            value={data.deadline}
            onChange={(next) => update("deadline", next)}
            locale={language}
            prevLabel={d.prevWeek}
            nextLabel={d.nextWeek}
            className={cn(
              "transition-opacity",
              data.deadlineFlexible && "pointer-events-none opacity-50"
            )}
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
            {d.noDeadline}
          </Label>

          <div className="mt-6">
            <Label htmlFor="quote-notes" className="mb-2.5 font-semibold">
              {d.notesLabel}
            </Label>
            <Textarea
              id="quote-notes"
              rows={2}
              value={data.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={d.notesPh}
              className={cn("min-h-0", QUOTE_FIELD_CLASS)}
              maxLength={3000}
            />
          </div>
        </div>

        {/* Right column: publishing platforms in two columns. */}
        <div>
          <GroupLabel>{d.platformsLabel}</GroupLabel>
          <div
            role="group"
            aria-label={d.platformsLabel}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                multi
                compact
                icon={opt.icon}
                label={d.platforms[opt.key]}
                selected={data.platforms.includes(opt.key)}
                onSelect={() => togglePlatform(opt.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
