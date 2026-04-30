"use client";

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
  IconMail,
  IconMapPin,
  IconPhone,
  IconSend,
} from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
        "mt-5 flex gap-4 overflow-hidden rounded-2xl border p-4 sm:p-5 text-left shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500",
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

function SocialIcon({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={256}
      height={256}
      className="h-12 w-12 opacity-90 transition-all group-hover:opacity-100"
    />
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
    <Label className="text-foreground inline-flex items-baseline gap-0.5">
      <span>{children}</span>
      {required ? (
        <span className="text-section-accent text-xs font-semibold leading-none" aria-hidden>
          *
        </span>
      ) : null}
    </Label>
  );
}

export function ContactSection() {
  const { t, language } = useLanguage();
  const [foundUs, setFoundUs] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | "ok" | "error">(null);

  const termsHref = language === "bg" ? "/bg/terms" : "/en/terms";
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
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setSendResult("ok");
      setMessage("");
      setFoundUs("");
      setPhoneNumber("");
      setName("");
      setEmail("");
      setTermsAccepted(false);
    } catch {
      setSendResult("error");
    } finally {
      setIsSending(false);
    }
  }

  const addressText =
    "ул. Николай Коперник № 27-29, ет. 2, офис 17, кв. Гео Милев, София, България";

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(addressText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = addressText;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 z-10 relative">
        <div className="mb-10 lg:mb-12">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6 text-foreground">
            {t.contact.title1}{" "}
            <span className="text-section-accent">{t.contact.title2}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid gap-12 lg:gap-16 items-start lg:grid-cols-[minmax(0,60%)_minmax(0,40%)]">
          {/* Column 1: Form */}
          <div className="rounded-3xl p-8 border border-border/30 animate-in slide-in-from-left-12 fade-in duration-1000 bg-card text-card-foreground shadow-elevated-soft">            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <FieldLabel required>{t.contact.message}</FieldLabel>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.contact.messagePh}
                  required
                  className="min-h-[120px] text-sm bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-2">
                  <FieldLabel required>{t.contact.name}</FieldLabel>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.contact.name}
                    required
                    autoComplete="name"
                    className="h-9 text-sm bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>{t.contact.phoneLbl}</FieldLabel>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoComplete="tel"
                    className="h-9 text-sm bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required>{t.contact.emailLbl}</FieldLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.contact.emailLbl}
                    required
                    autoComplete="email"
                    className="h-9 text-sm bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>{t.contact.foundUs}</FieldLabel>
                  <Select value={foundUs} onValueChange={(v) => setFoundUs(v ?? "")}>
                    <SelectTrigger className="w-full h-9 px-2.5 text-sm bg-background/40 border-border/40 focus:border-primary/50 transition-colors">
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

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                  className="mt-0.5"
                />
                <div className="text-sm text-muted-foreground leading-relaxed">
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
                className="w-full rounded-full font-bold h-10 text-sm mt-4 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:hover:scale-100"
              >
                {isSending ? t.contact.sending : t.contact.send}{" "}
                <IconSend className="ml-2 h-4 w-4" stroke={2.25} />
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
          </div>

          {/* Column 2: Contact info */}
          <div className="animate-in slide-in-from-right-12 fade-in duration-1000 delay-200">
            <div className="space-y-6 mb-10">
              {/* Email */}
              <a href="mailto:info@dreamteam.technology" className="flex items-center gap-4 group cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
                  <IconMail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.email}</div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">info@dreamteam.technology</div>
                </div>
              </a>

              {/* Phone 1 */}
              <a href="tel:+359878757930" className="flex items-center gap-4 group cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
                  <IconPhone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">+359 87 875 7930</div>
                </div>
              </a>

              {/* Phone 2 */}
              <a href="tel:+359882367100" className="flex items-center gap-4 group cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
                  <IconPhone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">+359 88 236 7100</div>
                </div>
              </a>

              {/* Address */}
              <button
                type="button"
                onClick={copyAddress}
                className="flex w-full items-start gap-4 text-left cursor-pointer"
                aria-label="Copy address"
                title="Copy address"
              >
                <div className="mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5 transition-transform hover:scale-[1.04] active:scale-[0.98]">
                  <IconMapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground mb-1">{t.contact.address}</div>
                  <div className="font-semibold text-foreground leading-relaxed">
                    ул. Николай Коперник № 27-29, ет. 2, офис 17<br />
                    кв. Гео Милев, София, България
                  </div>
                </div>
              </button>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-5">
              <a
                href="https://www.facebook.com/profile.php?id=61585919836260"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center transition-transform hover:scale-110"
              >
                <SocialIcon src="/social_media_icons/facebook.png" alt="Facebook" />
              </a>
              <a
                href="https://www.instagram.com/dreamteam.video.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center transition-transform hover:scale-110"
              >
                <SocialIcon src="/social_media_icons/instagram.png" alt="Instagram" />
              </a>
              <a
                href="https://www.linkedin.com/company/109344952"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center transition-transform hover:scale-110"
              >
                <SocialIcon src="/social_media_icons/linkedin.png" alt="LinkedIn" />
              </a>
              <a
                href="https://www.youtube.com/@DreamTeamVideo"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center transition-transform hover:scale-110"
              >
                <SocialIcon src="/social_media_icons/youtube.png" alt="YouTube" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
