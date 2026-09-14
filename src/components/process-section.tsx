"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useLanguage } from "@/lib/i18n/language-context";
import { JourneyItem, useJourney } from "@/components/ui/scroll-journey";

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

/** Rendered step badges — each artwork already contains its own number (512px WebP, served as-is). */
const STEP_ICONS = [
  "/process/steps_icons/first_step.webp",
  "/process/steps_icons/second_step.webp",
  "/process/steps_icons/third_step.webp",
  "/process/steps_icons/forth_step.webp",
];

/**
 * Desktop connector: a wave through the four badge centres (viewBox units,
 * stretched to the row) that draws itself as the row scrolls in, with a glowing
 * bead riding the tip. The badges sit at 12.5 / 37.5 / 62.5 / 87.5 % of the row.
 */
const WAVE_PATH = "M 40 100 C 90 100, 100 40, 125 100 S 210 190, 250 100 S 340 40, 375 100 S 460 190, 500 100 S 590 40, 625 100 S 710 190, 750 100 S 840 40, 875 100 S 940 150, 985 100";

export function ProcessSection() {
  const { ref, isInView } = useInView();
  const { t } = useLanguage();
  const rowRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const journey = useJourney();

  // Elsewhere: draws while the row travels from the lower part of the viewport to its middle. On the home journey
  // the section is held still while it arrives, so the wave draws over the second half of that hold instead - it
  // reaches the 4th badge before the page can scroll on.
  const { scrollYProgress } = useScroll({ target: rowRef, offset: ["start 90%", "end 60%"] });
  const source = useTransform(
    [scrollYProgress, journey?.travel ?? scrollYProgress],
    ([row, travel]: number[]) => (journey ? Math.min(1, Math.max(0, (travel - 0.45) / 0.5)) : row)
  );
  const progress = useSpring(source, { stiffness: 120, damping: 26, mass: 0.6, restDelta: 0.001 });
  const pathLength = useTransform(progress, (p) => Math.max(0.001, p));
  const beadX = useTransform(progress, (p) => {
    const el = pathRef.current;
    return el ? el.getPointAtLength(p * el.getTotalLength()).x : 0;
  });
  const beadY = useTransform(progress, (p) => {
    const el = pathRef.current;
    return el ? el.getPointAtLength(p * el.getTotalLength()).y : 0;
  });
  // The bead is an HTML dot (an SVG circle would stretch with the non-uniform viewBox).
  const beadLeft = useTransform(beadX, (x) => `${x / 10}%`);
  const beadTop = useTransform(beadY, (y) => `${y / 2}%`);
  const beadOpacity = useTransform(progress, (p) => (p > 0.02 && p < 0.98 ? 1 : 0));
  const lineScale = useTransform(progress, (p) => p);

  return (
    <section id="process" className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 z-10 relative">

        {/* Journey parts (home): heading first, then the four steps from below in turn. */}
        <JourneyItem kind="title">
        <div className={`mb-16 text-center transition-all duration-1000 transform ${isInView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <h2 className="font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl mb-6 text-foreground">
            {t.process.title1}{" "}
            <span className="text-section-accent">{t.process.title2}</span>
          </h2>
          <p className="mx-auto text-muted-foreground text-lg max-w-2xl">
            {t.process.subtitle}
          </p>
        </div>
        </JourneyItem>

        <div ref={rowRef} className="relative mt-16 lg:mt-20">
          {/* Desktop: the wave draws itself through the badge centres (badge = 10rem, centre at 5rem). */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-40 lg:block" aria-hidden>
          <svg className="h-full w-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="process-wave" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--primary-gradient-start)" />
                <stop offset="100%" stopColor="var(--primary-gradient-end)" />
              </linearGradient>
            </defs>
            {/* Faint full track + the drawn part on top. */}
            <path d={WAVE_PATH} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-border/60" vectorEffect="non-scaling-stroke" />
            <motion.path
              ref={pathRef}
              d={WAVE_PATH}
              fill="none"
              stroke="url(#process-wave)"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength }}
            />
          </svg>
          {/* The bead riding the tip of the drawn wave (the same 1000×200 space, as percentages of this box). */}
          <motion.div
            className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-gradient shadow-[0_0_18px_6px_var(--primary-soft-glow)]"
            style={{ left: beadLeft, top: beadTop, opacity: beadOpacity }}
          />
          </div>
          {/* Phones / tablets: a vertical thread growing down behind the stacked steps. */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px origin-top bg-gradient-to-b from-[var(--primary-gradient-start)] via-[var(--primary-gradient-end)] to-transparent lg:hidden"
            style={{ scaleY: lineScale }}
            aria-hidden
          />

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
                  <JourneyItem index={index} from="bottom" className="flex w-full flex-col items-center">
                  {/* Step badge — the artwork carries the number and its own rim/glow. */}
                  <div className="relative mb-6 h-36 w-36 transition-transform duration-300 group-hover:scale-110 lg:h-40 lg:w-40">
                    <Image
                      src={STEP_ICONS[index]}
                      alt={`${index + 1}`}
                      fill
                      sizes="160px"
                      // Small static WebPs straight from /public: the optimizer route stalled on one badge now and then
                      // (the img then waits forever on the coalesced request), so these skip it.
                      unoptimized
                      loading="eager"
                      className="object-contain drop-shadow-[0_16px_30px_rgba(2,6,23,0.35)]"
                    />
                  </div>

                  <h3 className="font-heading font-semibold text-xl mb-3 text-foreground transition-all group-hover:bg-gradient-to-r group-hover:from-[var(--primary-gradient-start)] group-hover:to-[var(--primary-gradient-end)] group-hover:bg-clip-text group-hover:text-transparent">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed px-2">
                    {step.description}
                  </p>
                  </JourneyItem>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
