"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconBook,
  IconBriefcase,
  IconFolder,
  IconHome,
  IconMail,
  IconMenu2,
  IconVideo,
} from "@tabler/icons-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/lib/i18n/language-context";
import { brandLogo } from "@/lib/brand-logo";
import { primaryGradientInteractiveClassName } from "@/components/ui/button";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { GlassShell } from "@/components/ui/glass-shell";
import {
  contactProcessPath,
  homePath,
  portfolioPath,
  projectsPath,
  servicesPath,
  trainingPath,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useLanguage();
  const logo = brandLogo(language);
  const homeHref = homePath(language);
  const trainingHref = trainingPath(language);
  const contactHref = contactProcessPath(language);
  const portfolioHref = portfolioPath(language);
  // The dock's Projects opens the listing (it pointed at the home page's projects stage for a while).
  const projectsHref = projectsPath(language);
  const servicesHref = servicesPath(language);

  return (
    <>
      {/* Dock: Projects first; Portfolio lives in the sheet menu. Tight to the bottom edge (the home indicator's
          inset on iPhones), as wide as the top bar. */}
      <GlassShell className="service-mobile-dock lg:hidden fixed bottom-[max(0.375rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[96%] max-w-lg -translate-x-1/2 items-center gap-1.5 px-3 py-2">
        <Link
          href={projectsHref}
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconFolder className="h-[22px] w-[22px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.header.projects}</span>
        </Link>

        <Link
          href={contactHref}
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconMail className="h-[22px] w-[22px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.header.contact}</span>
        </Link>

        <Link
          href={servicesHref}
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconBriefcase className="h-[22px] w-[22px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.header.services}</span>
        </Link>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            render={
              <button
                className={cn(
                  primaryGradientInteractiveClassName,
                  "me-1 flex size-[3.25rem] shrink-0 items-center justify-center rounded-full text-white outline-none active:scale-95"
                )}
              />
            }
          >
            <IconMenu2 className="size-[26px] drop-shadow-sm" />
          </SheetTrigger>
          {/* Full viewport width — kill the glass side borders so the sheet
              reads edge-to-edge instead of an inset panel. */}
          <SheetContent
            side="bottom"
            className="liquid-glass inset-x-0 h-[75vh] w-full rounded-t-3xl border-x-0 border-t-0 border-b-0 p-0"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border/40 rounded-full" />
            <div className="flex flex-col h-full pt-16 pb-8 px-6 overflow-y-auto">
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-border/20">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  sizes="240px"
                  className={cn("mb-6 w-auto grayscale dark:invert", language === "en" ? "h-10" : "h-18")}
                />
                <div className="flex items-center gap-4">
                  <LanguageToggle />
                  {/* English has one theme (`forcedTheme` in the layout), so no toggle there. */}
                  {language === "en" ? null : <ThemeToggle className="shrink-0" />}
                </div>
              </div>

              <div className="flex flex-col gap-6 text-xl font-heading font-semibold">
                <Link
                  href={homeHref}
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconHome className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.mobileNav.home}</span>
                </Link>
                <Link
                  href={portfolioHref}
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconVideo className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.header.portfolio}</span>
                </Link>
                <Link
                  href={projectsPath(language)}
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconFolder className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.header.projects}</span>
                </Link>
                <Link
                  href={servicesHref}
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconBriefcase className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.header.services}</span>
                </Link>
                <Link
                  href={contactHref}
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconMail className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.header.contact}</span>
                </Link>
                <Link
                  href={trainingHref}
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconBook className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.header.training}</span>
                </Link>
              </div>

              <div className="mt-auto pt-8">
                {/* The site's main CTA, to the services page like the desktop header's. */}
                <ButtonWithIcon href={servicesHref} onClick={() => setIsOpen(false)} surface="auto" className="h-14 w-full text-base">
                  {t.header.quoteCta}
                </ButtonWithIcon>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </GlassShell>
    </>
  );
}
