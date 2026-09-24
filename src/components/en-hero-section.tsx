"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { JourneyItem } from "@/components/ui/scroll-journey";
import { TigerReveal } from "@/components/hero-tiger/tiger-reveal";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { TigerLogos } from "@/components/hero-tiger/tiger-logos";
import { cn } from "@/lib/utils";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import { useLanguage } from "@/lib/i18n/language-context";
import { contactProcessPath, homePath } from "@/lib/routes";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The English home page's hero (`en-home-page.tsx`; `/bg` keeps `hero-section.tsx`): the tiger reveal in place of the
 * film (`hero-tiger/tiger-reveal.tsx`), the headline and line low in the frame under the eyes, the amber "Let's talk"
 * pill (the contact page) beside "View our work" (the projects stage), and the client's "Trusted by" logo marquee along
 * the bottom. The site header floats over it as everywhere. Always dark - it is a night scene in either theme.
 * Journey parts (home): the headline leaves first as the page scrolls on, the line + CTAs and the logos follow.
 */
export function EnHeroSection() {
  const { t, language } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const onScreen = useInView(ref, { initial: true });
  const [awake, setAwake] = useState(false);
  const title = [t.hero.titleBefore, t.hero.titleGlow, t.hero.titleAfter].filter(Boolean).join(" ");

  return (
    <>
      <section
        id="hero"
        ref={ref}
        className="relative isolate z-10 flex min-h-[100svh] flex-col overflow-hidden bg-black text-white"
        data-offstage={onScreen ? undefined : ""}
      >
        {/* Keyword-rich H1 for search engines / AI answer engines; the visual headline below is a paragraph. */}
        <h1 className="sr-only">{t.hero.seoHeading}</h1>

        <TigerReveal areaRef={ref} onWake={() => setAwake(true)} />
        {/* Readability gradient under the copy only. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.35)_38%,rgba(0,0,0,0)_60%)]"
          aria-hidden
        />

        <p
          className={cn(
            "pointer-events-none absolute top-[clamp(90px,14vh,140px)] left-1/2 -translate-x-1/2 text-[13px] tracking-[0.02em] text-white/45 transition-opacity duration-700 max-lg:top-[clamp(110px,16vh,150px)]",
            awake && "opacity-0"
          )}
        >
          {t.hero.tiger.hint}
        </p>

        <div className="mt-auto flex flex-col items-center px-6 pt-32 pb-[clamp(28px,5vh,56px)] text-center">
          <JourneyItem kind="title" className="flex w-full flex-col items-center">
            <motion.p
              className={cn(
                "max-w-[20ch] font-heading text-[clamp(36px,5.6vw,92px)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-balance",
                PROJECT_DISPLAY_FONT.plasico
              )}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: EASE }}
            >
              {title}
            </motion.p>
          </JourneyItem>

          <JourneyItem index={0} from="bottom" className="flex w-full flex-col items-center">
            <motion.p
              className="mt-[22px] max-w-[46ch] text-[clamp(16px,1.35vw,20px)] leading-normal text-white/70"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
            >
              {t.hero.subtitle}
            </motion.p>
            <motion.div
              className="mt-[30px] flex flex-wrap items-center justify-center gap-[30px]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.55, ease: EASE }}
            >
              <TigerCta href={contactProcessPath(language)} label={t.hero.tiger.cta} />
              <Link
                href={`${homePath(language)}#projects`}
                className="cursor-pointer text-base font-medium text-white underline-offset-4 transition-transform duration-200 ease-out hover:-translate-y-px hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2b33d]"
              >
                {t.hero.cta2}
              </Link>
            </motion.div>
          </JourneyItem>
        </div>

        <JourneyItem index={1} from="bottom" className="relative">
          <TigerLogos label={t.hero.tiger.trustedBy} />
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
