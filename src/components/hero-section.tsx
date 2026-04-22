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
      <div className="absolute inset-0 z-0 overflow-hidden drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)]">
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
        
        {/* Dynamic Overlay (dark corner vignettes) */}
        <div className="absolute inset-0 transition-opacity duration-700 bg-[radial-gradient(1200px_700px_at_50%_30%,rgba(0,0,0,0.25),transparent_55%),radial-gradient(900px_600px_at_0%_0%,rgba(0,0,0,0.65),transparent_55%),radial-gradient(900px_600px_at_100%_0%,rgba(0,0,0,0.65),transparent_55%),radial-gradient(900px_600px_at_0%_100%,rgba(0,0,0,0.55),transparent_60%),radial-gradient(900px_600px_at_100%_100%,rgba(0,0,0,0.55),transparent_60%)]" />
        {/* Subtle bottom overlay (light & dark modes) */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t  drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)] to-transparent dark:from-background/100" />
      </div>

      {/* Mobile logo (top-center) */}
      <Link href={homeHref} className="lg:hidden absolute top-5 left-1/2 -translate-x-1/2 z-30 group">
        <Image
          src="/logo-1.png"
          alt="DreamTeam Technology"
          width={320}
          height={128}
          className="h-16 sm:h-20 w-auto grayscale transition-all group-hover:grayscale-0 dark:invert drop-shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
          priority
        />
      </Link>

      {/* Content */}
      <div className="relative z-20 flex w-full flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-24 sm:mt-28 pb-8 sm:pb-10 lg:mt-0 lg:pb-0">
        <h1 className="font-heading font-extrabold text-4xl leading-[1.06] sm:text-5xl md:text-7xl lg:text-8xl tracking-tight md:leading-[1.03] mb-6 sm:mb-8 text-white animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 fill-mode-both drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)]">
          {t.hero.title1}{" "}
          <span className="text-white drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)]">
            {t.hero.title2}
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-700 fill-mode-both w-full sm:w-auto max-w-md sm:max-w-none mx-auto">
          <Link 
            href="#contact"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold tracking-wide h-14 px-10 shadow-elevated-soft hover:scale-105 active:scale-95 text-base"
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
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-[float_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
}
