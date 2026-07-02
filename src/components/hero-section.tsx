"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { IconMailFilled, IconVideoFilled } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import HeroDecorativePaths from "@/components/ui/modern-background-paths";
import { GlassShell } from "@/components/ui/glass-shell";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { contactProcessPath, homePath } from "@/lib/routes";
import {
  HERO_EMBED,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_REFERRER_POLICY,
} from "@/lib/youtube-embeds";

export function HeroSection() {
  const { t, language } = useLanguage();
  const contactHref = contactProcessPath(language);
  const portfolioHref = `${homePath(language)}#portfolio`;
  const shouldRenderTitleGap = Boolean(t.hero.titleBefore) && Boolean(t.hero.titleGlow);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
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

        <HeroDecorativePaths />

        <div className="absolute inset-0 z-[2] transition-opacity duration-700 bg-[radial-gradient(1200px_700px_at_50%_30%,rgba(0,0,0,0.14),transparent_58%),radial-gradient(900px_600px_at_0%_0%,rgba(0,0,0,0.32),transparent_58%),radial-gradient(900px_600px_at_100%_0%,rgba(0,0,0,0.32),transparent_58%),radial-gradient(900px_600px_at_0%_100%,rgba(0,0,0,0.26),transparent_62%),radial-gradient(900px_600px_at_100%_100%,rgba(0,0,0,0.26),transparent_62%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-21 bg-gradient-to-t from-background via-background/15 to-transparent sm:h-36 dark:from-background dark:via-background/85" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-white/25 via-white/0 to-transparent sm:h-32 dark:from-white/[0.07] dark:via-white/[0.02]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16" aria-hidden />
      </div>

      <div className="relative z-20 mx-auto mt-24 flex w-full max-w-5xl flex-col items-center justify-center px-4 pb-8 text-center sm:mt-28 sm:pb-10 lg:mt-0 lg:pb-0">
        <motion.p
          className="mb-8 w-full min-w-0 max-w-full px-1 font-heading text-[clamp(1.75rem,6.2vw+0.35rem,2.25rem)] font-extrabold leading-[1.08] tracking-tight text-balance text-white [overflow-wrap:anywhere] break-words sm:mb-10 sm:text-5xl sm:leading-[1.06] md:text-6xl md:leading-[1.03] lg:text-7xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.hero.titleBefore}
          </motion.span>
          {shouldRenderTitleGap ? " " : null}
          <span className="inline-block">
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
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </span>
          <motion.span
            className="inline-block"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.12 + t.hero.titleGlow.length * 0.045 + 0.08,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {t.hero.titleAfter}
          </motion.span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-full justify-center sm:max-w-none"
        >
          <GlassShell className="w-full max-w-full p-2 sm:w-fit sm:max-w-none sm:p-2">
            <div className="flex w-full flex-col items-stretch gap-2  sm:w-auto sm:flex-row sm:items-center sm:justify-center">
              <motion.div
                className="w-full sm:w-auto"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.58, type: "spring", stiffness: 120, damping: 18 }}
              >
                <Link
                  href={contactHref}
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "flex h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:min-w-[9.5rem]"
                  )}
                >
                  <IconMailFilled className="h-4 w-4 shrink-0" aria-hidden />
                  {t.hero.cta1}
                </Link>
              </motion.div>

              <Link
                href={portfolioHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "flex h-11 w-full items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-5 text-sm font-semibold text-foreground shadow-none backdrop-blur-none transition-[transform,background-color] duration-200 hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98] dark:border dark:border-white/15 dark:bg-white/10 dark:text-white dark:shadow-elevated-soft dark:backdrop-blur-sm sm:w-auto"
                )}
              >
                <IconVideoFilled className="h-4 w-4 shrink-0" aria-hidden />
                {t.hero.cta2}
              </Link>
            </div>
          </GlassShell>
        </motion.div>
      </div>
    </section>
  );
}
