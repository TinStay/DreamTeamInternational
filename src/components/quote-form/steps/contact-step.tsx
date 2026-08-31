"use client";

import { useMemo } from "react";
import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { FOUND_US_KEYS } from "@/lib/found-us";
import { termsPath } from "@/lib/routes";
import { QUOTE_FIELD_CLASS, RequiredMark, StepHeading, type QuoteStepProps } from "./shared";

export function ContactStep({ data, update }: QuoteStepProps) {
  const { t, language } = useLanguage();
  const c = t.quoteForm.contactStep;

  // Single source of truth for the catalogue — labels come from the dictionary.
  const foundUsOptions = useMemo(
    () => FOUND_US_KEYS.map((value) => ({ value, label: t.contact.foundUsOptions[value] })),
    [t.contact.foundUsOptions]
  );

  const selectedFoundUsLabel =
    foundUsOptions.find((o) => o.value === data.foundUs)?.label ?? "";

  return (
    <div>
      <StepHeading title={c.title} subtitle={c.subtitle} />

      {/* Row 1: name / email / phone. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="quote-name" className="mb-2.5 gap-0.5 font-semibold">
            {t.contact.name} <RequiredMark />
          </Label>
          <Input
            id="quote-name"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder={t.contact.name}
            autoComplete="name"
            required
            className={cn("h-9", QUOTE_FIELD_CLASS)}
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="quote-email" className="mb-2.5 gap-0.5 font-semibold">
            {t.contact.emailLbl} <RequiredMark />
          </Label>
          <Input
            id="quote-email"
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder={t.contact.emailLbl}
            autoComplete="email"
            required
            className={cn("h-9", QUOTE_FIELD_CLASS)}
            maxLength={320}
          />
        </div>

        <div>
          <Label htmlFor="quote-phone" className="mb-2.5 font-semibold">
            {t.contact.phoneLbl}
          </Label>
          <Input
            id="quote-phone"
            type="tel"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
            className={cn("h-9", QUOTE_FIELD_CLASS)}
            maxLength={60}
          />
        </div>
      </div>

      {/* Row 2: company / how did you find us. */}
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="quote-company" className="mb-2.5 font-semibold">
            {c.company}
          </Label>
          <Input
            id="quote-company"
            value={data.company}
            onChange={(e) => update("company", e.target.value)}
            autoComplete="organization"
            className={cn("h-9", QUOTE_FIELD_CLASS)}
            maxLength={200}
          />
        </div>

        <div>
          <Label className="mb-2.5 font-semibold">{t.contact.foundUs}</Label>
          <Select
            value={data.foundUs}
            onValueChange={(value) => update("foundUs", value ?? "")}
          >
            <SelectTrigger size="lg" className={cn("w-full text-sm", QUOTE_FIELD_CLASS)}>
              <SelectValue>
                {data.foundUs !== "" ? selectedFoundUsLabel : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {foundUsOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="py-1.5 text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <Checkbox
          checked={data.termsAccepted}
          onCheckedChange={(checked) => update("termsAccepted", Boolean(checked))}
          // The terms copy is a sibling (it contains a link), so name the box explicitly.
          aria-label={t.contact.terms.link}
          className="mt-0.5 cursor-pointer"
        />
        <div className="text-sm leading-relaxed text-muted-foreground">
          <span>{t.contact.terms.prefix} </span>
          <Link
            href={termsPath(language)}
            className="text-section-accent underline-offset-4 hover:underline"
          >
            {t.contact.terms.link}
          </Link>
          <span>{t.contact.terms.suffix}</span>
        </div>
      </div>
    </div>
  );
}
