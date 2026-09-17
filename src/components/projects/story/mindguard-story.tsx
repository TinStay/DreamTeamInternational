"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import type { Project, StoryClip } from "@/lib/projects";
import { contactProcessPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { COPY_DELAY, ClientSite, MediaFrame, STORY_CONTAINER, Section, StoryShell, VIEWPORT, fadeUp, fadeUpAfter, frameIn, stagger } from "./primitives";

/*
 * MindGuard's case study, as the client delivered it (`MindGuard-Case-Study.html`)
 * - the same sections, copy and look, on the platform's own colours
 * (mymindguard.ai): the charcoal `#0E1116` sinking into the teal `#35827C`
 * down the page, pale ink, the teal accent. The logo (linking to the client's
 * site) leading the copy beside the key visual's phone, the facts, the challenge, the
 * three solutions - the presentation to Klaus Schwab, the one to the President
 * of Switzerland (the frame on the left), the 1+1 TV presentation with the TV
 * segment under it - each with its Bunny Stream film in a frame, the results
 * on the teal, the two testimonials and the CTA in white cards, then the
 * footer (no quote wizard on this page). Locked dark whatever
 * the visitor's theme, and set in the platform's own faces (mymindguard.ai):
 * Space Grotesk for the titles, DM Sans for the body - neither has Cyrillic,
 * so Manrope follows them in the stack and stands in for the Bulgarian glyphs
 * (as the delivered page does). Copy in `projects.stories.mindguard`; the
 * films in `Project.story.clips` (`pr` · `president` · `tv` · `broadcast`).
 */

/** The platform's colours (mymindguard.ai), as the delivered page sets them. */
const MG = { ground: "#0E1116", teal: "#45A199", tealBtn: "#35827C", tealDeep: "#2A6F69", ink: "#F2F4F6" };
/** The page's ground: charcoal for the first third, then sinking into the teal by the bottom (the delivered page's html background). */
const GROUND = `linear-gradient(180deg, ${MG.ground} 0%, ${MG.ground} 38%, #12302F 58%, ${MG.tealDeep} 80%, ${MG.tealBtn} 100%)`;
/** The right of the client's key visual - the phone on its rock, the teal glow - cut for the hero's right column. */
const HERO_PHONE = { src: "/projects/mindguard/story/hero-phone.webp", width: 1400, height: 1591 };

/** The platform's heading face (Space Grotesk, Manrope for the Cyrillic) - `font-heading` is inlined to Exo 2 by the theme, so it is set here. */
const HEADING = "font-[family-name:var(--font-space-grotesk),var(--font-manrope)]";
const EYEBROW = "text-[0.9rem] font-bold uppercase tracking-[0.3em] text-[var(--story-accent)]";
const H2 = cn(HEADING, "text-[2.25rem] font-bold tracking-[-0.02em] text-balance md:text-[3rem] leading-[1.06]");
const BODY_XL = "text-[1.15rem] leading-[1.6] text-[var(--story-muted)] md:text-[1.35rem] [&>p+p]:mt-5";
/** A film's frame: rounded, a hairline, a deep shadow, the raised surface `#1C222B` behind the player. */
const FRAME = "rounded-xl border border-[var(--story-line)] bg-[#1C222B] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]";
const WHITE_CARD = "rounded-2xl bg-white px-8 py-12 text-[#0E1116] sm:px-10 md:px-16 md:py-14";

const placeholderClass = "text-[rgba(242,244,246,0.55)] [background:repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0_10px,rgba(255,255,255,0.02)_10px_20px)]";

/** A film in its frame (16:9, the Bunny player). */
function Film({ clip, title, placeholder }: { clip: StoryClip | null; title: string; placeholder: string }) {
  return (
    <MediaFrame
      clip={clip}
      title={title}
      aspect="aspect-video"
      placeholder={placeholder}
      className={FRAME}
      placeholderClass={placeholderClass}
      ringClass="border-white/40 text-white/70"
    />
  );
}

/**
 * A solution section: the copy (eyebrow, title, paragraphs, a three-column
 * meta list) beside the film - the copy on the left and the wider frame on the
 * right, or the other way round (`flip`); the copy first on phones. Anything
 * else (the TV segment) goes under the pair.
 */
function Solution({
  flip = false,
  eyebrow,
  title,
  body,
  meta,
  film,
  children,
}: {
  flip?: boolean;
  eyebrow: string;
  title: string;
  body: readonly string[];
  meta: readonly { label: string; value: string }[];
  film: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Section className="pt-0 pb-24 sm:pt-0 sm:pb-24 lg:pt-0 lg:pb-24">
      <motion.div
        className={cn("grid items-center gap-12 lg:gap-14", flip ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]" : "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]")}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.1)}
      >
        <motion.div variants={fadeUp} className={cn(flip && "lg:order-2")}>
          <p className={EYEBROW}>{eyebrow}</p>
          <h2 className={cn(H2, "mt-4")}>{title}</h2>
          <div className={cn(BODY_XL, "mt-7 md:text-[1.2rem]")}>
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {/* Three across from sm; on phones the third (the long "live presentation") takes a row of its own. */}
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-[var(--story-line)] pt-6 sm:grid-cols-3">
            {meta.map((item, i) => (
              <div key={item.label} className={cn(i === 2 && "col-span-2 sm:col-span-1")}>
                <dt className="text-[0.85rem] font-bold uppercase tracking-[0.12em] text-[rgba(242,244,246,0.55)]">{item.label}</dt>
                <dd className="mt-1.5 text-[1.25rem]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
        <motion.div variants={frameIn} className={cn("min-w-0", flip && "lg:order-1")}>
          {film}
        </motion.div>
      </motion.div>
      {children}
    </Section>
  );
}

/** A testimonial in a white card: the eyebrow (the first only), the big quote mark, the quote, the name and role. */
function Quote({ eyebrow, quote, name, role, className }: { eyebrow?: string; quote: string; name: string; role: string; className?: string }) {
  return (
    <motion.blockquote variants={fadeUp} className={cn(WHITE_CARD, "m-0", className)}>
      {eyebrow ? <p className={cn(EYEBROW, "mb-6 text-[#35827C]")}>{eyebrow}</p> : null}
      <span aria-hidden className={cn(HEADING, "mb-5 block text-[5rem] font-bold leading-[0.6] text-[#45A199]")}>
        “
      </span>
      <p className={cn(HEADING, "max-w-[48rem] text-[1.5rem] font-medium leading-[1.5] md:text-[1.85rem]")}>{quote}</p>
      <footer className="mt-8 text-[1.2rem] leading-[1.5]">
        <span className="font-bold">{name}</span> <span className="text-[rgba(14,17,22,0.6)]">— {role}</span>
      </footer>
    </motion.blockquote>
  );
}

export function MindguardStory({ project }: { project: Project }) {
  const { t, language } = useLanguage();
  const story = t.projects.stories.mindguard;
  const name = t.projects.items[project.id].name;
  const partner = PARTNERS.find((p) => p.id === project.partnerId);
  const clips = project.story?.clips ?? {};
  const style = {
    "--foreground": MG.ink,
    "--muted-foreground": "rgba(242,244,246,0.72)",
    "--story-accent": MG.teal,
    "--story-muted": "rgba(242,244,246,0.72)",
    "--story-line": "rgba(255,255,255,0.10)",
    "--story-rule": "rgba(255,255,255,0.7)",
  } as CSSProperties;
  const film = (key: "pr" | "president" | "tv" | "broadcast", title: string) => (
    <Film clip={clips[key] ?? null} title={`${name} · ${title}`} placeholder={story.placeholder} />
  );

  return (
    <StoryShell
      style={style}
      accent={MG.teal}
      // Locked dark whatever the visitor's theme: the story sinks from the charcoal into the teal (`GROUND`, drawn
      // over the story block), and the wizard after it sits on that teal, its heading in white.
      theme="dark"
      // The platform's body face for the whole block (DM Sans, Manrope for the Cyrillic); the headings wear `HEADING`.
      font="font-[family-name:var(--font-dm-sans),var(--font-manrope)]"
      className="[--story-ground:#35827C]"
      wizard={false}
      ground={<div className="absolute inset-0 bg-[var(--story-ground)]" aria-hidden />}
    >
      {/* The delivered page's ground over the story block: charcoal up top, the teal by the CTA. */}
      <div className="pointer-events-none absolute inset-0" style={{ background: GROUND }} aria-hidden />

      {/* ---------------- HERO: the logo and the copy on the left, the key visual's phone on the right ---------------- */}
      <section className="relative border-b border-[var(--story-line)]">
        <motion.div
          className={cn(STORY_CONTAINER, "relative grid items-center gap-10 pb-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pb-16")}
          initial="hidden"
          animate="visible"
          variants={stagger(0.1, 0.1)}
        >
          <div>
            {partner ? (
              // The logo (the link to the client's site) right above the title - the mark's file carries transparent
              // padding on its left, the link pulls it back in line.
              <motion.div variants={fadeUp} className="mb-8">
                <ClientSite href={partner.href} name={name} className="-ml-[0.75rem] md:-ml-[1rem]">
                  <PartnerLogo p={partner} imgClass="h-[4.5rem] w-auto md:h-24" sizes="480px" />
                </ClientSite>
              </motion.div>
            ) : null}
            <motion.p variants={fadeUp} className={cn(EYEBROW, "text-[0.85rem] tracking-[0.35em] md:text-[clamp(0.75rem,1vw,1rem)]")}>
              {story.hero.eyebrow}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className={cn(HEADING, "mt-5 text-[2.25rem] font-medium tracking-[-0.012em] text-balance md:text-[clamp(1.7rem,3.6vw,4.2rem)] leading-[1.18]")}
            >
              {story.hero.title}
            </motion.h1>
            <motion.p
              variants={fadeUpAfter(COPY_DELAY)}
              className="mt-7 max-w-[48rem] text-[1.15rem] leading-[1.7] text-[var(--story-muted)] md:text-[clamp(1rem,1.4vw,1.45rem)]"
            >
              {story.hero.lead}
            </motion.p>
          </div>
          {/* The phone on its rock, sized by its column - to the right from lg, between the lede and the facts on
              phones - its edges feathered into the ground. */}
          <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-[520px] lg:ml-auto lg:max-w-[640px]">
            <Image
              src={HERO_PHONE.src}
              alt=""
              width={HERO_PHONE.width}
              height={HERO_PHONE.height}
              priority
              sizes="(max-width: 1024px) 520px, 640px"
              className="h-auto w-full"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, #0E1116 0%, rgba(14,17,22,0) 14%), linear-gradient(180deg, #0E1116 0%, rgba(14,17,22,0) 12%), linear-gradient(0deg, #0E1116 0%, rgba(14,17,22,0) 8%), linear-gradient(270deg, #0E1116 0%, rgba(14,17,22,0) 10%)",
              }}
              aria-hidden
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------- FACTS ---------------- */}
      <section className="relative border-b border-[var(--story-line)]">
        <motion.dl
          className={cn(STORY_CONTAINER, "grid grid-cols-2 gap-6 py-8 md:grid-cols-3 lg:grid-cols-5")}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.08)}
        >
          {/* Below md: the client and the industry share the first row, the product, what was delivered and the
              partnership take a row each. */}
          {story.facts.map((fact, i) => (
            <motion.div key={fact.label} variants={fadeUp} className={cn(i >= 2 && "max-md:col-span-2")}>
              <dt className="text-[0.9rem] font-bold uppercase tracking-[0.1em] text-[var(--story-accent)]">{fact.label}</dt>
              <dd className="mt-2.5 text-[1.15rem] leading-[1.5]">
                {fact.value.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </section>

      {/* ---------------- CHALLENGE ---------------- */}
      <Section className="py-24 sm:py-24 lg:py-28">
        <motion.div
          className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0)}
        >
          <motion.div variants={fadeUp}>
            <p className={EYEBROW}>{story.challenge.eyebrow}</p>
            <h2 className={cn(H2, "mt-4")}>{story.challenge.title}</h2>
          </motion.div>
          <motion.div variants={fadeUpAfter(COPY_DELAY)} className={BODY_XL}>
            {story.challenge.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      {/* ---------------- SOLUTIONS: the three films ---------------- */}
      <Solution
        eyebrow={story.solutions.eyebrow}
        title={story.solutions.schwab.title}
        body={story.solutions.schwab.body}
        meta={story.solutions.schwab.meta}
        film={film("pr", story.solutions.schwab.title)}
      />
      <Solution
        flip
        eyebrow={story.solutions.eyebrow}
        title={story.solutions.parmelin.title}
        body={story.solutions.parmelin.body}
        meta={story.solutions.parmelin.meta}
        film={film("president", story.solutions.parmelin.title)}
      />
      <Solution
        eyebrow={story.solutions.eyebrow}
        title={story.solutions.tv.title}
        body={story.solutions.tv.body}
        meta={story.solutions.tv.meta}
        film={film("tv", story.solutions.tv.title)}
      >
        {/* The TV segment itself, across the page. */}
        <motion.figure className="m-0 mt-14" initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={frameIn}>
          {film("broadcast", story.solutions.tv.caption)}
          <figcaption className="mt-4 text-base font-semibold text-[rgba(242,244,246,0.55)]">{story.solutions.tv.caption}</figcaption>
        </motion.figure>
      </Solution>

      {/* ---------------- RESULTS (on the teal) ---------------- */}
      <Section className="border-t border-white/25 py-24 text-white sm:py-24 lg:py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.1)}>
          <motion.p variants={fadeUp} className={cn(EYEBROW, "text-white/80")}>
            {story.results.eyebrow}
          </motion.p>
          <motion.h2 variants={fadeUp} className={cn(H2, "mt-4")}>
            {story.results.title}
          </motion.h2>
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-3">
            {story.results.stats.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} className={cn("border-l-[3px] border-white/70 pl-6", i === 2 && "col-span-2 lg:col-span-1")}>
                <dd className={cn(HEADING, "text-[clamp(3.5rem,7vw,6.5rem)] font-bold leading-none tracking-[-0.02em] whitespace-nowrap")}>
                  {stat.num}
                  {stat.suffix ? <span className="text-[0.45em] font-semibold">{stat.suffix}</span> : null}
                </dd>
                <dt className="mt-3.5 text-[1.25rem] leading-[1.45] text-white/80">{stat.label}</dt>
              </motion.div>
            ))}
          </dl>
          <motion.p variants={fadeUp} className="mt-16 max-w-[60ch] text-[1.15rem] leading-[1.6] text-white/80 md:text-[1.35rem]">
            {story.results.closing}
          </motion.p>
        </motion.div>
      </Section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <Section className="pt-0 pb-20 sm:pt-0 sm:pb-20 lg:pt-0 lg:pb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.12)}>
          {story.testimonials.items.map((item, i) => (
            <Quote key={item.name} eyebrow={i === 0 ? story.testimonials.eyebrow : undefined} quote={item.quote} name={item.name} role={item.role} className={i > 0 ? "mt-6" : undefined} />
          ))}
        </motion.div>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <Section className="pt-0 pb-28 sm:pt-0 sm:pb-28 lg:pt-0 lg:pb-28">
        <motion.div
          className={cn(WHITE_CARD, "flex flex-col items-start gap-7 md:flex-row md:items-center md:justify-between md:p-12")}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={frameIn}
        >
          <h2 className={cn(HEADING, "text-[clamp(1.75rem,2.6vw,2.5rem)] font-bold tracking-[-0.02em] text-balance leading-[1.06]")}>{story.cta.title}</h2>
          <Link
            href={contactProcessPath(language)}
            className="inline-block shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-[#35827C] px-9 py-4 text-[1.05rem] font-bold text-white transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#45A199] hover:shadow-[0_14px_30px_-12px_rgba(69,161,153,0.7)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#45A199]"
          >
            {story.cta.contact}
          </Link>
        </motion.div>
      </Section>
    </StoryShell>
  );
}
