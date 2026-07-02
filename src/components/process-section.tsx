"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

function useInView(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setIsInView(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export function ProcessSection() {
  const { ref, isInView } = useInView();
  const { t } = useLanguage();

  return (
    <section id="process" className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 z-10 relative">
        
        <div className={`mb-16 transition-all duration-1000 transform ${isInView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6 text-foreground">
            {t.process.title1}{" "}
            <span className="text-section-accent">{t.process.title2}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {t.process.subtitle}
          </p>
        </div>

        <div className="relative mt-20">
          {/* Desktop horizontal connecting line */}
          <div className="hidden lg:block absolute top-[40px] left-[5%] right-[5%] h-px bg-border/50 z-0"></div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-4 relative z-10">
            {t.process.steps.map((step, index) => {
              const delayStr = `${index * 150}ms`;
              return (
                <div 
                  key={index} 
                  className={`flex flex-col items-center text-center relative group w-full lg:w-1/4 transition-all duration-700 ease-out fill-mode-both ${
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  }`}
                  style={{ transitionDelay: delayStr }}
                >
                  {/* Step Number Circle */}
                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary liquid-glass shadow-[0_0_15px_rgba(255,255,255,0.1),0_0_28px_var(--primary-soft-glow)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.35),0_0_36px_var(--primary-soft-glow)]">
                    <span className="font-heading text-3xl font-bold text-section-accent">
                      {index + 1}
                    </span>
                    {/* Glowing dot */}
                    <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-primary shadow-[0_0_12px_var(--primary-soft-glow)]" />
                  </div>

                  <h3 className="font-heading font-semibold text-xl mb-3 text-foreground transition-all group-hover:bg-gradient-to-r group-hover:from-[var(--primary-gradient-start)] group-hover:to-[var(--primary-gradient-end)] group-hover:bg-clip-text group-hover:text-transparent">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed px-2">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
