"use client";

import Link from "next/link";
import Image from "next/image";
import { Sphere } from "./iridescent-shapes";
import { IconMail, IconMapPin } from "@tabler/icons-react";
import { ClutchBadge } from "@/components/review-badges";
import { openConsentSettings } from "@/lib/consent";
import { EMAIL_PRIMARY } from "@/lib/contact-info";
import { useLanguage } from "@/lib/i18n/language-context";
import { brandLogo } from "@/lib/brand-logo";
import { aboutPath, homePath, portfolioPath, pricingPath, privacyPath, projectsPath, termsPath } from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { cn } from "@/lib/utils";

/*
 * The site footer: the brand (logo, line, email, the San Francisco address, the Clutch rating) and five link columns -
 * Order a video (with every style of video), Pricing (with the packs), Company (About us, Policies, Cookies, Terms),
 * Resources (Customers, Our work) and Socials (text links, no icon buttons) - with the copyright along the bottom.
 */

const linkClass = "text-muted-foreground transition-colors hover:text-primary";
const headingClass = "mb-2 font-heading font-semibold text-foreground";

/** The video styles under "Order a video" (keys of `packages.items`) and the packs under "Pricing" (keys of `plans.tiers`). */
const STYLES = ["socialAds", "corporate", "tvAds", "productVideos", "brandMascots", "motionGraphics", "launchVideos", "explainerVideos", "ugcAds", "realEstate", "musicVideos"] as const;
const PACKS = [
  { key: "personal", audience: "individual" },
  { key: "creator", audience: "individual" },
  { key: "pro", audience: "individual" },
  { key: "local", audience: "business" },
  { key: "brand", audience: "business" },
  { key: "enterprise", audience: "business" },
] as const;

export function Footer() {
  const { t, language } = useLanguage();
  const f = t.footer;
  const logo = brandLogo(language);
  const homeHref = homePath(language);
  const pricing = pricingPath(language);
  const styles = t.packages.items as Record<string, { title: string }>;
  const tiers = t.plans.tiers as Record<string, { name: string }>;

  return (
    <footer className="liquid-glass relative mt-20 overflow-hidden border-t border-card-border">
      <div className="relative z-10 mx-auto max-w-[88rem] px-6 py-12">
        <div className="grid gap-10 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-[1.5fr_1.15fr_0.9fr_0.9fr_0.9fr_0.8fr] lg:gap-8">
          {/* Brand column */}
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <Link href={homeHref} className="font-heading text-2xl font-bold tracking-tight">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                sizes="140px"
                className={cn("w-auto grayscale transition-all dark:invert", language === "en" ? "h-6" : "h-8")}
              />
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">{f.desc}</p>
            <div className="flex flex-col items-center gap-2.5 text-sm sm:items-start">
              <a href={EMAIL_PRIMARY.href} className={cn(linkClass, "group inline-flex items-center gap-2")}>
                <IconMail className="size-4 shrink-0 text-primary" aria-hidden />
                <span>{EMAIL_PRIMARY.label}</span>
              </a>
              <p className="inline-flex max-w-xs items-start gap-2 text-left text-muted-foreground">
                <IconMapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{f.address}</span>
              </p>
            </div>
            <ClutchBadge className="mt-1" />
          </div>

          {/* Order a video: the link, and beneath it every style of video (the "find the package" cards). */}
          <div className="flex flex-col items-center gap-2.5 text-sm sm:items-start">
            <Link href={`${pricing}?for=individual`} className={cn(headingClass, "transition-colors hover:text-primary")}>
              {f.orderVideo}
            </Link>
            {STYLES.map((key) => (
              <Link key={key} href={`${pricing}?for=business`} className={linkClass}>
                {styles[key].title}
              </Link>
            ))}
          </div>

          {/* Pricing: the link, and beneath it the packs. */}
          <div className="flex flex-col items-center gap-2.5 text-sm sm:items-start">
            <Link href={pricing} className={cn(headingClass, "transition-colors hover:text-primary")}>
              {f.pricing}
            </Link>
            {PACKS.map(({ key, audience }) => (
              <Link key={key} href={`${pricing}?for=${audience}`} className={linkClass}>
                {tiers[key].name}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div className="flex flex-col items-center gap-2.5 text-sm sm:items-start">
            <h4 className={headingClass}>{f.company}</h4>
            <Link href={aboutPath(language)} className={linkClass}>
              {f.aboutUs}
            </Link>
            <Link href={privacyPath(language)} className={linkClass}>
              {f.policies}
            </Link>
            {/* Reopens the cookie banner on its settings - consent must be as easy to change as it was to give. */}
            <button type="button" onClick={openConsentSettings} className={cn(linkClass, "cursor-pointer")}>
              {f.cookies}
            </button>
            <Link href={termsPath(language)} className={linkClass}>
              {f.terms}
            </Link>
          </div>

          {/* Resources */}
          <div className="flex flex-col items-center gap-2.5 text-sm sm:items-start">
            <h4 className={headingClass}>{f.resources}</h4>
            <Link href={projectsPath(language)} className={linkClass}>
              {f.customers}
            </Link>
            <Link href={portfolioPath(language)} className={linkClass}>
              {f.ourWork}
            </Link>
          </div>

          {/* Socials: plain text links. */}
          <div className="flex flex-col items-center gap-2.5 text-sm sm:items-start">
            <h4 className={headingClass}>{f.socials}</h4>
            {SOCIAL_LINKS.map((s) => (
              <a key={s.alt} href={s.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {s.alt}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/10 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {f.copy}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute right-[-5%] bottom-[-20%] opacity-20">
        <Sphere className="scale-75 grayscale" />
      </div>
    </footer>
  );
}
