"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useLanguage();

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
      <div className="liquid-glass-header rounded-full px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <img src="/logo-1.png" alt="DreamTeam Technology" className="h-8 w-auto grayscale group-hover:grayscale-0 transition-all dark:invert" />
        </Link>

        {/* Centered nav — Portfolio, Process, Contact */}
        <nav className="flex items-center gap-8 font-medium text-sm text-foreground/80 absolute left-1/2 -translate-x-1/2">
          <Link href="#portfolio" className="hover:text-primary transition-colors">{t.header.portfolio}</Link>
          <Link href="#process"   className="hover:text-primary transition-colors">{t.header.process}</Link>
          <Link href="#contact"   className="hover:text-primary transition-colors">{t.header.contact}</Link>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <ThemeToggle />
          <Link
            href="#order-form"
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-all font-semibold"
            )}
          >
            {t.header.chat}
          </Link>
        </div>
      </div>
    </header>
  );
}
