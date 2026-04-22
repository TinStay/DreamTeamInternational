"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [options]);

  return { ref, isInView };
}

export function ProcessSection() {
  const { ref, isInView } = useInView();
  const { t } = useLanguage();

  return (
    <section id="process" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 z-10 relative">
        
        <div className={`text-center mb-16 transition-all duration-1000 transform ${isInView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-foreground">
            {t.process.title1} <span className="text-primary">{t.process.title2}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
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
                  <div className="w-20 h-20 rounded-full liquid-glass border border-primary flex items-center justify-center mb-6 relative shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-all duration-300">
                    <span className="font-heading font-bold text-3xl text-foreground group-hover:text-primary transition-colors">
                      {index + 1}
                    </span>
                    {/* Glowing dot */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse shadow-sm" />
                  </div>

                  <h3 className="font-heading font-semibold text-xl mb-3 text-foreground group-hover:text-primary transition-colors">
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
