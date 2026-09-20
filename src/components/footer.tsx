"use client";

import Link from "next/link";
import Image from "next/image";
import { Sphere } from "./iridescent-shapes";
import { LanguageToggle } from "./language-toggle";
import { IconMail, IconMapPin, IconPhone } from "@tabler/icons-react";
import { ClutchBadge, GoogleReviewsBadge } from "@/components/review-badges";
import { EMAIL_PRIMARY, GOOGLE_REVIEWS, PHONE_PRIMARY, PHONE_SECONDARY } from "@/lib/contact-info";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  contactProcessPath,
  homePath,
  portfolioPath,
  privacyPath,
  projectsPath,
  termsPath,
  trainingPath,
} from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { cn } from "@/lib/utils";

/*
 * The site footer: the brand column (logo, line, language), the links, the
 * contact column (email, both phones, the office address as a pin on Google
 * Maps, the social icons) and the reviews
 * column (the Google rating badge and the Clutch widget), with the legal
 * links and the copyright along the bottom.
 */

const linkClass = "text-muted-foreground transition-colors hover:text-primary";
/** A contact line: a small brand-coloured icon (lifting a little on hover) in front of the text. */
const contactLineClass = cn(linkClass, "group inline-flex items-center gap-2");
const contactIconClass = "size-4 shrink-0 text-primary transition-transform duration-200 ease-out group-hover:-translate-y-0.5";

export function Footer() {
  const { t, language } = useLanguage();
  const homeHref = homePath(language);

  return (
    <footer className="liquid-glass relative mt-20 overflow-hidden border-t border-card-border">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-[1.3fr_0.8fr_1fr_1fr] lg:gap-8">
          {/* Brand column */}
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <Link href={homeHref} className="font-heading text-2xl font-bold tracking-tight">
              <Image src="/logo-1.png" alt="DreamTeam" width={1024} height={416} sizes="80px" className="h-8 w-auto grayscale transition-all dark:invert" />
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">{t.footer.desc}</p>
            <div className="mt-1 flex items-center gap-3">
              <LanguageToggle />
            </div>
          </div>

          {/* Links column */}
          <div className="flex flex-col items-center gap-3 text-sm sm:items-start">
            <h4 className="mb-2 font-heading font-semibold text-foreground">{t.footer.links}</h4>
            <Link href={portfolioPath(language)} className={linkClass}>
              {t.header.portfolio}
            </Link>
            <Link href={projectsPath(language)} className={linkClass}>
              {t.header.projects}
            </Link>
            <Link href={trainingPath(language)} className={linkClass}>
              {t.header.training}
            </Link>
            <Link href={contactProcessPath(language)} className={linkClass}>
              {t.header.contact}
            </Link>
          </div>

          {/* Contact column: email, both phones, the social profiles - each line with its small icon, like the pin
              in front of the address. */}
          <div className="flex flex-col items-center gap-3 text-sm sm:items-start">
            <h4 className="mb-2 font-heading font-semibold text-foreground">{t.header.contact}</h4>
            <a href={EMAIL_PRIMARY.href} className={contactLineClass}>
              <IconMail className={contactIconClass} aria-hidden />
              <span>{EMAIL_PRIMARY.label}</span>
            </a>
            <a href={PHONE_PRIMARY.href} className={contactLineClass}>
              <IconPhone className={contactIconClass} aria-hidden />
              <span>{PHONE_PRIMARY.label}</span>
            </a>
            <a href={PHONE_SECONDARY.href} className={contactLineClass}>
              <IconPhone className={contactIconClass} aria-hidden />
              <span>{PHONE_SECONDARY.label}</span>
            </a>
            {/* The office: the address as a link to the place on Google Maps, a pin in front. */}
            <a
              href={GOOGLE_REVIEWS.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(contactLineClass, "max-w-xs items-start text-left")}
            >
              <IconMapPin className={cn(contactIconClass, "mt-0.5")} aria-hidden />
              <span>{t.contact.addressVal}</span>
            </a>
            <div className="mt-2 flex items-center gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.alt}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.alt}
                  className="inline-flex shrink-0 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-110"
                >
                  {/* `unoptimized`: the icons are tiny hard-edged shapes - the optimizer's 32px lossy WebP, resampled again for the screen, read blurry; the 256px lossless PNG downsampled once by the browser is crisp at any pixel ratio. */}
                  <Image src={s.src} alt="" width={256} height={256} unoptimized className="size-8 object-contain opacity-90 transition-opacity hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>

          {/* Reviews column: the Google rating and the Clutch widget. */}
          <div className="flex flex-col items-center gap-3 text-sm sm:items-start">
            <h4 className="mb-2 font-heading font-semibold text-foreground">{t.footer.reviews}</h4>
            <GoogleReviewsBadge label={t.footer.googleReviews} />
            <ClutchBadge className="mt-1" />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/10 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {t.footer.copy}
          </p>
          <div className="flex items-center gap-5">
            <Link href={termsPath(language)} className={linkClass}>
              {t.footer.terms}
            </Link>
            <Link href={privacyPath(language)} className={linkClass}>
              {t.footer.privacy}
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-[-5%] bottom-[-20%] opacity-20">
        <Sphere className="scale-75 grayscale" />
      </div>
    </footer>
  );
}
