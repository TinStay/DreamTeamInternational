"use client";

import * as React from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "motion/react";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { JourneyItem } from "@/components/ui/scroll-journey";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { ClutchBadge, GoogleReviewsBadge } from "@/components/review-badges";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { GradientMailIcon, GradientMapPinIcon, GradientPhoneIcon } from "@/components/ui/gradient-icons";

const MotionLink = motion.a;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Each contact row / social icon fades up on its own, one after the other.
 * The stagger delay lives on the enter target — a component-level `transition`
 * would also delay the hover/tap gestures by the same amount.
 */
function reveal(index: number) {
  return {
    initial: { opacity: 0, y: 18 },
    whileInView: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, delay: index * 0.11, ease: EASE_OUT },
    },
    viewport: { once: true, amount: 0.4 },
  };
}

/** Snappy, delay-free gesture transitions (see `reveal`). */
const HOVER_TRANSITION = { duration: 0.28, ease: EASE_OUT };
const TAP_TRANSITION = { duration: 0.12, ease: EASE_OUT };

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
      sizes="48px"
      // `shrink-0` + `object-contain`: never let the flex row squash the square.
      className="h-10 w-10 shrink-0 object-contain opacity-90 transition-all group-hover:opacity-100 sm:h-12 sm:w-12"
    />
  );
}

const contactInfoIconCircle =
  "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card shadow-sm ring-1 ring-border/40 dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] dark:ring-white/10";

/** Icon chip that fills with the brand gradient (and turns the glyph white) on row hover. */
function ContactIconChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(contactInfoIconCircle, className)}>
      <span
        aria-hidden
        className="absolute inset-0 bg-primary-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span className="relative flex items-center justify-center">{children}</span>
    </div>
  );
}

const contactIconClass =
  "h-5 w-5 [&_g]:transition-[fill] [&_g]:duration-300 group-hover:[&_g]:fill-white";

export function ContactSection({
  className,
  reviews = false,
  quoteCta = false,
}: {
  className?: string;
  /** The Google rating + the Clutch widget in a row under the social icons (the contact page). */
  reviews?: boolean;
  /** The site's quote pill under the heading's line, down to the service cards + step form (`#quote`; the contact page). */
  quoteCta?: boolean;
}) {
  const { t } = useLanguage();

  const addressText = t.contact.addressVal;

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

  const socials = SOCIAL_LINKS;

  return (
    <section
      id="contact"
      className={cn(
        "relative overflow-hidden pt-10 pb-20 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-28",
        className
      )}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Journey parts (home): heading first, then the form from the left and the details from the right. */}
        <JourneyItem kind="title" className="mb-10 text-center lg:mb-12">
          <h2 className="mb-6 font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl text-foreground">
            {t.contact.title1}{" "}
            <span className="text-section-accent">{t.contact.title2}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t.contact.subtitle}</p>
          {quoteCta ? (
            <ButtonWithIcon href="#quote" surface="auto" className="mx-auto mt-7">
              {t.services.quoteCta}
            </ButtonWithIcon>
          ) : null}
        </JourneyItem>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,60%)_minmax(0,40%)] lg:gap-16">
          <JourneyItem index={0} from="left">
            <ContactInquiryForm variant="card" />
          </JourneyItem>

          <JourneyItem index={1} from="right">
            <div className="mb-10 space-y-6">
              <MotionLink
                href="mailto:info@dreamteam.technology"
                className="group flex origin-left cursor-pointer items-center gap-4"
                whileHover={{ scale: 1.05, transition: HOVER_TRANSITION }}
                whileTap={{ scale: 0.99, transition: TAP_TRANSITION }}
                {...reveal(0)}
              >
                <ContactIconChip>
                  <GradientMailIcon className={contactIconClass} />
                </ContactIconChip>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.email}</div>
                  <div className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    info@dreamteam.technology
                  </div>
                </div>
              </MotionLink>

              <MotionLink
                href="tel:+359878757930"
                className="group flex origin-left cursor-pointer items-center gap-4"
                whileHover={{ scale: 1.05, transition: HOVER_TRANSITION }}
                whileTap={{ scale: 0.99, transition: TAP_TRANSITION }}
                {...reveal(1)}
              >
                <ContactIconChip>
                  <GradientPhoneIcon className={contactIconClass} />
                </ContactIconChip>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    +359 87 875 7930
                  </div>
                </div>
              </MotionLink>

              <MotionLink
                href="tel:+359882367100"
                className="group flex origin-left cursor-pointer items-center gap-4"
                whileHover={{ scale: 1.05, transition: HOVER_TRANSITION }}
                whileTap={{ scale: 0.99, transition: TAP_TRANSITION }}
                {...reveal(2)}
              >
                <ContactIconChip>
                  <GradientPhoneIcon className={contactIconClass} />
                </ContactIconChip>
                <div>
                  <div className="text-sm text-muted-foreground">{t.contact.phone}</div>
                  <div className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    +359 88 236 7100
                  </div>
                </div>
              </MotionLink>

              <motion.button
                type="button"
                onClick={copyAddress}
                className="group flex w-full origin-left cursor-pointer items-start gap-4 text-left"
                aria-label={t.contact.copyAddress}
                title={t.contact.copyAddress}
                whileHover={{ scale: 1.05, transition: HOVER_TRANSITION }}
                whileTap={{ scale: 0.99, transition: TAP_TRANSITION }}
                {...reveal(3)}
              >
                <ContactIconChip className="mt-0.5">
                  <GradientMapPinIcon className={contactIconClass} />
                </ContactIconChip>
                <div className="min-w-0">
                  <div className="mb-1 text-sm text-muted-foreground">{t.contact.address}</div>
                  <div className="font-semibold leading-relaxed text-foreground transition-colors group-hover:text-primary">
                    {addressText}
                  </div>
                </div>
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 sm:gap-x-10">
              {socials.map((s, i) => (
                <MotionLink
                  key={s.alt}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex shrink-0 cursor-pointer items-center justify-center"
                  whileHover={{ scale: 1.2, transition: HOVER_TRANSITION }}
                  whileTap={{ scale: 0.95, transition: TAP_TRANSITION }}
                  {...reveal(4 + i)}
                >
                  <SocialIcon src={s.src} alt={s.alt} />
                </MotionLink>
              ))}
            </div>

            {reviews ? (
              <motion.div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4" {...reveal(4 + socials.length)}>
                <GoogleReviewsBadge label={t.footer.googleReviews} />
                <ClutchBadge />
              </motion.div>
            ) : null}
          </JourneyItem>
        </div>
      </div>
    </section>
  );
}
