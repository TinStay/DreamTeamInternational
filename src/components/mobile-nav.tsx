"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconBook, IconBriefcase, IconHome, IconMail, IconMenu2, IconVideo } from "@tabler/icons-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/lib/i18n/language-context";
import { buttonVariants, primaryGradientInteractiveClassName } from "@/components/ui/button";
import { GlassShell } from "@/components/ui/glass-shell";
import { contactProcessPath, homePath, trainingPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useLanguage();
  const homeHref = homePath(language);
  const trainingHref = trainingPath(language);
  const contactHref = contactProcessPath(language);
  const portfolioHref = `${homeHref}#portfolio`;
  const servicesHref = `${homeHref}#services`;

  return (
    <>
      <GlassShell className="service-mobile-dock lg:hidden fixed bottom-5 left-1/2 z-50 flex w-[92%] max-w-md -translate-x-1/2 items-center gap-1.5 px-3 py-2.5">
        <Link
          href={portfolioHref}
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconVideo className="h-[26px] w-[26px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.header.portfolio}</span>
        </Link>

        <Link
          href={contactHref}
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconMail className="h-[26px] w-[26px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.header.contact}</span>
        </Link>

        <Link
          href={servicesHref}
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconBriefcase className="h-[26px] w-[26px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.header.services}</span>
        </Link>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            render={
              <button
                className={cn(
                  primaryGradientInteractiveClassName,
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white outline-none active:scale-95"
                )}
              />
            }
          >
            <IconMenu2 className="h-[26px] w-[26px] drop-shadow-sm" />
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl border-t-0 liquid-glass p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border/40 rounded-full" />
            <div className="flex flex-col h-full pt-16 pb-8 px-6 overflow-y-auto">
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-border/20">
                <Image src="/logo-1.png" alt="DreamTeam" width={1024} height={416} sizes="180px" className="h-18 w-auto mb-6 grayscale dark:invert" />
                <div className="flex items-center gap-4">
                  <LanguageToggle />
                  <ThemeToggle className="shrink-0" />
                </div>
              </div>

              <div className="flex flex-col gap-6 text-xl font-heading font-medium">
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
                <Link
                  href={contactHref}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "flex h-14 w-full select-none items-center justify-center rounded-full text-lg font-bold"
                  )}
                >
                  {t.header.chat}
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </GlassShell>
    </>
  );
}
