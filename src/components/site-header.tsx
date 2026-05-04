"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
// import { LanguageDropdown } from "./language-dropdown";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { IconMailFilled } from "@tabler/icons-react";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, language } = useLanguage();
  const homeHref = language === "bg" ? "/bg" : "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Mobile: glass bar — DT logo left, theme toggle right (matches bottom sticky dock) */}
      <header
        className={`fixed left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 transition-all duration-300 lg:hidden top-[max(1.25rem,env(safe-area-inset-top))] ${
          isScrolled ? "scale-[0.98]" : "scale-100"
        }`}
      >
        <div className="flex items-center justify-between gap-3 rounded-[2.25rem] border border-border/30 bg-background/90 px-4 py-2.5 shadow-[0_22px_60px_rgba(0,0,0,0.42),0_10px_28px_rgba(0,0,0,0.28)] ring-1 ring-black/10 backdrop-blur-md dark:shadow-[0_24px_70px_rgba(0,0,0,0.65),0_12px_36px_rgba(0,0,0,0.45)] dark:ring-white/10 liquid-glass">
          <Link href={homeHref} className="group flex min-w-0 shrink items-center">
            <img
              src="/logo-1.png"
              alt="DreamTeam Technology"
              className="h-9 w-auto grayscale transition-all group-hover:grayscale-0 dark:invert sm:h-10"
            />
          </Link>
          <ThemeToggle className="shrink-0" />
        </div>
      </header>

    <header
      className={`fixed top-4 left-0 right-0 z-50 mx-auto max-w-6xl transition-all duration-300 hidden lg:block px-4 ${
        isScrolled ? "scale-[0.98]" : "scale-100"
      }`}
    >
      <div className="liquid-glass-header shadow-elevated-soft rounded-full px-6 py-3 grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2 group justify-self-start min-w-0">
          <img
            src="/logo-1.png"
            alt="DreamTeam Technology"
            className="h-11 w-auto grayscale group-hover:grayscale-0 transition-all dark:invert"
          />
        </Link>

        {/* Center nav — Portfolio, Process, Contact */}
        <nav className="flex items-center justify-center gap-6 lg:gap-10 font-semibold text-sm lg:text-base text-foreground/80 min-w-0 px-2">
          <Link href="#portfolio" className="hover:text-primary transition-colors whitespace-nowrap">
            {t.header.portfolio}
          </Link>
          <Link href="#process" className="hover:text-primary transition-colors whitespace-nowrap">
            {t.header.process}
          </Link>
          <Link
            href={language === "bg" ? "/bg/training" : "/en/training"}
            className="hover:text-primary transition-colors whitespace-nowrap"
          >
            {t.header.training}
          </Link>
          <Link href="#contact" className="hover:text-primary transition-colors whitespace-nowrap">
            {t.header.contact}
          </Link>
        </nav>

        {/* Right controls */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          {/* <LanguageDropdown /> */}
          <ThemeToggle className="shrink-0" />
          <Link
            href="#contact"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "rounded-full transition-all font-semibold h-11 px-6 text-base shadow-lg gap-2 cursor-pointer"
            )}
          >
            <IconMailFilled className="h-5 w-5" />
            {t.header.chat}
          </Link>
        </div>
      </div>
    </header>
    </>
  );
}
