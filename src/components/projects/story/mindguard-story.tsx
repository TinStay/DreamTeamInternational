"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import { EmbedCover } from "@/components/projects/showcase-primitives";
import { bunnyBackgroundEmbedSrc } from "@/lib/bunny-stream";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project, StoryClip } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  BodyXL,
  CtaBand,
  EASE,
  Eyebrow,
  HERO_TITLE,
  FactsStrip,
  Lead,
  MediaFrame,
  STORY_CONTAINER,
  Section,
  StatGrid,
  StoryShell,
  VIEWPORT,
  Words,
  fadeUp,
  stagger,
} from "./primitives";

/*
 * MindGuard's story - in the platform's own colours (mymindguard.ai): the
 * charcoal ground `#0E1116`, its cards `#14181F`, the teal accent `#45A199`
 * (dim `#2A6F69`, light `#CDE4E2`) and pale ink; the light theme keeps the
 * teal on a whisper-of-teal white. The page tells what the product does (in
 * the client's own terms), the challenge of showing something that happens
 * in the brain, how the film visualised it - realistic human scenes made
 * with AI video models plus animated interface - the films themselves (the
 * PR film big, then the user film, the UI/UX film for TV and the TV block on
 * Ukraine's national TV, all on Bunny Stream; the showcase's stand-in clip is
 * never shown here), the result and the CTA. Copy in
 * `projects.stories.mindguard`.
 */

/** The platform's colours (mymindguard.ai) used inline; the rest are in the shell's CSS variables below. */
const MG = { ground: "#0E1116", card: "#14181F", raised: "#1C222B", teal: "#45A199" };

const TITLE = cn("font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl xl:text-6xl", PROJECT_DISPLAY_FONT.mindguard, "leading-[1.06]");

const frameIn = {
  hidden: { opacity: 0, y: 48, scale: 0.975 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.1, ease: EASE } },
};

/** The dot grid from the platform's world, in its teal. */
function DotGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 opacity-[0.16] [background-size:34px_34px]", className)}
      style={{ backgroundImage: `radial-gradient(${MG.teal} 1px, transparent 1.5px)` }}
      aria-hidden
    />
  );
}

/** The platform's daily loop as a ring of steps. */
function Loop({ steps, label }: { steps: string[]; label: string }) {
  return (
    <motion.ol
      className="relative grid gap-3 sm:grid-cols-5"
      aria-label={label}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={stagger(0.1)}
    >
      {steps.map((step, i) => (
        <motion.li
          key={step}
          variants={fadeUp}
          className="relative rounded-2xl border border-[var(--story-line)] bg-[var(--story-card)] p-5 shadow-[0_20px_60px_-30px_rgba(69,161,153,0.35)]"
        >
          <span className="mb-4 flex size-9 items-center justify-center rounded-full text-sm font-bold text-[#0E1116]" style={{ backgroundColor: MG.teal }}>
            {i + 1}
          </span>
          <span className="block text-base font-semibold leading-snug lg:text-lg">{step}</span>
          {i < steps.length - 1 ? (
            <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-3 sm:block" style={{ backgroundColor: MG.teal }} aria-hidden />
          ) : null}
        </motion.li>
      ))}
    </motion.ol>
  );
}

/** A film frame with its title + note under it (the films that sit beside the sections' copy). */
function Film({ clip, title, note, name, placeholder, className }: { clip: StoryClip | null; title: string; note: string; name: string; placeholder: string; className?: string }) {
  return (
    <motion.figure variants={frameIn} className={cn("m-0 min-w-0", className)}>
      <MediaFrame
        clip={clip}
        title={`${name} · ${title}`}
        aspect="aspect-video"
        placeholder={placeholder}
        className="rounded-3xl border border-[var(--story-line)] shadow-[0_40px_100px_-30px_rgba(69,161,153,0.35)]"
        placeholderClass="text-[#CDE4E2] [background:linear-gradient(135deg,#14181F,#1C222B)]"
        ringClass="border-[#45A199]/60 bg-[#45A199]/15 text-[#CDE4E2]"
      />
      <figcaption className="mt-4 px-1">
        <span className="block text-base font-semibold leading-snug xl:text-lg">{title}</span>
        <span className="mt-1 block text-sm leading-snug text-[var(--mg-muted)]">{note}</span>
      </figcaption>
    </motion.figure>
  );
}

export function MindguardStory({ project }: { project: Project }) {
  const { t } = useLanguage();
  const story = t.projects.stories.mindguard;
  const name = t.projects.items[project.id].name;
  const clips = project.story?.clips ?? {};
  const partner = PARTNERS.find((p) => p.id === project.partnerId);
  const style = {
    "--story-accent": "var(--mg-accent)",
    "--story-muted": "var(--mg-muted)",
    "--story-line": "color-mix(in srgb, var(--mg-accent) 26%, transparent)",
    "--story-rule": "var(--mg-accent)",
  } as CSSProperties;

  return (
    <StoryShell
      style={style}
      accent={MG.teal}
      display={PROJECT_DISPLAY_FONT.mindguard}
      // The platform's palette in both themes: charcoal + teal, or the teal on a whisper-of-teal white.
      className={cn(
        "[--story-ground:#F3F7F7] [--story-card:#FFFFFF] [--mg-accent:#35827C] [--mg-muted:#5B6670]",
        "dark:[--story-ground:#0E1116] dark:[--story-card:#14181F] dark:[--mg-accent:#45A199] dark:[--mg-muted:#A5ADB6]"
      )}
      ground={
        <div className="absolute inset-0 overflow-hidden bg-[var(--story-ground)]" aria-hidden>
          {/* The hero's teal light along the bottom of the platform's own hero, here up top. */}
          <div className="absolute inset-x-0 top-0 h-[90vh] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(69,161,153,0.14)_0%,transparent_70%)] dark:bg-[radial-gradient(70%_60%_at_50%_0%,rgba(69,161,153,0.22)_0%,transparent_70%)]" />
          <DotGrid className="opacity-[0.08] dark:opacity-[0.12]" />
        </div>
      }
    >
      {/* ---------------- HERO (copy left, the PR film muted on the right) ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div
          className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20"
          initial="hidden"
          animate="visible"
          variants={stagger(0.08, 0.1)}
        >
          <div>
            {partner ? (
              <motion.div variants={fadeUp} className="mb-10 -ml-[0.62rem] md:-ml-[0.93rem]">
                <PartnerLogo p={partner} imgClass="h-16 w-auto md:h-24" sizes="420px" />
              </motion.div>
            ) : null}
            <h1 className={cn(HERO_TITLE.long, "max-w-[16ch] font-heading font-bold tracking-tight text-balance", PROJECT_DISPLAY_FONT.mindguard, "leading-[1.04]")}>
              <Words text={story.hero.title} base={0.05} step={0.04} />
            </h1>
            <motion.p variants={fadeUp} className="mt-8 max-w-[44ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl">
              {story.hero.lead}
            </motion.p>
          </div>
          <motion.div variants={frameIn} className="relative w-full">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "radial-gradient(closest-side, rgba(69,161,153,0.34) 0%, rgba(69,161,153,0.12) 45%, transparent 100%)" }}
              aria-hidden
            />
            {/* The PR film, muted and looping; the full player is further down the page. */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-[var(--story-line)] bg-[#0E1116] shadow-[0_40px_100px_-30px_rgba(69,161,153,0.45)]">
              {clips.pr && "bunny" in clips.pr ? <EmbedCover src={bunnyBackgroundEmbedSrc(clips.pr.bunny)} orientation="wide" boxAspect={16 / 9} /> : null}
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ---------------- FACTS ---------------- */}
      <Section tight className="py-0 sm:py-0 lg:py-0">
        <FactsStrip facts={story.facts} columns={4} />
      </Section>

      {/* ---------------- THE PRODUCT (copy left, the UI/UX film right, the loop under both) ---------------- */}
      <Section>
        <motion.div
          className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-20"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.product.eyebrow}</Eyebrow>
            <h2 className={cn(TITLE, "max-w-[14ch]")}>
              <Words text={story.product.title} />
            </h2>
            <div className="mt-8">
              <BodyXL paragraphs={story.product.body} />
            </div>
          </motion.div>
          <Film clip={clips.tv ?? null} title={story.film.items.tv.title} note={story.film.items.tv.note} name={name} placeholder={story.placeholder} className="lg:mt-10" />
        </motion.div>
        <div className="mt-14 lg:mt-20">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--story-accent)]">{story.product.loopLabel}</p>
          <Loop steps={story.product.loop} label={story.product.loopLabel} />
        </div>
      </Section>

      {/* ---------------- THE CHALLENGE (copy left, the user film right) ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div
          className="grid items-start gap-10 border-t border-[var(--story-line)] pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:pt-20 xl:gap-20"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.challenge.eyebrow}</Eyebrow>
            <h2 className={cn(TITLE, "max-w-[16ch]")}>
              <Words text={story.challenge.title} />
            </h2>
            <div className="mt-8">
              <BodyXL paragraphs={story.challenge.body} />
            </div>
          </motion.div>
          <Film clip={clips.president ?? null} title={story.film.items.president.title} note={story.film.items.president.note} name={name} placeholder={story.placeholder} className="lg:mt-10" />
        </motion.div>
      </Section>

      {/* ---------------- HOW WE VISUALISED IT (a charcoal band) ---------------- */}
      <section className="relative isolate py-16 text-[#F2F4F6] [--story-accent:#45A199] [--story-muted:#A5ADB6] [--story-line:rgba(69,161,153,0.28)] [--story-card:#1C222B] sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-[1]" style={{ background: `linear-gradient(160deg, ${MG.raised} 0%, ${MG.card} 50%, ${MG.ground} 100%)` }} aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-[1] h-[60%] bg-[radial-gradient(60%_80%_at_80%_100%,rgba(69,161,153,0.22),transparent)]" aria-hidden />
        <DotGrid className="-z-[1] opacity-[0.12]" />
        <div className={STORY_CONTAINER}>
          <motion.div
            className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={stagger(0.12)}
          >
            <motion.div variants={fadeUp}>
              <Eyebrow>{story.approach.eyebrow}</Eyebrow>
              <h2 className={cn(TITLE, "max-w-[12ch]")}>
                <Words text={story.approach.title} />
              </h2>
            </motion.div>
            <motion.div variants={fadeUp} className="lg:pt-10">
              <BodyXL paragraphs={story.approach.body} />
            </motion.div>
          </motion.div>
          <motion.ol
            className="mt-14 grid gap-4 md:grid-cols-3 lg:mt-20"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={stagger(0.12)}
          >
            {story.approach.points.map((point, i) => (
              <motion.li
                key={point.title}
                variants={fadeUp}
                className="rounded-2xl border border-[rgba(69,161,153,0.28)] bg-[#14181F]/80 p-6 shadow-[0_20px_60px_-30px_rgba(69,161,153,0.45)] backdrop-blur-sm"
              >
                <span className="mb-5 block font-heading text-4xl font-light leading-none" style={{ color: MG.teal }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mb-2.5 text-lg font-semibold leading-snug xl:text-xl">{point.title}</h3>
                <p className="text-base leading-relaxed text-[#A5ADB6] xl:text-lg">{point.text}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ---------------- THE FILM ---------------- */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.12)}>
          <motion.div variants={fadeUp} className="max-w-3xl">
            <Eyebrow>{story.film.eyebrow}</Eyebrow>
            <h2 className={cn(TITLE, "max-w-[14ch]")}>
              <Words text={story.film.title} />
            </h2>
          </motion.div>
          <motion.div variants={frameIn} className="mt-10 lg:mt-14">
            {/* The PR film - the one presented to Prof. Klaus Schwab. */}
            <MediaFrame
              clip={clips.pr ?? null}
              title={`${name} · ${story.film.title}`}
              aspect="aspect-video"
              placeholder={story.placeholder}
              className="rounded-3xl border border-[var(--story-line)] shadow-[0_50px_120px_-30px_rgba(69,161,153,0.35)]"
              placeholderClass="text-[#CDE4E2] [background:linear-gradient(135deg,#14181F,#1C222B)]"
              ringClass="border-[#45A199]/60 bg-[#45A199]/15 text-[#CDE4E2]"
            />
          </motion.div>
          <motion.p variants={fadeUp} className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--story-accent)]">
            {story.film.note}
          </motion.p>
          {/* On air: the TV block with Ben on Ukraine's national TV, beside its caption. */}
          <div className="mt-14 grid items-center gap-8 lg:mt-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16">
            <motion.figure variants={frameIn} className="m-0 min-w-0 lg:order-1">
              <MediaFrame
                clip={clips.broadcast ?? null}
                title={`${name} · ${story.film.items.broadcast.title}`}
                aspect="aspect-video"
                placeholder={story.placeholder}
                className="rounded-3xl border border-[var(--story-line)] shadow-[0_40px_100px_-30px_rgba(69,161,153,0.35)]"
                placeholderClass="text-[#CDE4E2] [background:linear-gradient(135deg,#14181F,#1C222B)]"
                ringClass="border-[#45A199]/60 bg-[#45A199]/15 text-[#CDE4E2]"
              />
            </motion.figure>
            <motion.div variants={fadeUp} className="lg:order-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--story-accent)]">{story.film.items.broadcast.title}</p>
              <p className="mt-4 text-xl font-semibold leading-snug xl:text-2xl">{story.film.items.broadcast.note}</p>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      {/* ---------------- THE RESULT ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.12)}>
          <motion.div variants={fadeUp} className="max-w-4xl">
            <Eyebrow>{story.results.eyebrow}</Eyebrow>
            <h2 className={cn(TITLE, "max-w-[14ch]")}>
              <Words text={story.results.title} />
            </h2>
            <Lead className="mt-7">{story.results.body}</Lead>
          </motion.div>
        </motion.div>
        <StatGrid stats={story.results.stats} className="mt-14" />
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.14em] text-[var(--story-muted)]">{story.results.source}</p>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        {/* The platform's card in both themes: the teal light, dot grid and ring on its charcoal - or on its pale teal. */}
        <CtaBand
          title={story.cta.title}
          quote={story.cta.quote}
          contact={story.cta.contact}
          tone="page"
          className="rounded-3xl p-8 text-[#0E1116] shadow-[0_30px_90px_-30px_rgba(69,161,153,0.5)] sm:p-12 lg:p-14 dark:text-[#F2F4F6]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_24%_30%,rgba(69,161,153,0.28)_0%,#E3EFEE_60%)] dark:bg-[radial-gradient(80%_70%_at_24%_30%,rgba(69,161,153,0.35)_0%,#14181F_60%)]" aria-hidden />
          <DotGrid className="opacity-[0.22] dark:opacity-[0.18]" />
          <div className="absolute -bottom-40 -right-24 size-96 rounded-full border border-[rgba(69,161,153,0.35)]" aria-hidden />
        </CtaBand>
      </Section>
    </StoryShell>
  );
}
