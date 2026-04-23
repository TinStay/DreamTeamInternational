"use client";

import Link from "next/link";
// import { ThemeToggle } from "./theme-toggle";
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
          <Link href="#contact" className="hover:text-primary transition-colors whitespace-nowrap">
            {t.header.contact}
          </Link>
        </nav>

        {/* Right controls */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          {/* <LanguageDropdown /> */}
          {/* <ThemeToggle /> */}
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
  );
}
