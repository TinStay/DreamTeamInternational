"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconSend,
} from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { termsPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

function SendResultCard({
  variant,
  title,
  description,
}: {
  variant: "success" | "error";
  title: string;
  description: string;
}) {
  const isOk = variant === "success";
  return (
    <output
      aria-live="polite"
      className={cn(
        "mt-5 flex gap-4 overflow-hidden rounded-2xl border p-4 text-left shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 sm:p-5",
        isOk
          ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-background to-background dark:from-emerald-500/15"
          : "border-destructive/25 bg-gradient-to-br from-destructive/10 via-background to-background dark:from-destructive/15"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
          isOk
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        )}
      >
        {isOk ? (
          <IconCircleCheck className="h-5 w-5" stroke={2.25} />
        ) : (
          <IconAlertTriangle className="h-5 w-5" stroke={2.25} />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            "font-heading text-base font-semibold tracking-tight",
            isOk ? "text-emerald-900 dark:text-emerald-100" : "text-destructive"
          )}
        >
          {title}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </output>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Label className="inline-flex items-baseline gap-0.5 text-foreground">
      <span>{children}</span>
      {required ? (
        <span
          className="text-xs font-semibold leading-none text-section-accent"
          aria-hidden
        >
          *
        </span>
      ) : null}
    </Label>
  );
}

export type ContactInquiryFormProps = {
  className?: string;
  /** Included in the contact API subject line when set */
  subject?: string;
  /** Internal moderator-only label (Bulgarian). */
  formStateBg?: string;
  /** When true, shows training-specific fields. */
  showTrainingTarget?: boolean;
  /** Training-specific details (optional). */
  trainingTarget?: string;
  trainingWhy?: string;
  /** `card`: section-style shell; `plain`: fields only (e.g. training modal) */
  variant?: "card" | "plain";
  /** Optional title / copy above the fields */
  heading?: React.ReactNode;
};

export function ContactInquiryForm({
  className,
  subject,
  formStateBg,
  showTrainingTarget = false,
  trainingTarget,
  trainingWhy,
  variant = "card",
  heading,
}: ContactInquiryFormProps) {
  const { t, language } = useLanguage();
  const [foundUs, setFoundUs] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  // Honeypot: hidden from users; only bots fill it. Server rejects when set.
  const [website, setWebsite] = useState<string>("");
  const [trainingTargetValue, setTrainingTargetValue] = useState<string>(trainingTarget ?? "");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | "ok" | "error">(null);

  const termsHref = termsPath(language);
  const foundUsOptions = useMemo(() => {
    const opts = t.contact.foundUsOptions;
    return [
      { value: "google", label: opts.google },
      { value: "social", label: opts.social },
      { value: "instagram", label: opts.instagram },
      { value: "tiktok", label: opts.tiktok },
      { value: "youtube", label: opts.youtube },
      { value: "referral", label: opts.referral },
      { value: "event", label: opts.event },
      { value: "other", label: opts.other },
    ];
  }, [t.contact.foundUsOptions]);

  const selectedFoundUsLabel =
    foundUsOptions.find((o) => o.value === foundUs)?.label ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAccepted || isSending) return;
    if (!message.trim() || !name.trim() || !email.trim()) return;
    if (showTrainingTarget && !trainingTargetValue.trim()) return;

    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phoneNumber,
          foundUs,
          message,
          website,
          subject: subject?.trim() || undefined,
          formStateBg: formStateBg?.trim() || undefined,
          trainingTarget: (showTrainingTarget ? trainingTargetValue : trainingTarget)?.trim() || undefined,
          trainingWhy: trainingWhy?.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setSendResult("ok");
      setMessage("");
      setFoundUs("");
      setPhoneNumber("");
      setName("");
      setEmail("");
      setTrainingTargetValue(trainingTarget ?? "");
      setTermsAccepted(false);
    } catch {
      setSendResult("error");
    } finally {
      setIsSending(false);
    }
  }

  const fieldShell =
    "h-9 text-sm bg-background/40 border-border/40 transition-colors focus:border-primary/50";
  const textareaShell =
    "min-h-[100px] text-sm bg-background/40 border-border/40 transition-colors focus:border-primary/50 md:min-h-[120px]";

  const inner = (
    <form className={cn("space-y-3.5", variant === "plain" && "space-y-3")} onSubmit={handleSubmit}>
      {/* Honeypot: hidden from users, catches bots that fill every field. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor="contact-website">Company website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {heading ? (
        <div className="mb-1 border-b border-border/25 pb-4 text-left">{heading}</div>
      ) : null}

      {showTrainingTarget ? (
        <div className="space-y-2">
          <FieldLabel required>{t.training.inquiryForm.targetLabel}</FieldLabel>
          <Input
            value={trainingTargetValue}
            onChange={(e) => setTrainingTargetValue(e.target.value)}
            placeholder={t.training.inquiryForm.targetPlaceholder}
            required
            className={fieldShell}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <FieldLabel required>{t.contact.message}</FieldLabel>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.contact.messagePh}
          required
          className={textareaShell}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-2">
          <FieldLabel required>{t.contact.name}</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.contact.name}
            required
            autoComplete="name"
            className={fieldShell}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>{t.contact.phoneLbl}</FieldLabel>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            autoComplete="tel"
            className={fieldShell}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-2">
          <FieldLabel required>{t.contact.emailLbl}</FieldLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.contact.emailLbl}
            required
            autoComplete="email"
            className={fieldShell}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>{t.contact.foundUs}</FieldLabel>
          <Select value={foundUs} onValueChange={(v) => setFoundUs(v ?? "")}>
            <SelectTrigger className={cn("h-9 w-full px-2.5 text-sm", fieldShell)}>
              <SelectValue
                placeholder={
                  t.contact.foundUsPh.trim() === "" ? undefined : t.contact.foundUsPh
                }
              >
                {foundUs !== "" ? selectedFoundUsLabel : null}
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

      <div className="flex items-start gap-3 pt-1">
        <Checkbox
          checked={termsAccepted}
          onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
          className="mt-0.5"
        />
        <div className="text-sm leading-relaxed text-muted-foreground">
          <span>{t.contact.terms.prefix} </span>
          <Link
            href={termsHref}
            className="text-section-accent underline-offset-4 hover:underline"
          >
            {t.contact.terms.link}
          </Link>
          <span>{t.contact.terms.suffix}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!termsAccepted || isSending}
        className="mt-2 h-10 w-full rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
      >
        {isSending ? t.contact.sending : t.contact.send}{" "}
        <IconSend className="ml-2 h-4 w-4" fill="currentColor" stroke="none" />
      </Button>

      {sendResult === "ok" && (
        <SendResultCard
          variant="success"
          title={t.contact.sendSuccessTitle}
          description={t.contact.sendSuccessBody}
        />
      )}
      {sendResult === "error" && (
        <SendResultCard
          variant="error"
          title={t.contact.sendErrorTitle}
          description={t.contact.sendErrorBody}
        />
      )}
    </form>
  );

  if (variant === "plain") {
    return <div className={cn("min-w-0", className)}>{inner}</div>;
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/30 bg-card p-6 text-card-foreground shadow-elevated-soft animate-in fade-in slide-in-from-left-12 duration-1000 sm:p-8",
        className
      )}
    >
      {inner}
    </div>
  );
}
