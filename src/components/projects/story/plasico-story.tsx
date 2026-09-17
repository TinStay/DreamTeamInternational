"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { EmbedCover } from "@/components/projects/showcase-primitives";
import { bunnyBackgroundEmbedSrc } from "@/lib/bunny-stream";
import { BodyXL, ClientSite, CtaBand, Eyebrow, HERO_TITLE, MediaFrame, STORY_CONTAINER, Section, StoryShell, VIEWPORT, Words, fadeUp, frameIn, stagger } from "./primitives";

/*
 * Plasico's story - the store's world from the home showcase: white, the
 * Plasico green and faint diagonal pinstripes - told in big, short titles
 * (they are what gets read) over large type: the hero, the brief, the three
 * ads in the order they were made (each a title + a couple of lines + a
 * full-width frame), how the two teams work together, and the CTA. Every
 * block reveals once on the way down. Copy in `projects.stories.plasico`;
 * the clips in `Project.story.clips` (all three on Bunny Stream; the second
 * ad is the vertical cut, so it gets a 9:16 frame).
 */

const PLASICO = { green: "#1FA22A", lime: "#5FBF2F", soft: "#EAF6E6" };
/**
 * The three ads' clips (`Project.story.clips`) and frames - the second is the vertical "Back to School" cut, laid
 * out beside its copy (title + text left, the 9:16 frame right) rather than under it.
 */
const ADS = [
  { key: "first", aspect: "aspect-video", beside: false },
  { key: "second", aspect: "aspect-[9/16]", beside: true },
  { key: "third", aspect: "aspect-video", beside: false },
] as const;

/** A short title, big. */
const TITLE = cn("font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl xl:text-7xl", PROJECT_DISPLAY_FONT.plasico, "leading-[1.04]");

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
      display={PROJECT_DISPLAY_FONT.plasico}
      className="[--story-ground:#F3FAF1] dark:[--story-ground:#0B1810]"
      ground={
        // White with a hint of green / a deep green, faint pinstripes + a soft green bloom, as on the showcase scene.
        <div className="absolute inset-0 overflow-hidden bg-[var(--story-ground)]" aria-hidden>
          <div className="absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(-32deg,#1FA22A_0_1px,transparent_1px_26px)]" />
          <div
            className="absolute left-[70%] top-[18%] aspect-square w-[min(720px,60vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[24px]"
            style={{ background: "radial-gradient(closest-side, rgba(95,191,47,0.28) 0%, rgba(95,191,47,0.1) 45%, transparent 100%)" }}
          />
        </div>
      }
    >
      {/* ---------------- HERO: the title across the page, the lead under it, then the film beside the mark ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div initial="hidden" animate="visible" variants={stagger(0.08, 0.1)}>
          {/* A step under the short scale on desktop - the uppercase Exo 2 reads loud enough at 3.75–4.4rem. */}
          <h1 className={cn("text-[clamp(2.5rem,1.25rem+2.6vw,5rem)] font-heading font-bold tracking-tight text-balance", PROJECT_DISPLAY_FONT.plasico, "leading-[0.98]")}>
            <Words text={story.hero.title} base={0.05} step={0.04} />
          </h1>
          <motion.p variants={fadeUp} className="mt-8 max-w-[60ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl">
            {story.hero.lead}
          </motion.p>
          <div className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <motion.div variants={frameIn} className="relative w-full">
              {/* The glow behind the frame - a radial, no blur filter. */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "radial-gradient(closest-side, rgba(95,191,47,0.36) 0%, rgba(31,162,42,0.14) 45%, transparent 100%)" }}
                aria-hidden
              />
              {/* The first ad, muted and looping, cover-fit in a rounded 16:9 frame; the full players follow below. */}
              <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-[#1FA22A]/25 bg-[#0F2318] shadow-[0_40px_100px_-20px_rgba(31,162,42,0.45)] dark:border-[#5FBF2F]/25">
                {clips.first && "bunny" in clips.first ? (
                  <EmbedCover src={bunnyBackgroundEmbedSrc(clips.first.bunny)} orientation="wide" boxAspect={16 / 9} />
                ) : null}
              </div>
            </motion.div>
            {partner ? (
              // The client's mark beside the film (under it on phones), on a soft green light.
              <motion.div variants={fadeUp} className="relative flex items-center justify-center py-6 lg:py-0">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: "radial-gradient(closest-side, rgba(95,191,47,0.22) 0%, transparent 100%)" }}
                  aria-hidden
                />
                <ClientSite href={partner.href} name={name} className="relative">
                  <PartnerLogo p={partner} imgClass="relative h-24 w-auto max-w-full md:h-28 xl:h-36" sizes="440px" />
                </ClientSite>
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      </Section>

      {/* ---------------- THE BRIEF ---------------- */}
      <Section tight className="pt-6 sm:pt-8 lg:pt-10">
        <motion.div
          className="grid gap-8 border-t border-[var(--story-line)] pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20 lg:pt-14"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.challenge.eyebrow}</Eyebrow>
            <h2 className={TITLE}>
              <Words text={story.challenge.title} />
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} className="lg:pt-10">
            <BodyXL paragraphs={story.challenge.body} />
          </motion.div>
        </motion.div>
      </Section>

      {/* ---------------- THE THREE ADS ---------------- */}
      {story.ads.map((ad, i) => {
        const spec = ADS[i] ?? ADS[0];
        const frame = (
          <MediaFrame
            clip={clips[spec.key] ?? null}
            title={`${name} · ${ad.title}`}
            aspect={spec.aspect}
            placeholder={story.placeholder}
            className="rounded-3xl shadow-[0_50px_120px_rgba(31,162,42,0.22)]"
            placeholderClass="text-[#1FA22A] [background:linear-gradient(135deg,#EAF6E6,#d6efd0)]"
            ringClass="border-[#1FA22A]/50 bg-white/40 text-[#1FA22A]"
          />
        );
        return (
          <Section key={ad.title} className={cn(i === 0 ? "pt-4 sm:pt-6 lg:pt-10" : "pt-0 sm:pt-0 lg:pt-0")}>
            {spec.beside ? (
              // The vertical cut: copy on the left, the 9:16 frame on the right.
              <motion.div
                className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20"
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                variants={stagger(0.12)}
              >
                <motion.div variants={fadeUp}>
                  <Eyebrow>{ad.eyebrow}</Eyebrow>
                  <h2 className={cn(TITLE, "max-w-[16ch]")}>
                    <Words text={ad.title} />
                  </h2>
                  <div className="mt-8">
                    <BodyXL paragraphs={ad.body} />
                  </div>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--story-accent)]">{ad.note}</p>
                </motion.div>
                <motion.div variants={frameIn} className="mx-auto w-full max-w-[400px]">
                  {frame}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.12)}>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-20">
                  <motion.div variants={fadeUp}>
                    <Eyebrow>{ad.eyebrow}</Eyebrow>
                    <h2 className={cn(TITLE, "max-w-[16ch]")}>
                      <Words text={ad.title} />
                    </h2>
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <BodyXL paragraphs={ad.body} />
                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--story-accent)]">{ad.note}</p>
                  </motion.div>
                </div>
                <motion.div variants={frameIn} className="mt-12 lg:mt-16">
                  {frame}
                </motion.div>
              </motion.div>
            )}
          </Section>
        );
      })}

      {/* ---------------- HOW WE WORK (a full-bleed green band) ---------------- */}
      <section className="relative isolate py-16 text-white [--story-accent:rgba(255,255,255,0.85)] [--story-muted:rgba(255,255,255,0.82)] [--story-line:rgba(255,255,255,0.25)] sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-[1]" style={{ background: `linear-gradient(120deg, ${PLASICO.green}, ${PLASICO.lime})` }} aria-hidden />
        <div className="absolute inset-0 -z-[1] opacity-[0.12] [background-image:repeating-linear-gradient(-32deg,#fff_0_1px,transparent_1px_22px)]" aria-hidden />
        <motion.div
          className={cn("grid gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20 lg:py-10", STORY_CONTAINER)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.method.eyebrow}</Eyebrow>
            <h2 className={cn(TITLE, "max-w-[14ch]")}>
              <Words text={story.method.title} />
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <BodyXL paragraphs={story.method.body} />
            <motion.ol className="mt-10 grid gap-4 sm:grid-cols-3" variants={stagger(0.1, 0.2)}>
              {story.method.points.map((point, i) => (
                <motion.li
                  key={point}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <span className="mb-4 block font-heading text-4xl font-light leading-none text-white/70">{String(i + 1).padStart(2, "0")}</span>
                  <span className="block text-lg font-semibold leading-snug xl:text-xl">{point}</span>
                </motion.li>
              ))}
            </motion.ol>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <Section tight>
        {/* Plasico's green card: the green → lime gradient, the pinstripes and a white light, as on its world. */}
        <CtaBand
          title={story.cta.title}
          quote={story.cta.quote}
          contact={story.cta.contact}
          tone="dark"
          className="rounded-3xl p-8 text-white shadow-[0_30px_90px_-30px_rgba(31,162,42,0.6)] sm:p-12 lg:p-14"
        >
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${PLASICO.green}, ${PLASICO.lime})` }} aria-hidden />
          <div className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(-32deg,#fff_0_1px,transparent_1px_22px)]" aria-hidden />
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.3),transparent)]" aria-hidden />
        </CtaBand>
      </Section>
    </StoryShell>
  );
}
