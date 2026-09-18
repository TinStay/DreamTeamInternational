"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { bunnyMp4Url, bunnyThumbnailUrl, type BunnyVideo } from "@/lib/bunny-stream";
import { BodyXL, ClientSite, CtaBand, Eyebrow, HERO_TITLE, MediaFrame, STORY_CONTAINER, Section, StoryShell, VIEWPORT, Words, fadeUp, frameIn, stagger } from "./primitives";

/*
 * Plasico's story - the store's world from the home showcase: white, the
 * Plasico green and faint diagonal pinstripes - told in big, short titles
 * (they are what gets read) over large type: the hero (the "Back to Work"
 * film from the very top of the page - behind the header and the breadcrumbs
 * - with the mark, the title and the lead on a glass panel at its bottom
 * left), the brief, the three
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

/**
 * The hero's film: the ad cover-fitting the whole section - a native video from the pull zone (any frame, no
 * player chrome), muted and looping; the 1080p rendition from lg, 720p under it; reduced motion keeps its poster.
 */
function HeroFilm({ clip }: { clip: BunnyVideo }) {
  const reduceMotion = useReducedMotion();
  return (
    <video
      className="absolute inset-0 size-full object-cover"
      poster={bunnyThumbnailUrl(clip)}
      autoPlay={!reduceMotion}
      muted
      loop
      playsInline
      preload={reduceMotion ? "none" : "auto"}
      aria-hidden
    >
      <source src={bunnyMp4Url(clip, 1080)} media="(min-width: 1024px)" type="video/mp4" />
      <source src={bunnyMp4Url(clip, 720)} type="video/mp4" />
    </video>
  );
}

/** A short title, big. */
const TITLE = cn("font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl xl:text-7xl", PROJECT_DISPLAY_FONT.plasico, "leading-[1.04]");

export function PlasicoStory({ project }: { project: Project }) {
  const { t } = useLanguage();
  const story = t.projects.stories.plasico;
  const name = t.projects.items[project.id].name;
  const partner = PARTNERS.find((p) => p.id === project.partnerId);
  const clips = project.story?.clips ?? {};
  const heroClip = clips.backToWork && "bunny" in clips.backToWork ? clips.backToWork.bunny : null;
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
      breadcrumbsTheme="dark"
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
      {/* ---------------- HERO: the "Back to Work" film from the top of the page, the copy bottom left ---------------- */}
      {/* Pulled up under the breadcrumbs block (the shell's header lane + the crumbs, about 9.5rem / 11.25rem from lg -
          a touch more than the block, so the film never falls short of the page's top edge) and padded by the same,
          so the film runs behind the header and the breadcrumbs (locked dark, `breadcrumbsTheme`) to the very top. */}
      <section className="relative isolate -mt-[9.5rem] flex min-h-[min(100svh,1000px)] flex-col overflow-hidden pt-[9.5rem] lg:-mt-[11.25rem] lg:pt-[11.25rem]">
        {/* The film behind everything, under a scrim that is darkest at the top (the header) and at the foot (the
            copy), and a fade into the page ground along the bottom edge. */}
        <div className="absolute inset-0 bg-[#0F2318]" aria-hidden>
          {heroClip ? <HeroFilm clip={heroClip} /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/65" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--story-ground)] to-transparent" />
        </div>
        <motion.div
          // pb-24 below lg: the panel sits at the foot of a screen-high hero, above the mobile dock.
          className={cn("relative z-[1] flex flex-1 items-end pb-24 pt-6 lg:pb-16", STORY_CONTAINER)}
          initial="hidden"
          animate="visible"
          variants={stagger(0.08, 0.1)}
        >
          {/* The copy on a glass panel across the page at the foot, so it stands out from whatever the film shows
              behind it: the title and the lead on the left, the mark bottom right; on phones the mark on top. */}
          <motion.div
            variants={frameIn}
            className="grid w-full gap-8 rounded-[2rem] border border-white/15 bg-black/35 p-7 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-md sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-14 lg:p-12 xl:gap-20"
          >
            {partner ? (
              // The client's mark (the link to its site): on top on phones, at the foot of the right column from lg.
              <motion.div variants={fadeUp} className="lg:order-2 lg:self-end lg:pb-1">
                <ClientSite href={partner.href} name={name} className="block w-full md:inline-block md:w-auto">
                  <PartnerLogo p={partner} imgClass="h-auto w-full md:h-20 md:w-auto xl:h-24 2xl:h-28" sizes="(max-width: 767px) 100vw, 360px" />
                </ClientSite>
              </motion.div>
            ) : null}
            <div className="min-w-0 lg:order-1">
              {/* A step under the short scale on desktop - the uppercase Exo 2 reads loud enough at 3.5–4rem. */}
              <h1 className={cn("text-[clamp(2.75rem,1rem+2.4vw,4.5rem)] font-heading font-bold tracking-tight text-balance", PROJECT_DISPLAY_FONT.plasico, "leading-[0.98]")}>
                <Words text={story.hero.title} base={0.05} step={0.04} />
              </h1>
              <motion.p variants={fadeUp} className="mt-3 max-w-[64ch] text-lg leading-relaxed text-white/65 sm:text-xl lg:mt-4 xl:text-2xl">
                {story.hero.lead}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </section>

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
