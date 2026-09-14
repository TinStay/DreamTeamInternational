"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { BodyXL, CtaBand, Display, Eyebrow, MediaFrame, Section, StoryShell, VIEWPORT, Words, fadeUp, stagger } from "./primitives";

/*
 * Plasico's story - the store's world from the home showcase: white, the
 * Plasico green and faint diagonal pinstripes. A short page: the hero, then
 * two films, each a title + description + frame that reveal on the way down,
 * and the CTA. Copy in `projects.stories.plasico`; the clips in
 * `Project.story.clips` (`film` on Bunny Stream, `second` on YouTube).
 */

const PLASICO = { green: "#1FA22A", lime: "#5FBF2F", soft: "#EAF6E6" };
const CLIP_KEYS = ["film", "second"] as const;

export function PlasicoStory({ project }: { project: Project }) {
  const { t } = useLanguage();
  const story = t.projects.stories.plasico;
  const name = t.projects.items[project.id].name;
  const partner = PARTNERS.find((p) => p.id === project.partnerId);
  const clips = project.story?.clips ?? {};
  const style = {
    "--story-accent": PLASICO.green,
    "--story-muted": "var(--muted-foreground)",
    "--story-line": "color-mix(in srgb, var(--foreground) 14%, transparent)",
    "--story-rule": PLASICO.green,
  } as CSSProperties;

  return (
    <StoryShell
      style={style}
      accent={PLASICO.green}
      ground={
        // Faint pinstripes + a soft green bloom, as on the showcase scene.
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(-32deg,#1FA22A_0_1px,transparent_1px_26px)]" />
          <div
            className="absolute left-[70%] top-[18%] aspect-square w-[min(720px,60vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[24px]"
            style={{ background: "radial-gradient(closest-side, rgba(95,191,47,0.28) 0%, rgba(95,191,47,0.1) 45%, transparent 100%)" }}
          />
        </div>
      }
    >
      {/* ---------------- HERO ---------------- */}
      <Section tight className="pt-4 sm:pt-6 lg:pt-8">
        <motion.div className="max-w-4xl" initial="hidden" animate="visible" variants={stagger(0.08, 0.1)}>
          {partner ? (
            <motion.div variants={fadeUp} className="mb-8">
              <PartnerLogo p={partner} imgClass="h-12 w-auto md:h-16" sizes="220px" />
            </motion.div>
          ) : null}
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.hero.eyebrow}</Eyebrow>
          </motion.div>
          <h1 className="font-heading text-[clamp(2.5rem,5.6vw,5rem)] font-bold leading-[1.04] tracking-tight text-balance">
            <Words text={story.hero.title} base={0.1} step={0.05} />
          </h1>
          <motion.p variants={fadeUp} className="mt-7 max-w-[46ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl">
            {story.hero.lead}
          </motion.p>
        </motion.div>
      </Section>

      {/* ---------------- THE TWO FILMS ---------------- */}
      {story.films.map((film, i) => {
        const flip = i % 2 === 1;
        return (
          <Section key={film.title} className={cn(i === 0 ? "pt-8 sm:pt-10 lg:pt-14" : "pt-0 sm:pt-0 lg:pt-0")}>
            <motion.div
              className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={stagger(0.12)}
            >
              <motion.div variants={fadeUp} className={cn(flip && "lg:order-2")}>
                <Eyebrow>{film.eyebrow}</Eyebrow>
                <Display text={film.title} className="text-3xl sm:text-4xl lg:text-[2.75rem]" />
                <div className="mt-6">
                  <BodyXL paragraphs={film.body} />
                </div>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--story-muted)]">{film.note}</p>
              </motion.div>
              <motion.div variants={fadeUp} className={cn(flip && "lg:order-1")}>
                <MediaFrame
                  clip={clips[CLIP_KEYS[i] ?? "film"] ?? null}
                  title={`${name} · ${film.title}`}
                  aspect="aspect-video"
                  placeholder={story.placeholder}
                  className="rounded-2xl shadow-[0_40px_100px_rgba(31,162,42,0.22)]"
                  placeholderClass="text-[#1FA22A] [background:linear-gradient(135deg,#EAF6E6,#d6efd0)]"
                  ringClass="border-[#1FA22A]/50 bg-white/40 text-[#1FA22A]"
                />
              </motion.div>
            </motion.div>
          </Section>
        );
      })}

      {/* ---------------- CTA ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        {/* Plasico green card. */}
        <CtaBand
          title={story.cta.title}
          quote={story.cta.quote}
          contact={story.cta.contact}
          tone="dark"
          className="isolate overflow-hidden rounded-3xl p-8 text-white sm:p-12"
        >
          <div className="absolute inset-0 -z-[1]" style={{ background: `linear-gradient(120deg, ${PLASICO.green}, ${PLASICO.lime})` }} aria-hidden />
        </CtaBand>
      </Section>
    </StoryShell>
  );
}
