"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageDropdown } from "./language-dropdown";
import { IconHome, IconMail, IconMenu2, IconVideo } from "@tabler/icons-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/lib/i18n/language-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useLanguage();
  const homeHref = language === "bg" ? "/bg" : "/";

  return (
    <>
      <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md rounded-[2.25rem] liquid-glass px-3 py-2.5 flex items-center gap-1.5 border border-border/30 bg-background/90 backdrop-blur-md ring-1 ring-black/10 dark:ring-white/10 shadow-[0_22px_60px_rgba(0,0,0,0.42),0_10px_28px_rgba(0,0,0,0.28)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.65),0_12px_36px_rgba(0,0,0,0.45)]">
        <Link
          href={homeHref}
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconHome className="h-[26px] w-[26px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.mobileNav.home}</span>
        </Link>

        <Link
          href="#portfolio"
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconVideo className="h-[26px] w-[26px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.mobileNav.work}</span>
        </Link>

        <Link
          href="#contact"
          className="group flex flex-1 select-none flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconMail className="h-[26px] w-[26px] text-neutral-800 transition-transform group-hover:scale-110 dark:text-neutral-200" />
          <span className="text-xs font-semibold tracking-wide">{t.mobileNav.contact}</span>
        </Link>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            render={
              <button className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-primary via-primary to-[var(--primary-gradient-end)] text-white shadow-[0_8px_22px_var(--primary-elevated-shadow)] outline-none transition-all hover:scale-105 hover:brightness-110 active:scale-95" />
            }
          >
            <IconMenu2 className="h-[26px] w-[26px] drop-shadow-sm" />
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl border-t-0 liquid-glass p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border/40 rounded-full" />
            <div className="flex flex-col h-full pt-16 pb-8 px-6 overflow-y-auto">
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-border/20">
                <img src="/logo-1.png" alt="DreamTeam Technology" className="h-18 w-auto mb-6 grayscale dark:invert" />
                {/* <div className="flex gap-4"> */}
                  {/* <LanguageDropdown /> */}
                  {/* <ThemeToggle /> */}
                {/* </div> */}
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
                  href="#portfolio"
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconVideo className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.mobileNav.work}</span>
                </Link>
                <Link
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="group flex select-none items-center gap-4 text-foreground/80 transition-colors"
                >
                  <IconMail className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-200" />
                  <span className="transition-colors group-hover:text-primary">{t.mobileNav.contact}</span>
                </Link>
                {/* Location (maps): was a separate row here — restore with IconMapPin + maps URL when needed */}
              </div>

              <div className="mt-auto pt-8">
                <Link
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full h-14 rounded-full flex items-center justify-center font-bold text-lg select-none"
                  )}
                >
                  {t.header.chat}
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
