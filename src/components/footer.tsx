"use client";

import Link from "next/link";
import { Sphere } from "./iridescent-shapes";
import { useLanguage } from "@/lib/i18n/language-context";
// import { LanguageDropdown } from "./language-dropdown";
// import { ThemeToggle } from "./theme-toggle";

export function Footer() {
  const { t, language } = useLanguage();
  const homeHref = language === "bg" ? "/bg" : "/";
  const termsHref = language === "bg" ? "/bg/terms" : "/en/terms";
  const privacyHref = language === "bg" ? "/bg/privacy" : "/en/privacy";
  const trainingHref = language === "bg" ? "/bg/training" : "/en/training";

  return (
    <footer className="relative overflow-hidden border-t border-border/20 liquid-glass mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-center md:items-start text-center md:text-left">
          
          {/* Brand column */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href={homeHref} className="font-heading font-bold text-2xl tracking-tight">
              <img src="/logo-1.png" alt="DreamTeam Technology" className="h-8 w-auto grayscale dark:invert transition-all" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t.footer.desc}
            </p>
            {/* Language + theme toggles in footer (disabled)
            <div className="flex items-center gap-3 mt-1">
              <LanguageDropdown />
              <ThemeToggle />
            </div>
            */}
          </div>

          {/* Links column */}
          <div className="flex flex-col gap-3 items-center md:items-start text-sm">
            <h4 className="font-heading font-semibold text-foreground mb-2">{t.footer.links}</h4>
            <Link href="#portfolio"   className="text-muted-foreground hover:text-primary transition-colors">{t.header.portfolio}</Link>
            <Link href="#process"     className="text-muted-foreground hover:text-primary transition-colors">{t.header.process}</Link>
            <Link href={trainingHref} className="text-muted-foreground hover:text-primary transition-colors">{t.header.training}</Link>
            <Link href="#order-form"  className="text-muted-foreground hover:text-primary transition-colors">{t.header.pricing}</Link>
            <Link href="#contact"     className="text-muted-foreground hover:text-primary transition-colors">{t.header.contact}</Link>
          </div>

          {/* Legal column */}
          <div className="flex flex-col gap-3 items-center md:items-end text-sm">
            <Link href={termsHref} className="text-muted-foreground hover:text-primary transition-colors">
              {t.footer.terms}
            </Link>
            <Link href={privacyHref} className="text-muted-foreground hover:text-primary transition-colors">
              {t.footer.privacy}
            </Link>
          </div>
          
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {t.footer.copy}
          </p>
        </div>
      </div>
      
      {/* Decorative footer shape */}
      <div className="absolute right-[-5%] bottom-[-20%] pointer-events-none opacity-20">
        <Sphere className="scale-75 grayscale" />
      </div>
    </footer>
  );
}
