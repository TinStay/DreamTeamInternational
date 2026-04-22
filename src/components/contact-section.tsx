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
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useMemo, useState } from "react";

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

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
        <span className="text-primary text-xs font-semibold leading-none" aria-hidden>
          *
        </span>
      ) : null}
    </Label>
  );
}

export function ContactSection() {
  const { t, language } = useLanguage();
  const [about, setAbout] = useState<string>("");
  const [foundUs, setFoundUs] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | "ok" | "error">(null);

  const termsHref = language === "bg" ? "/bg/terms" : "/terms";
  const aboutOptions = useMemo(() => {
    const opts = t.contact.aboutOptions;
    return [
      { value: "order_video", label: opts.order_video },
      { value: "question", label: opts.question },
      { value: "collaborate", label: opts.collaborate },
      { value: "partner", label: opts.partner },
      { value: "other", label: opts.other },
    ];
  }, [t.contact.aboutOptions]);

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

  const selectedAboutLabel =
    aboutOptions.find((o) => o.value === about)?.label ?? "";
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
          subject: about,
          foundUs,
          message,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setSendResult("ok");
      setMessage("");
      setAbout("");
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

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 z-10 relative">
        <div className="grid gap-12 lg:gap-16 items-center lg:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
          
          {/* Left Column: Info */}
          <div className="animate-in slide-in-from-left-12 fade-in duration-1000">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6 text-foreground">
              {t.contact.title1} <span className="text-primary">{t.contact.title2}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-md">
              {t.contact.subtitle}
            </p>

            <div className="space-y-6 mb-10">
              {/* Email */}
              <a href="mailto:info@dreamteam.technology" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-background/30">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.email}</div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">info@dreamteam.technology</div>
                </div>
              </a>

              {/* Phone 1 */}
              <a href="tel:+359878757930" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-background/30">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">+359 87 875 7930</div>
                </div>
              </a>

              {/* Phone 2 */}
              <a href="tel:+359882367100" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-background/30">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">+359 88 236 7100</div>
                </div>
              </a>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center text-primary bg-background/30 flex-shrink-0 mt-0.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t.contact.address}</div>
                  <div className="font-semibold text-foreground leading-relaxed">
                    ул. Николай Коперник № 27-29, ет. 2, офис 17<br />
                    кв. Гео Милев, София, България
                  </div>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61585919836260"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/30 border border-border/50 flex items-center justify-center text-foreground hover:text-primary-foreground hover:bg-primary transition-all hover:scale-110"
              >
              <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/dreamteam.video.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/30 border border-border/50 flex items-center justify-center text-foreground hover:text-primary-foreground hover:bg-primary transition-all hover:scale-110"
              >
              <InstagramIcon />
              </a>
              <a
                href="https://www.linkedin.com/company/109344952"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/30 border border-border/50 flex items-center justify-center text-foreground hover:text-primary-foreground hover:bg-primary transition-all hover:scale-110"
              >
              <LinkedInIcon />
              </a>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="rounded-3xl p-8 border border-border/30 animate-in slide-in-from-right-12 fade-in duration-1000 delay-200 bg-card text-card-foreground shadow-elevated-soft">
            <h3 className="text-2xl font-heading font-semibold mb-6 text-foreground">{t.contact.formTitle}</h3>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <FieldLabel>{t.contact.subject}</FieldLabel>
                <Select value={about} onValueChange={(v) => setAbout(v ?? "")}>
                  <SelectTrigger className="w-full h-12 px-3 text-base bg-background/40 border-border/40 focus:border-primary/50 transition-colors">
                    <SelectValue
                      placeholder={
                        t.contact.subjectPh.trim() === "" ? undefined : t.contact.subjectPh
                      }
                    >
                      {about !== "" ? selectedAboutLabel : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {aboutOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="py-2 text-base">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabel required>{t.contact.message}</FieldLabel>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.contact.messagePh}
                  required
                  className="min-h-[140px] text-base bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel required>{t.contact.name}</FieldLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.contact.name}
                  required
                  autoComplete="name"
                  className="h-12 text-base bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel required>{t.contact.emailLbl}</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.contact.emailLbl}
                  required
                  autoComplete="email"
                  className="h-12 text-base bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>{t.contact.phoneLbl}</FieldLabel>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                  className="h-12 text-base bg-background/40 border-border/40 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>{t.contact.foundUs}</FieldLabel>
                <Select value={foundUs} onValueChange={(v) => setFoundUs(v ?? "")}>
                  <SelectTrigger className="w-full h-12 px-3 text-base bg-background/40 border-border/40 focus:border-primary/50 transition-colors">
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
                      <SelectItem key={opt.value} value={opt.value} className="py-2 text-base">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                  className="mt-0.5"
                />
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <span>{t.contact.terms.prefix} </span>
                  <Link href={termsHref} className="text-primary hover:underline underline-offset-4">
                    {t.contact.terms.link}
                  </Link>
                  <span>{t.contact.terms.suffix}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!termsAccepted || isSending}
                className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 mt-4 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:hover:scale-100"
              >
                {isSending ? "Sending..." : t.contact.send}{" "}
                <Send className="ml-2 w-4 h-4" />
              </Button>

              {sendResult === "ok" && (
                <p className="text-sm text-foreground/70">
                  Sent successfully.
                </p>
              )}
              {sendResult === "error" && (
                <p className="text-sm text-destructive">
                  Failed to send. Please try again.
                </p>
              )}
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
