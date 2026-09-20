"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { BodyXL, ClientSite, CtaBand, Eyebrow, MediaFrame, STORY_CONTAINER, Section, StoryShell, VIEWPORT, Words, fadeUp, frameIn, stagger } from "./primitives";

/*
 * Plasico's story - the store's world from the home showcase: white, the
 * Plasico green and faint diagonal pinstripes - told in big, short titles
 * (they are what gets read) over large type: the hero (the big title and the
 * lead on the left, the client's mark large on the right), the brief, the three
 * ads (the two wide ones a title, a couple of lines and then a full-width
 * frame; the vertical one beside its copy), how the two teams work together,
 * and the CTA. Every
 * block reveals once on the way down. Copy in `projects.stories.plasico`;
 * the clips in `Project.story.clips` (all three on Bunny Stream; the third
 * ad is the vertical cut, so it gets a 9:16 frame beside its copy).
 */

const PLASICO = { green: "#1FA22A", lime: "#5FBF2F", soft: "#EAF6E6" };
/** The green band and the CTA card at the foot of the page: the brand gradient a shade darker (the client's ask). */
const BAND = "linear-gradient(120deg, #1A8E25, #52AC28)";
/**
 * The three ads' clips (`Project.story.clips`) and frames, in the client's order: the office spot, then "Back to
 * Work" (the hero's film) - both full-width 16:9 -, then the vertical "Back to School" cut, laid out beside its
 * copy (title + text left, the 9:16 frame right) rather than under it.
 */
const ADS = [
  { key: "office", aspect: "aspect-video", beside: false },
  { key: "backToWork", aspect: "aspect-video", beside: false },
  { key: "backToSchool", aspect: "aspect-[9/16]", beside: true },
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
      {/* ---------------- HERO: the big title and the lead on the left, the client's mark large on the right ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div
          className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 xl:gap-24"
          initial="hidden"
          animate="visible"
          variants={stagger(0.08, 0.1)}
        >
          {partner ? (
            // The client's mark (the link to its site): on top on phones, big on the right from lg.
            <motion.div variants={fadeUp} className="lg:order-2 lg:justify-self-end">
              <ClientSite href={partner.href} name={name} className="block w-full md:inline-block md:w-auto">
                <PartnerLogo p={partner} imgClass="h-auto w-full md:h-32 md:w-auto lg:h-40 xl:h-48 2xl:h-56" sizes="(max-width: 767px) 100vw, 640px" />
              </ClientSite>
            </motion.div>
          ) : null}
          <div className="min-w-0 lg:order-1">
            {/* The short scale, a touch under it at the top end - the uppercase Exo 2 reads loud enough. */}
            <h1 className={cn("text-[clamp(2.75rem,1.25rem+2.8vw,5rem)] font-heading font-bold tracking-tight text-balance", PROJECT_DISPLAY_FONT.plasico, "leading-[0.98]")}>
              <Words text={story.hero.title} base={0.05} step={0.04} />
            </h1>
            <motion.p variants={fadeUp} className="mt-4 max-w-[52ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl lg:mt-5 xl:text-2xl">
              {story.hero.lead}
            </motion.p>
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
              // The wide cuts: the title, the description under it, then the film across the page.
              <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.12)}>
                <motion.div variants={fadeUp}>
                  <Eyebrow>{ad.eyebrow}</Eyebrow>
                  <h2 className={TITLE}>
                    <Words text={ad.title} />
                  </h2>
                </motion.div>
                <motion.div variants={fadeUp} className="mt-8 lg:max-w-[60%]">
                  <BodyXL paragraphs={ad.body} />
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--story-accent)]">{ad.note}</p>
                </motion.div>
                <motion.div variants={frameIn} className="mt-12 lg:mt-14">
                  {frame}
                </motion.div>
              </motion.div>
            )}
          </Section>
        );
      })}

      {/* ---------------- HOW WE WORK (a full-bleed green band) ---------------- */}
      <section className="relative isolate py-16 text-white [--story-accent:rgba(255,255,255,0.85)] [--story-muted:rgba(255,255,255,0.82)] [--story-line:rgba(255,255,255,0.25)] sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-[1]" style={{ background: BAND }} aria-hidden />
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
        {/* Plasico's green card: the green → lime gradient a shade darker, the pinstripes and a white light. */}
        <CtaBand
          title={story.cta.title}
          quote={story.cta.quote}
          contact={story.cta.contact}
          tone="dark"
          className="rounded-3xl p-8 text-white shadow-[0_30px_90px_-30px_rgba(31,162,42,0.6)] sm:p-12 lg:p-14"
        >
          <div className="absolute inset-0" style={{ background: BAND }} aria-hidden />
          <div className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(-32deg,#fff_0_1px,transparent_1px_22px)]" aria-hidden />
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.3),transparent)]" aria-hidden />
        </CtaBand>
      </Section>
    </StoryShell>
  );
}
