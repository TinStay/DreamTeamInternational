"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { PartnersSection } from "@/components/partners-section";
import { JourneyItem } from "@/components/ui/scroll-journey";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { homePath, portfolioPath } from "@/lib/routes";
import {
  HERO_EMBED,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_REFERRER_POLICY,
} from "@/lib/youtube-embeds";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Blur / strength of the gradient glow copies behind the hero's glow word (see the headline markup). */
const HERO_GLOW_LAYERS = [
  { blur: "blur-[6px] sm:blur-[8px]", opacity: 0.9 },
  { blur: "blur-[16px] sm:blur-[22px]", opacity: 1 },
  { blur: "blur-[36px] sm:blur-[48px]", opacity: 0.9 },
];

export function HeroSection() {
  const { t, language } = useLanguage();
  // Primary CTA jumps to the quote wizard further down the home page.
  const quoteHref = `${homePath(language)}#quote`;
  const portfolioHref = portfolioPath(language);
  const shouldRenderTitleGap = Boolean(t.hero.titleBefore) && Boolean(t.hero.titleGlow);
  // Space must live OUTSIDE the inline-block spans — leading whitespace inside
  // an inline-block is trimmed by CSS, which glued the words together.
  const shouldRenderAfterGap =
    Boolean(t.hero.titleAfter) && Boolean(t.hero.titleGlow || t.hero.titleBefore);

  return (
    <>
    {/* z-10 lifts the section (and its drop shadow) above the next section's gradient page background. The shadow is
        the page colour of each theme (white / the dark slate #020617), so the hero's solid bottom melts into the page. */}
    <section
      id="hero"
      className="relative z-10 flex min-h-[100svh] flex-col overflow-hidden shadow-[0_28px_60px_-18px_rgba(255,255,255,0.6)] dark:shadow-[0_34px_80px_-20px_rgba(2,6,23,0.9)]"
    >
      {/* Keyword-rich H1 for search engines / AI answer engines; the visual
          headline below is decorative and demoted to a paragraph. */}
      <h1 className="sr-only">{t.hero.seoHeading}</h1>

      {/* Background video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden scale-105">
          <iframe
            className="absolute left-1/2 top-1/2 h-[100svh] w-[177.78svh] min-h-[56.25vw] min-w-[100vw] -translate-x-1/2 -translate-y-1/2 origin-center scale-[1.22] [clip-path:inset(0_0_8%_0)]"
            src={HERO_EMBED.src}
            title={HERO_EMBED.title ?? "YouTube video"}
            allow={YOUTUBE_IFRAME_ALLOW}
            allowFullScreen={false}
            referrerPolicy={YOUTUBE_REFERRER_POLICY}
          />
          {/* Masks residual YouTube center / corner UI after load (cannot be removed from inside the iframe). */}
          <div
            className="pointer-events-none absolute inset-0 z-[0.5] bg-[radial-gradient(ellipse_52%_50%_at_50%_50%,transparent_22%,rgba(0,0,0,0.16)_50%,rgba(0,0,0,0.38)_100%)]"
            aria-hidden
          />
        </div>

        {/* Page-colour wash: solid along the bottom, fading toward the top-right
            (see `.hero-wash` in globals.css). Copy and partner logos sit on it. */}
        <div className="hero-wash pointer-events-none absolute inset-0 z-[2]" aria-hidden />
      </div>

      {/* Copy block - centred, bottom of the viewport, above the partners strip. Journey parts (home): the headline
          is the "title" (leaves first as the page scrolls on), subtitle + CTAs and the partners strip follow. */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-end px-4 pt-28 pb-1 text-center sm:pt-32 sm:pb-2 lg:pb-3">
        <JourneyItem kind="title" className="flex w-full flex-col items-center">
        <motion.p
          className="w-full min-w-0 max-w-4xl font-heading text-[clamp(2.25rem,7.5vw+0.35rem,3rem)] font-extrabold leading-[1.06] tracking-tight text-balance text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.35)] [overflow-wrap:anywhere] break-words sm:text-6xl sm:leading-[1.04] md:text-7xl md:leading-[1.02] lg:text-8xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.55, ease: EASE }}
          >
            {t.hero.titleBefore}
          </motion.span>
          {shouldRenderTitleGap ? " " : null}
          {/* The glow word: white letters over blurred copies of the word in the brand gradient (red → violet) - a
              true gradient glow, which a text-shadow cannot do. Three copies build it up: tight, medium, wide bloom. */}
          <span className="relative inline-block">
            {HERO_GLOW_LAYERS.map((layer, i) => (
              <motion.span
                key={layer.blur}
                className={cn("text-section-accent pointer-events-none absolute inset-0 -z-10 select-none", layer.blur)}
                initial={{ opacity: 0 }}
                animate={{ opacity: layer.opacity }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.9 }}
                aria-hidden
              >
                {t.hero.titleGlow}
              </motion.span>
            ))}
            {t.hero.titleGlow.split("").map((letter, i) => (
              <motion.span
                key={`glow-${i}-${letter}`}
                className="inline-block text-hero-accent"
                initial={{ y: 48, opacity: 0, rotateX: -80 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{
                  delay: 0.12 + i * 0.045,
                  type: "spring",
                  stiffness: 110,
                  damping: 20,
                }}
              >
                {letter === " " ? " " : letter}
              </motion.span>
            ))}
          </span>
          {shouldRenderAfterGap ? " " : null}
          <motion.span
            className="inline-block"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.12 + t.hero.titleGlow.length * 0.045 + 0.08,
              duration: 0.55,
              ease: EASE,
            }}
          >
            {t.hero.titleAfter}
          </motion.span>
        </motion.p>
        </JourneyItem>

        <JourneyItem index={0} from="bottom" className="flex w-full flex-col items-center">
        <motion.p
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.55, ease: EASE }}
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.55, ease: EASE }}
          className="mt-7 flex w-full flex-col items-stretch gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center sm:justify-center"
        >
          {/* The site's main CTA - the projects' arrow-disc pill (dark on the light wash, white on the dark one). */}
          <ButtonWithIcon href={quoteHref} surface="auto" className="w-full sm:w-auto">
            {t.hero.cta1}
          </ButtonWithIcon>

          <Link
            href={portfolioHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "default" }),
              "flex h-12 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold text-foreground shadow-none transition-[transform,background-color] duration-200 hover:scale-[1.02] hover:bg-foreground/5 active:scale-[0.98] sm:w-auto"
            )}
          >
            {t.hero.cta2}
            <IconArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </motion.div>
        </JourneyItem>
      </div>

      {/* Partners strip — bottom of the hero, layered above the video, wash and copy (z-30): two still rows from lg,
          two marquees below (where the bottom padding clears the mobile dock, so both rows show). */}
      <JourneyItem index={1} from="bottom" className="relative z-30">
        <PartnersSection rows={2} layout="static" className="isolate pt-1 pb-[5.5rem] sm:pt-2 md:pt-2 md:pb-[5.5rem] lg:pb-5" />
      </JourneyItem>
    </section>

    {/* Soft hand-off from the hero's solid bottom into the page gradient: the
        fade overlaps the next section's top padding (negative margin). */}
    <div
      aria-hidden
      className="pointer-events-none relative z-[5] -mb-20 h-20 bg-gradient-to-b from-background via-background/60 to-transparent"
    />
    </>
  );
}
