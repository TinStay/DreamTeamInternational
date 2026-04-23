"use client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  HERO_EMBED,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_REFERRER_POLICY,
} from "@/lib/youtube-embeds";

export function HeroSection() {
  const { t, language } = useLanguage();
  const homeHref = language === "bg" ? "/bg" : "/";

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
    >
      
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 scale-105 pointer-events-none">
          <iframe
            className="absolute left-1/2 top-1/2 h-[100svh] w-[177.78svh] min-h-[56.25vw] min-w-[100vw] -translate-x-1/2 -translate-y-1/2"
            src={HERO_EMBED.src}
            title={HERO_EMBED.title ?? "YouTube video"}
            allow={YOUTUBE_IFRAME_ALLOW}
            allowFullScreen
            referrerPolicy={YOUTUBE_REFERRER_POLICY}
          />
        </div>
        
        {/* Dynamic Overlay (light corner vignettes — keep video readable) */}
        <div className="absolute inset-0 transition-opacity duration-700 bg-[radial-gradient(1200px_700px_at_50%_30%,rgba(0,0,0,0.14),transparent_58%),radial-gradient(900px_600px_at_0%_0%,rgba(0,0,0,0.32),transparent_58%),radial-gradient(900px_600px_at_100%_0%,rgba(0,0,0,0.32),transparent_58%),radial-gradient(900px_600px_at_0%_100%,rgba(0,0,0,0.26),transparent_62%),radial-gradient(900px_600px_at_100%_100%,rgba(0,0,0,0.26),transparent_62%)]" />
        {/* Bottom: blend video into page + soft white lift (light) / gentle haze (dark) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-21 bg-gradient-to-t from-background via-background/15 to-transparent sm:h-36 dark:from-background dark:via-background/85" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-white/25 via-white/0 to-transparent sm:h-32 dark:from-white/[0.07] dark:via-white/[0.02]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 "
          aria-hidden
        />
      </div>

      {/* Mobile logo (top-center) */}
      <Link href={homeHref} className="lg:hidden absolute top-5 left-1/2 -translate-x-1/2 z-30 group">
        <Image
          src="/logo-2.png"
          alt="DreamTeam Technology"
          width={420}
          height={420}
          className="h-18 w-auto sm:h-14 grayscale transition-all group-hover:grayscale-0 dark:invert drop-shadow-[0_8px_24px_rgba(0,0,0,0.75)]"
          priority
        />
      </Link>

      {/* Content */}
      <div className="relative z-20 flex w-full flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-[6.75rem] sm:mt-32 pb-8 sm:pb-10 lg:mt-0 lg:pb-0">
        <h1 className="font-heading font-extrabold text-4xl leading-[1.06] sm:text-5xl md:text-7xl lg:text-8xl tracking-tight md:leading-[1.03] mb-6 sm:mb-8 text-white animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 fill-mode-both ">
          {t.hero.title1}{" "}
          <span className="text-hero-accent">{t.hero.title2}</span>
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-700 fill-mode-both w-full sm:w-auto max-w-md sm:max-w-none mx-auto">
          <Link 
            href="#contact"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full sm:w-auto rounded-full transition-all font-semibold tracking-wide h-14 px-10 shadow-elevated-soft hover:scale-105 active:scale-95 text-base"
            )}
          >
            {t.hero.cta1}
          </Link>
          <Link 
            href="#portfolio" 
            className={cn(
               buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto rounded-full transition-all font-semibold tracking-wide h-14 px-10 border-border/30 bg-background/20 text-foreground dark:text-white liquid-glass-header hover:scale-105 active:scale-95 text-base shadow-elevated-soft"
            )}
          >
             {t.hero.cta2}
          </Link>
        </div>

      </div>


      {/* Scroll Indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-bounce lg:bottom-8">
        <div className="w-[30px] h-[50px] rounded-full border-2 border-white/35 flex items-start justify-center p-2 liquid-glass">
          <div className="h-1.5 w-1.5 animate-[float_2s_ease-in-out_infinite] rounded-full bg-primary shadow-[0_0_14px_var(--primary-soft-glow)]" />
        </div>
      </div>
    </section>
  );
}
