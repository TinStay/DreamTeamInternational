"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageDropdown } from "./language-dropdown";
import { Home, Layers, Video, Mail, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/lib/i18n/language-context";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useLanguage();
  const homeHref = language === "bg" ? "/bg" : "/";

  return (
    <>
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md rounded-[2.25rem] liquid-glass px-4 py-4 flex items-center gap-2 border border-border/20 shadow-2xl bg-background/80 backdrop-blur-md">
        <Link
          href={homeHref}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors group select-none"
        >
          <Home size={26} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">{t.mobileNav.home}</span>
        </Link>

        <Link
          href="#portfolio"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors group select-none"
        >
          <Video size={26} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">{t.mobileNav.work}</span>
        </Link>

        <Link
          href="#process"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors group select-none"
        >
          <Layers size={26} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">{t.mobileNav.process}</span>
        </Link>

        <Link
          href="#contact"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors group select-none"
        >
          <Mail size={26} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">{t.mobileNav.contact}</span>
        </Link>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            render={
              <button className="shrink-0 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all outline-none" />
            }
          >
            <Menu size={26} />
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl border-t-0 liquid-glass p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border/40 rounded-full" />
            <div className="flex flex-col h-full pt-16 pb-8 px-6 overflow-y-auto">
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-border/20">
                <img src="/logo-1.png" alt="DreamTeam Technology" className="h-12 w-auto mb-6 grayscale dark:invert" />
                <div className="flex gap-4">
                  <LanguageDropdown />
                  <ThemeToggle />
                </div>
              </div>

              <div className="flex flex-col gap-6 text-xl font-heading font-medium">
                <Link
                  href={homeHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none"
                >
                  <Home /> {t.mobileNav.home}
                </Link>
                <Link
                  href="#portfolio"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none"
                >
                  <Video /> {t.mobileNav.work}
                </Link>
                <Link
                  href="#process"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none"
                >
                  <Layers /> {t.mobileNav.process}
                </Link>
                <Link
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none"
                >
                  <Mail /> {t.mobileNav.contact}
                </Link>
              </div>

              <div className="mt-auto pt-8">
                <p className="text-sm text-muted-foreground mb-4">{t.mobileNav.ready}</p>
                <Link
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg select-none"
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
