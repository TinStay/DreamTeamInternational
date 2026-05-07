"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { GradientMailIcon, GradientMapPinIcon, GradientPhoneIcon } from "@/components/ui/gradient-icons";

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

const contactInfoIconCircle =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/40 dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] dark:ring-white/10";

export function ContactSection({ className }: { className?: string }) {
  const { t } = useLanguage();

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
    <section
      id="contact"
      className={cn(
        "relative overflow-hidden pt-10 pb-20 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-28",
        className
      )}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="mb-10 lg:mb-12">
          <h2 className="mb-6 font-heading text-4xl font-bold text-foreground md:text-5xl">
            {t.contact.title1}{" "}
            <span className="text-section-accent">{t.contact.title2}</span>
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">{t.contact.subtitle}</p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,60%)_minmax(0,40%)] lg:gap-16">
          <ContactInquiryForm variant="card" />

          <div className="animate-in fade-in slide-in-from-right-12 duration-1000 delay-200">
            <div className="mb-10 space-y-6">
              <a
                href="mailto:info@dreamteam.technology"
                className="group flex cursor-pointer items-center gap-4"
              >
                <div className={contactInfoIconCircle}>
                  <GradientMailIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.email}</div>
                  <div className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    info@dreamteam.technology
                  </div>
                </div>
              </a>

              <a
                href="tel:+359878757930"
                className="group flex cursor-pointer items-center gap-4"
              >
                <div className={contactInfoIconCircle}>
                  <GradientPhoneIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    +359 87 875 7930
                  </div>
                </div>
              </a>

              <a
                href="tel:+359882367100"
                className="group flex cursor-pointer items-center gap-4"
              >
                <div className={contactInfoIconCircle}>
                  <GradientPhoneIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    +359 88 236 7100
                  </div>
                </div>
              </a>

              <button
                type="button"
                onClick={copyAddress}
                className="flex w-full cursor-pointer items-start gap-4 text-left"
                aria-label="Copy address"
                title="Copy address"
              >
                <div
                  className={cn(
                    contactInfoIconCircle,
                    "mt-0.5 transition-transform hover:scale-[1.04] active:scale-[0.98]"
                  )}
                >
                  <GradientMapPinIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-sm text-muted-foreground">{t.contact.address}</div>
                  <div className="font-semibold leading-relaxed text-foreground">
                    ул. Николай Коперник № 27-29, ет. 2, офис 17<br />
                    кв. Гео Милев, София, България
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-10">
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
