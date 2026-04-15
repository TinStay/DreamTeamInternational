"use client";

import { useTheme } from "next-themes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

export function HeroSection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <section id="hero" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
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
        
        Dynamic Overlay
        <div className={`absolute inset-0 transition-colors duration-1000 ${
          isDark 
            ? "bg-gradient-to-b from-black/80 via-black/5 to-background" 
            : "bg-gradient-to-b from-white/20 via-white/5 to-background"
        }`} />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-16 md:mt-0 pb-32">
        <Link href="/" className="lg:hidden mb-8 group shrink-0">
          <img src="/logo-1.png" alt="DreamTeam Technology" className="h-10 w-auto grayscale group-hover:grayscale-0 transition-all dark:invert" />
        </Link>
        
        <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6 text-foreground animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 fill-mode-both mt-4 md:mt-0">
          {t.hero.title1} <span className="text-primary drop-shadow-sm">{t.hero.title2}</span>
        </h1>

        <p className="text-base md:text-xl text-foreground/70 font-medium max-w-2xl mx-auto mb-10 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500 fill-mode-both leading-relaxed">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-700 fill-mode-both w-full sm:w-auto">
          <Link 
            href="#order-form" 
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold tracking-wide h-12 px-8 shadow-lg hover:scale-105 active:scale-95 text-sm"
            )}
          >
            {t.hero.cta1}
          </Link>
          <Link 
            href="#portfolio" 
            className={cn(
               buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto rounded-full transition-all font-semibold tracking-wide h-12 px-8 border-border/50 bg-background/20 backdrop-blur-md hover:bg-background/40 hover:scale-105 active:scale-95 text-sm text-foreground"
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
