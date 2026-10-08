"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { JourneyItem } from "@/components/ui/scroll-journey";
import { TigerReveal } from "@/components/hero-tiger/tiger-reveal";
import { TigerLogos } from "@/components/hero-tiger/tiger-logos";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { portfolioPath } from "@/lib/routes";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The English home page's hero (`en-home-page.tsx`; `/bg` keeps `hero-section.tsx`): the tiger reveal in place of the
 * film (`hero-tiger/tiger-reveal.tsx`), "On a mission" low in the frame under the eyes, the mission and a "Still not
 * convinced?" nudge under it, a "View our work" pill
 * (the case studies), and the client's "Trusted by" logo marquee along
 * the bottom. The site header floats over it as everywhere. Always dark - it is a night scene in either theme.
 * Journey parts (home): the headline leaves first as the page scrolls on, the line + CTAs and the logos follow.
 */
export function EnHeroSection() {
  const { t, language } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const onScreen = useInView(ref, { initial: true });
  const [awake, setAwake] = useState(false);

  return (
    <>
      <section
        id="hero"
        ref={ref}
        className="relative isolate z-10 flex min-h-[78svh] flex-col overflow-hidden text-white"
        data-offstage={onScreen ? undefined : ""}
      >
        {/* Keyword-rich H1 for search engines / AI answer engines; the visual headline below is a paragraph. */}
        <h1 className="sr-only">{t.hero.seoHeading}</h1>

        {/* The tiger's black ground, faded in over the first stretch of the hero (a mask), so the page's space from the
            section above flows into it - no hard edge between the two. */}
        <div className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent_0,#000_clamp(120px,18vh,200px))]">
          <div className="absolute inset-0 -z-40 bg-black" />
          <TigerReveal areaRef={ref} onWake={() => setAwake(true)} />
        </div>
        {/* Readability gradient under the copy only. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.35)_38%,rgba(0,0,0,0)_60%)]"
          aria-hidden
        />

        <p
          className={cn(
            "pointer-events-none absolute top-[clamp(40px,7vh,72px)] left-1/2 -translate-x-1/2 text-[13px] tracking-[0.02em] text-white/45 transition-opacity duration-700",
            awake && "opacity-0"
          )}
        >
          {t.hero.tiger.hint}
        </p>

        {/* The copy low in the frame, under the eyes: left-aligned on the page's side margin (the video pack's) and spread
            across the hero's width - centred on phones. */}
        <div className="mt-auto flex flex-col items-center px-[max(1.25rem,3vw)] pt-24 pb-[clamp(28px,5vh,56px)] text-center sm:items-start sm:text-left">
          <JourneyItem kind="title" className="flex w-full flex-col items-center sm:items-start">
            <motion.p
              // Archivo expanded, black - the English site's heading face (`html.site-deep .font-heading`).
              className="max-w-[20ch] font-heading text-[clamp(44px,6vw,104px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: EASE }}
            >
              {t.hero.mission.title}
            </motion.p>
          </JourneyItem>

          <JourneyItem index={0} from="bottom" className="flex w-full flex-col items-center sm:items-start">
            {/* The mission, then a nudge into the work. */}
            <motion.p
              className="mt-6 max-w-[96ch] text-[clamp(16px,1.3vw,21px)] leading-relaxed text-white/80"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
            >
              {t.hero.mission.text}
            </motion.p>
            <motion.p
              className="mt-5 text-[clamp(17px,1.4vw,22px)] font-semibold text-white"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55, ease: EASE }}
            >
              {t.hero.mission.nudge}
            </motion.p>
            <motion.div
              className="mt-6 flex flex-wrap items-center justify-center gap-[30px] sm:justify-start"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.55, ease: EASE }}
            >
              <Link
                href={portfolioPath(language)}
                // The hero's one button now (the "Let's talk" pill moved out - Sign up lives in the header): a glass
                // outline pill that lifts and brightens on hover.
                className="inline-flex h-[54px] cursor-pointer items-center rounded-full border border-white/35 bg-white/[0.06] px-8 text-base font-semibold text-white backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff6a14]"
              >
                {t.hero.cta2}
              </Link>
            </motion.div>
          </JourneyItem>
        </div>

        <JourneyItem index={1} from="bottom" className="relative">
          <TigerLogos label={t.hero.tiger.trustedBy} regions={t.hero.tiger.regions} />
        </JourneyItem>
      </section>

      {/* Soft hand-off from the hero's black bottom into the page ground (overlaps the next section's top padding). */}
      <div
        aria-hidden
        className="pointer-events-none relative z-[5] -mb-20 h-20 bg-gradient-to-b from-black via-black/40 to-transparent"
      />
    </>
  );
}
