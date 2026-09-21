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
/**
 * Phones / tablets: the steps stack, so the connector is an S-curve down the
 * column (100 × 1000 viewBox, stretched), bowing out to one side between one
 * badge and the next (badge centres ≈ 5.5 / 30.5 / 55.5 / 80.5 % of the
 * column) - drawn as the steps scroll up the screen.
 */
const CURVE_PATH = "M 50 20 C 96 120, 4 210, 50 305 S 96 470, 50 555 S 4 720, 50 805 S 70 900, 50 990";

export function ProcessSection() {
  const { ref, isInView } = useInView();
  const { t } = useLanguage();
  const rowRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const journey = useJourney();

  // Elsewhere: draws while the row travels from the lower part of the viewport to its middle. On the home journey
  // the section eases up into place while it arrives, so the wave draws over the second half of that arrival
  // instead - it reaches the 4th badge as the scene is released to scroll on.
  const { scrollYProgress } = useScroll({ target: rowRef, offset: ["start 90%", "end 60%"] });
  const source = useTransform(
    [scrollYProgress, journey?.travel ?? scrollYProgress],
    ([row, travel]: number[]) => (journey ? Math.min(1, Math.max(0, (travel - 0.45) / 0.5)) : row)
  );
  const progress = useSpring(source, { stiffness: 120, damping: 26, mass: 0.6, restDelta: 0.001 });
  const pathLength = useTransform(progress, (p) => Math.max(0.001, p));
  // The paths are static: their lengths are measured once (a `getTotalLength` per frame was a forced SVG layout).
  const lengths = useRef(new WeakMap<SVGPathElement, number>());
  const along = (el: SVGPathElement, p: number) => {
    let total = lengths.current.get(el);
    if (total === undefined) {
      total = el.getTotalLength();
      lengths.current.set(el, total);
    }
    return el.getPointAtLength(p * total);
  };
  const beadX = useTransform(progress, (p) => {
    const el = pathRef.current;
    return el ? along(el, p).x : 0;
  });
  const beadY = useTransform(progress, (p) => {
    const el = pathRef.current;
    return el ? along(el, p).y : 0;
  });
  // The bead is an HTML dot (an SVG circle would stretch with the non-uniform viewBox).
  const beadLeft = useTransform(beadX, (x) => `${x / 10}%`);
  const beadTop = useTransform(beadY, (y) => `${y / 2}%`);
  const beadOpacity = useTransform(progress, (p) => (p > 0.02 && p < 0.98 ? 1 : 0));

  // Phones / tablets: the curve follows the steps as they scroll up - 0 with the column's top three quarters down
  // the viewport, 1 once its bottom is most of the way up (the same whether on the home journey or not).
  const curveRef = useRef<SVGPathElement>(null);
  const { scrollYProgress: columnProgress } = useScroll({ target: rowRef, offset: ["start 75%", "end 82%"] });
  const curve = useSpring(columnProgress, { stiffness: 120, damping: 26, mass: 0.6, restDelta: 0.001 });
  const curveLength = useTransform(curve, (p) => Math.max(0.001, p));
  const curveBeadLeft = useTransform(curve, (p) => {
    const el = curveRef.current;
    return el ? `${along(el, p).x}%` : "50%";
  });
  const curveBeadTop = useTransform(curve, (p) => {
    const el = curveRef.current;
    return el ? `${along(el, p).y / 10}%` : "0%";
  });
  const curveBeadOpacity = useTransform(curve, (p) => (p > 0.02 && p < 0.98 ? 1 : 0));

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
          {/* Phones / tablets: the S-curve behind the stacked steps, drawing as they scroll up, a bead on its tip. */}
          <div className="pointer-events-none absolute inset-0 z-0 lg:hidden" aria-hidden>
            <svg className="h-full w-full" viewBox="0 0 100 1000" preserveAspectRatio="none">
              <defs>
                <linearGradient id="process-curve" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-gradient-start)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--primary-gradient-end)" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              {/* Faint full track + the drawn part on top, both in a subtle wash of the brand colours. */}
              <path d={CURVE_PATH} fill="none" stroke="currentColor" strokeWidth="1" className="text-border/50" vectorEffect="non-scaling-stroke" />
              <motion.path
                ref={curveRef}
                d={CURVE_PATH}
                fill="none"
                stroke="url(#process-curve)"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ pathLength: curveLength }}
              />
            </svg>
            <motion.div
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-gradient opacity-80 shadow-[0_0_14px_4px_var(--primary-soft-glow)]"
              style={{ left: curveBeadLeft, top: curveBeadTop, opacity: curveBeadOpacity }}
            />
          </div>

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
                      // (the img then waits forever on the coalesced request), so these skip it - and, off the
                      // optimizer, load lazily like any image far below the fold.
                      unoptimized
                      loading="lazy"
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
