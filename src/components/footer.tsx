"use client";

import Link from "next/link";
import Image from "next/image";
import { Sphere } from "./iridescent-shapes";
import { LanguageToggle } from "./language-toggle";
import { ClutchBadge, GoogleReviewsBadge } from "@/components/review-badges";
import { EMAIL_PRIMARY, PHONE_PRIMARY, PHONE_SECONDARY } from "@/lib/contact-info";
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

/*
 * The site footer: the brand column (logo, line, language), the links, the
 * contact column (email, both phones, the social icons) and the reviews
 * column (the Google rating badge and the Clutch widget), with the legal
 * links and the copyright along the bottom.
 */

const linkClass = "text-muted-foreground transition-colors hover:text-primary";

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

          {/* Contact column: email, both phones, the social profiles. */}
          <div className="flex flex-col items-center gap-3 text-sm sm:items-start">
            <h4 className="mb-2 font-heading font-semibold text-foreground">{t.header.contact}</h4>
            <a href={EMAIL_PRIMARY.href} className={linkClass}>
              {EMAIL_PRIMARY.label}
            </a>
            <a href={PHONE_PRIMARY.href} className={linkClass}>
              {PHONE_PRIMARY.label}
            </a>
            <a href={PHONE_SECONDARY.href} className={linkClass}>
              {PHONE_SECONDARY.label}
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
                  <Image src={s.src} alt="" width={256} height={256} sizes="32px" className="size-8 object-contain opacity-90 transition-opacity hover:opacity-100" />
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
