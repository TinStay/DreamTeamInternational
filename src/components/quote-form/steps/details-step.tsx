"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MiniCalendar } from "@/components/ui/mini-calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n/language-context";
import { PLATFORM_OPTIONS, type PlatformOptionKey } from "@/lib/quote-form/constants";
import { OptionCard } from "@/components/quote-form/option-card";
import { GroupLabel, StepHeading, type QuoteStepProps } from "./shared";

export function DetailsStep({ data, update }: QuoteStepProps) {
  const { t, language } = useLanguage();
  const d = t.quoteForm.details;

  function togglePlatform(key: PlatformOptionKey) {
    update(
      "platforms",
      data.platforms.includes(key)
        ? data.platforms.filter((p) => p !== key)
        : [...data.platforms, key]
    );
  }

  return (
    <div>
      <StepHeading title={d.title} />

      <GroupLabel hint={d.platformsHint}>{d.platformsLabel}</GroupLabel>
      <div
        role="group"
        aria-label={d.platformsLabel}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PLATFORM_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.key}
            multi
            icon={opt.icon}
            label={d.platforms[opt.key]}
            selected={data.platforms.includes(opt.key)}
            onSelect={() => togglePlatform(opt.key)}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <GroupLabel className="mb-3">{d.deadlineLabel}</GroupLabel>
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
        </div>

        <div>
          <Label htmlFor="quote-notes" className="mb-2.5 font-semibold">
            {d.notesLabel}
          </Label>
          <Textarea
            id="quote-notes"
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder={d.notesPh}
            className="min-h-[100px] bg-background/40"
            maxLength={3000}
          />
        </div>
      </div>
    </div>
  );
}
