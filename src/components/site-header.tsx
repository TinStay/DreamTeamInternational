"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
// import { LanguageDropdown } from "./language-dropdown";
import { buttonVariants } from "@/components/ui/button";
import { GlassShell } from "@/components/ui/glass-shell";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { contactProcessPath, homePath, servicesPath, trainingPath } from "@/lib/routes";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, language } = useLanguage();
  const homeHref = homePath(language);
  const contactHref = contactProcessPath(language);

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
        <GlassShell className="flex items-center justify-between gap-3 px-5 py-2">
          <Link href={homeHref} className="group flex min-w-0 shrink items-center py-1 pr-2">
            <Image
              src="/logo-1.png"
              alt="DreamTeam"
              width={1024}
              height={416}
              sizes="120px"
              className="h-10 w-auto grayscale transition-all group-hover:grayscale-0 dark:invert"
            />
          </Link>
          <ThemeToggle className="shrink-0" />
        </GlassShell>
      </header>

    <header
      className={`fixed top-4 left-0 right-0 z-50 mx-auto max-w-6xl transition-all duration-300 hidden lg:block px-4 ${
        isScrolled ? "scale-[0.98]" : "scale-100"
      }`}
    >
      <div className="liquid-glass-header shadow-elevated-soft rounded-full px-6 py-2 grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6">
        {/* Logo — breathing room via padding so it never touches the bar edges. */}
        <Link href={homeHref} className="flex items-center group justify-self-start min-w-0 py-1 pr-3">
          <Image
            src="/logo-1.png"
            alt="DreamTeam"
            width={1024}
            height={416}
            sizes="160px"
            priority
            className="h-11 w-auto grayscale group-hover:grayscale-0 transition-all dark:invert md:h-12"
          />
        </Link>

        {/* Center nav — Portfolio, Services, Training, Contact */}
        <nav className="flex items-center justify-center gap-5 xl:gap-8 font-semibold text-sm lg:text-base text-foreground/80 min-w-0 px-2">
          <Link href={`${homeHref}#portfolio`} className="hover:text-primary transition-colors whitespace-nowrap">
            {t.header.portfolio}
          </Link>
          <Link href={servicesPath(language)} className="hover:text-primary transition-colors whitespace-nowrap">
            {t.header.services}
          </Link>
          <Link
            href={trainingPath(language)}
            className="hover:text-primary transition-colors whitespace-nowrap"
          >
            {t.header.training}
          </Link>
          <Link href={contactHref} className="hover:text-primary transition-colors whitespace-nowrap">
            {t.header.contact}
          </Link>
        </nav>

        {/* Right controls */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          {/* <LanguageDropdown /> */}
          <ThemeToggle className="shrink-0" />
          <span className="relative inline-flex">
            {/* Subtle red→purple glow around the CTA. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-full bg-primary-gradient opacity-45 blur-md"
            />
            <Link
              href={`${homeHref}#quote`}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "relative rounded-full transition-all font-semibold h-10 px-5 text-base shadow-lg cursor-pointer"
              )}
            >
              {t.header.quoteCta}
            </Link>
          </span>
        </div>
      </div>
    </header>
    </>
  );
}
