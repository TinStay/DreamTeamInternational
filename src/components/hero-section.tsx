"use client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const { t, language } = useLanguage();
  const homeHref = language === "bg" ? "/bg" : "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
    >
      
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)]">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="object-cover w-full h-full scale-105  "
          poster="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=2070&auto=format&fit=crop"
        >
          {/* Local Portfolio Video */}
          <source src="/videos/DT%20Portoflio%20Horizontal%20BG%20YT.mp4" type="video/mp4" />
        </video>
        
        {/* Dynamic Overlay (dark corner vignettes) */}
        <div className="absolute inset-0 transition-opacity duration-700 bg-[radial-gradient(1200px_700px_at_50%_30%,rgba(0,0,0,0.25),transparent_55%),radial-gradient(900px_600px_at_0%_0%,rgba(0,0,0,0.65),transparent_55%),radial-gradient(900px_600px_at_100%_0%,rgba(0,0,0,0.65),transparent_55%),radial-gradient(900px_600px_at_0%_100%,rgba(0,0,0,0.55),transparent_60%),radial-gradient(900px_600px_at_100%_100%,rgba(0,0,0,0.55),transparent_60%)]" />
        {/* Subtle bottom overlay (light & dark modes) */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t  drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)] to-transparent dark:from-background/100" />
      </div>

      {/* Mobile logo (top-center) */}
      <Link href={homeHref} className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2 z-30 group">
        <img
          src="/logo-1.png"
          alt="DreamTeam Technology"
          className="h-16 sm:h-20 w-auto grayscale group-hover:grayscale-0 transition-all dark:invert drop-shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
        />
      </Link>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-5xl mx-auto pt-24 sm:pt-28 lg:pt-0">
        <h1 className="font-heading font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.03] mb-8 text-white animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 fill-mode-both drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)]">
          {t.hero.title1}{" "}
          <span className="text-white drop-shadow-[0_12px_34px_rgba(0,0,0,0.75)]">
            {t.hero.title2}
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-700 fill-mode-both w-full sm:w-auto">
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
              "w-full sm:w-auto rounded-full transition-all font-semibold tracking-wide h-14 px-10 border-border/20 bg-transparent text-foreground dark:text-white liquid-glass-header hover:scale-105 active:scale-95 text-base shadow-elevated-soft"
            )}
          >
             {t.hero.cta2}
          </Link>
        </div>

      </div>


      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-[30px] h-[50px] rounded-full border-2 border-foreground/30 flex items-start justify-center p-2 liquid-glass">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-[float_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
}
