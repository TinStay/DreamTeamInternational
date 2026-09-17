"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import { bunnyPlayerEmbedSrc } from "@/lib/bunny-stream";
import type { Project, StoryClip } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_REFERRER_POLICY } from "@/lib/youtube-embeds";
import { Body, COPY_DELAY, ClientSite, CtaBand, EASE, Eyebrow, HERO_TITLE, Lead, PlayRing, Section, Split, StoryShell, VIEWPORT, fadeUp, fadeUpAfter, frameIn, stagger } from "./primitives";

/*
 * Emblema's story - the editorial world on Emblema's own ground (cream in the
 * light theme, warm black in the dark one, no bands): the type carries the
 * logo's copper -
 * headings in the copper gradient, eyebrows / numerals / hairlines in the mid
 * tone - headings are airy and uppercase and settle in softly (`SoftTitle`:
 * a slight blur and a breath of scale easing out - pure CSS, the hero's on
 * load and the rest on a scroll-driven timeline, so a title never waits for
 * JS; not the kit's rising words), a small arch draws itself at the head of
 * the key sections and the film frames are arch-topped. The hero is copy alone -
 * title, line and meta strip, the logo big on the right from `lg` (on top on
 * phones), no film (the client wanted it clean); the films follow, the wide
 * one across the page, each vertical one in its arch beside its copy, sides
 * alternating. Copy in
 * `projects.stories.emblema`; which films exist (and their clips - Bunny
 * Stream today) in `Project.story.films`.
 */

/** The logo's copper: light and deep ends of its gradient, and the mid tone for lines and small type. */
const COPPER = { light: "#DDB27A", mid: "#C08F55", deep: "#95693A" };
/** Headings wear the logo gradient. */
const INK = "bg-gradient-to-br from-[#DDB27A] via-[#C08F55] to-[#95693A] bg-clip-text text-transparent";

/**
 * Emblema's heading reveal - its own, soft, and pure CSS (`soft-title-in` in globals.css), so a title is on the
 * page the moment it paints and never waits for hydration or a JS reveal: each line settles in out of a slight
 * blur with a breath of scale (a transform, so a wrapping line never re-breaks mid-way) - the hero's lines on
 * load, staggered (`--soft-delay`), every other title on a scroll-driven timeline as it enters the viewport (a
 * browser without one shows it plain). The copper ink sits on each line, not on the heading: a filter or an
 * opacity on a child of a `bg-clip-text` element would leave the ink untouched. `lines` are the hero's explicit
 * lines; a section title is one line that wraps.
 */
function SoftTitle({
  as: Tag = "h2",
  lines,
  className,
  base = 0,
  step = 0.16,
  onLoad = false,
}: {
  as?: "h1" | "h2" | "h3" | "span";
  lines: string[];
  className?: string;
  base?: number;
  step?: number;
  /** The hero: play on load rather than as it scrolls into view. */
  onLoad?: boolean;
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span
          key={line}
          className={cn("block origin-bottom-left", INK, onLoad ? "soft-title-load" : "soft-title-view")}
          style={onLoad ? ({ "--soft-delay": `${base + i * step}s` } as CSSProperties) : undefined}
        >
          {line}
        </span>
      ))}
    </Tag>
  );
}

/** A small arch that draws itself at the head of a section. */
function ArchMark() {
  return (
    <svg className="mb-6 block h-auto w-14 overflow-visible text-[var(--story-accent)]" viewBox="0 0 56 34" fill="none" aria-hidden>
      <motion.path
        d="M0.5 34 V17.5 A27.5 17 0 0 1 55.5 17.5 V34"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.4, ease: EASE, delay: 0.05 }}
      />
    </svg>
  );
}

function Arches({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute bottom-[12%] left-1/2 flex h-[62%] w-[76%] -translate-x-1/2 items-end gap-[2.6%] opacity-40", className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="h-full flex-1 rounded-t-[50%/26%] border border-b-0 border-[#C08F55]" />
      ))}
    </div>
  );
}

function FilmMedia({ clip, orientation, title, placeholder }: { clip: StoryClip | null; orientation: "wide" | "tall"; title: string; placeholder: string }) {
  const tall = orientation === "tall";
  const frame = cn(
    "relative w-full overflow-hidden border border-[color:color-mix(in_srgb,#C08F55_35%,transparent)] bg-[#1a1715]",
    tall ? "arch mx-auto aspect-[9/16] max-w-[430px]" : "arch-wide aspect-video"
  );
  if (clip && "youtube" in clip) {
    return (
      <div className={frame}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${clip.youtube}?rel=0`}
          title={title}
          allow={YOUTUBE_IFRAME_ALLOW}
          allowFullScreen
          loading="lazy"
          referrerPolicy={YOUTUBE_REFERRER_POLICY}
        />
      </div>
    );
  }
  if (clip && "bunny" in clip) {
    return (
      <div className={frame}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={bunnyPlayerEmbedSrc(clip.bunny)}
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  // Nothing published yet - a placeholder in the client's key (arches, floor line, play ring).
  return (
    <div className={frame}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 88% at 74% 4%, rgba(192,143,85,0.22) 0%, rgba(192,143,85,0) 62%), linear-gradient(162deg, #38241f 0%, #1e1917 60%, #121110 100%)",
        }}
      />
      <Arches />
      <span className="absolute bottom-[12%] left-[12%] right-[12%] h-px bg-[#C08F55] opacity-50" aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center text-[#DDB27A]">
        <PlayRing className="border-[#C08F55] bg-[#111010]/40" />
        <p className="text-[10px] font-bold uppercase tracking-[0.28em]">{placeholder}</p>
      </div>
    </div>
  );
}

/** A section heading in the logo's copper, airy and uppercase, settling in softly. */
function Heading({ text, className }: { text: string; className?: string }) {
  return (
    <SoftTitle
      lines={[text]}
      className={cn("font-heading font-extralight uppercase tracking-[0.01em] text-balance text-3xl sm:text-4xl lg:text-5xl xl:text-6xl", className, "leading-[1.12]")}
    />
  );
}

type FilmCopy = { project: string; title: string; text: string; tags: string[] };

/**
 * One film: the frame rising in, the number / title / project first, the text and tags a beat after. A wide film
 * runs across the page with its copy under it; a vertical one stands in its arch beside the copy - on the left or
 * the right (`side`), so the tall films alternate down the page.
 */
function FilmEntry({ film, media, index, side, title, placeholder }: {
  film: FilmCopy;
  /** The film's frame; `null` = copy only, across the full width (the third item). */
  media: { clip: StoryClip | null; orientation: "wide" | "tall" } | null;
  index: string;
  side: "left" | "right";
  title: string;
  placeholder: string;
}) {
  const tall = media?.orientation === "tall";
  const head = (
    <div>
      <span className="mb-3 block font-heading text-sm tracking-[0.22em] text-[var(--story-accent)]">{index}</span>
      <SoftTitle
        as="h3"
        lines={[film.title]}
        className={cn("font-heading text-2xl font-extralight uppercase sm:text-3xl", tall && "lg:text-4xl xl:text-5xl", "leading-[1.16]")}
      />
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--story-muted)]">{film.project}</p>
    </div>
  );
  const text = (
    <motion.div variants={fadeUpAfter(COPY_DELAY)}>
      <Body className={cn(tall && "max-w-[52ch] xl:text-xl")}>{film.text}</Body>
      <motion.ul className="mt-6 flex flex-wrap gap-2.5 border-t border-[var(--story-line)] pt-5" variants={stagger(0.07)}>
        {film.tags.map((tag) => (
          <motion.li
            key={tag}
            variants={fadeUp}
            className="rounded-full border border-[color:color-mix(in_srgb,var(--story-accent)_45%,transparent)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--story-accent)]"
          >
            {tag}
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
  if (!media) {
    // Copy only: the number, the title and the project on the left, the text and the tags on the right, across the
    // full width - the same two columns as under the wide film, with no frame above them.
    return (
      <motion.div
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16"
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.12)}
      >
        {head}
        {text}
      </motion.div>
    );
  }
  const frame = (
    <motion.div variants={frameIn} className={cn(tall && (side === "right" ? "lg:order-2" : "lg:order-1"))}>
      <FilmMedia clip={media.clip} orientation={media.orientation} title={title} placeholder={placeholder} />
    </motion.div>
  );
  if (tall) {
    return (
      <motion.div
        className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24"
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.12)}
      >
        {frame}
        <div className={cn("lg:max-w-[52ch]", side === "right" ? "lg:order-1 lg:justify-self-end" : "lg:order-2")}>
          {head}
          <div className="mt-6">{text}</div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.12)}>
      {frame}
      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16">
        {head}
        {text}
      </div>
    </motion.div>
  );
}

export function EmblemaStory({ project }: { project: Project }) {
  const { t } = useLanguage();
  const story = t.projects.stories.emblema;
  const copy = t.projects.items[project.id];
  const partner = PARTNERS.find((p) => p.id === project.partnerId);
  const films = project.story?.films ?? [];
  const style = {
    "--story-accent": COPPER.mid,
    "--story-accent-bright": COPPER.light,
    "--story-muted": "var(--muted-foreground)",
    "--story-line": `color-mix(in srgb, ${COPPER.mid} 32%, transparent)`,
    "--story-rule": COPPER.mid,
  } as CSSProperties;

  return (
    <StoryShell
      style={style}
      accent={COPPER.mid}
      className="[--story-ground:#F3EFE8] dark:[--story-ground:#17130F]"
      // Locked light: the client's cream and copper whatever the visitor's theme (the warm-black set stays for
      // the day the lock is lifted).
      theme="light"
      ground={
        // The showcase's cream (a soft white light at the top) / a warm black with a faint copper light.
        <div className="absolute inset-0 overflow-hidden bg-[var(--story-ground)]" aria-hidden>
          <div className="absolute inset-x-0 top-0 h-[80vh] bg-[radial-gradient(70%_65%_at_50%_0%,rgba(255,255,255,0.9)_0%,transparent_70%)] dark:bg-[radial-gradient(70%_65%_at_50%_0%,rgba(184,150,90,0.14)_0%,transparent_70%)]" />
        </div>
      }
    >
      {/* ---------------- HERO ---------------- */}
      <Section tight className="pt-4 sm:pt-6 lg:pt-8">
        <motion.div
          className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16"
          initial="hidden"
          animate="visible"
          variants={stagger(0, 0.05)}
        >
          {partner ? (
            <motion.div variants={fadeUp} className="lg:order-2 lg:justify-self-center">
              <ClientSite href={partner.href} name={partner.ariaLabel}>
                <PartnerLogo p={partner} imgClass="h-20 w-auto md:h-28 lg:h-48 xl:h-56 2xl:h-64" sizes="(max-width: 1024px) 420px, 640px" />
              </ClientSite>
            </motion.div>
          ) : null}
          <div className="lg:order-1">
            <SoftTitle
              as="h1"
              lines={[...story.hero.titleLines, story.hero.titleAccent]}
              onLoad
              base={0.15}
              className={cn(HERO_TITLE.light, "font-heading font-extralight uppercase tracking-[0.005em] whitespace-nowrap", "leading-[1.1]")}
            />
            <motion.p variants={fadeUpAfter(0.6)} className="mt-7 max-w-[54ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl">
              {story.hero.sub}
            </motion.p>
          </div>

          <motion.dl
            variants={stagger(0.07, 0.85)}
            className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-[var(--story-line)] py-7 sm:grid-cols-3 lg:order-3 lg:col-span-2 lg:mt-2 lg:grid-cols-5"
          >
            {story.hero.meta.map((m) => (
              <motion.div key={m.label} variants={fadeUp}>
                <dt className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--story-accent)]">{m.label}</dt>
                {/* A field listing several things (the two projects) reads as separate lines, each with a dash. */}
                {Array.isArray(m.value) ? (
                  m.value.map((v) => (
                    <dd
                      key={v}
                      className="relative pl-4 font-heading text-xl font-light leading-tight text-foreground before:absolute before:left-0 before:top-[0.66em] before:h-px before:w-2 before:bg-[var(--story-accent)]"
                    >
                      {v}
                    </dd>
                  ))
                ) : (
                  <dd className="font-heading text-xl font-light leading-tight text-foreground">{m.value}</dd>
                )}
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>
      </Section>

      {/* ---------------- THE CLIENT ---------------- */}
      <Section>
        <Split
          leftReveal={false}
          left={
            <>
              <Eyebrow>{story.client.eyebrow}</Eyebrow>
              <Heading text={story.client.title} />
            </>
          }
          right={
            <>
              <Lead className="mb-6">{story.client.lead}</Lead>
              {story.client.body.map((paragraph) => (
                <Body key={paragraph}>{paragraph}</Body>
              ))}
            </>
          }
        />
      </Section>

      {/* ---------------- THE FILMS ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <div>
          <Eyebrow>{story.films.eyebrow}</Eyebrow>
          <Heading text={story.films.title} />
        </div>
        <div className="mt-14 grid gap-20 lg:gap-32">
          {story.films.items.map((film, i) => {
            // A missing entry is a wide placeholder; `null` is copy only (no frame).
            const media = i < films.length ? films[i] : { clip: null, orientation: "wide" as const };
            const index = String(i + 1).padStart(2, "0");
            return (
              <FilmEntry
                key={film.title}
                film={film}
                media={media}
                index={index}
                // The tall films alternate: the first on the left of its copy, the next on the right.
                side={i % 2 === 1 ? "left" : "right"}
                title={`${copy.name} · ${film.title}`}
                placeholder={story.films.placeholder.replace("{n}", index)}
              />
            );
          })}
        </div>
      </Section>

      {/* ---------------- THE CHALLENGE ---------------- */}
      <Section>
        <Split
          leftReveal={false}
          left={
            <>
              <Eyebrow>{story.challenge.eyebrow}</Eyebrow>
              <Heading text={story.challenge.title} />
            </>
          }
          right={
            <>
              <Lead className="mb-6">{story.challenge.lead}</Lead>
              {story.challenge.body.map((paragraph) => (
                <Body key={paragraph}>{paragraph}</Body>
              ))}
            </>
          }
        />
      </Section>

      {/* ---------------- THE APPROACH ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <div>
          <ArchMark />
          <Eyebrow>{story.principles.eyebrow}</Eyebrow>
          <Heading text={story.principles.title} className="max-w-[18ch]" />
        </div>
        <motion.div
          className="mt-14 grid gap-px border-y border-[var(--story-line)] bg-[var(--story-line)] md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.11)}
        >
          {story.principles.items.map((item, i) => (
            <motion.div key={item.title} variants={fadeUp} className="bg-[var(--story-ground)] py-9 md:pr-8 md:first:pl-0 md:[&:not(:first-child)]:pl-8">
              <span className="mb-5 block font-heading text-4xl font-light leading-none text-[var(--story-accent-bright)]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mb-3.5 text-sm font-medium uppercase tracking-[0.13em] text-[var(--story-accent)]">{item.title}</h3>
              <Body>{item.text}</Body>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ---------------- THE PROCESS ---------------- */}
      <Section>
        <div>
          <ArchMark />
          <Eyebrow>{story.process.eyebrow}</Eyebrow>
          <Heading text={story.process.title} />
        </div>
        <motion.ol className="mt-14 border-t border-[var(--story-line)]" initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.07)}>
          {story.process.steps.map((step, i) => (
            <motion.li
              key={step.title}
              variants={fadeUp}
              className="group relative grid grid-cols-[46px_minmax(0,1fr)] items-baseline gap-4 border-b border-[var(--story-line)] py-7 lg:grid-cols-[74px_minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-11"
            >
              <span className="font-heading text-2xl font-light leading-none text-[var(--story-accent)]">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-medium uppercase tracking-[0.13em] text-[var(--story-accent)]">{step.title}</span>
              <p className="col-start-2 m-0 text-[0.96rem] text-[var(--story-muted)] lg:col-start-3">{step.text}</p>
              {/* Accent underline that grows on hover. */}
              <span className="absolute bottom-[-1px] left-0 h-px w-0 bg-[var(--story-accent)] transition-[width] duration-500 ease-out group-hover:w-full" aria-hidden />
            </motion.li>
          ))}
        </motion.ol>
      </Section>

      {/* ---------------- THE HARD PARTS ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <div>
          <Eyebrow>{story.problems.eyebrow}</Eyebrow>
          <Heading text={story.problems.title} className="max-w-[20ch]" />
        </div>
        <motion.div
          className="mt-14 grid gap-px border-y border-[var(--story-line)] bg-[var(--story-line)]"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
        >
          {story.problems.pairs.map((pair) => (
            <motion.div key={pair.problem} variants={fadeUp} className="grid gap-6 bg-[var(--story-ground)] py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--story-muted)]">{story.problems.problemLabel}</p>
                <p className="text-[0.99rem] leading-relaxed text-[var(--story-muted)]">{pair.problem}</p>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--story-accent)]">{story.problems.solutionLabel}</p>
                <p className="text-[0.99rem] leading-relaxed text-foreground">{pair.solution}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ---------------- THE RESULT ---------------- */}
      <Section>
        <Split
          leftReveal={false}
          left={
            <>
              <ArchMark />
              <Eyebrow>{story.results.eyebrow}</Eyebrow>
              <Heading text={story.results.title} />
            </>
          }
          right={
            <>
              <Lead className="mb-6">{story.results.lead}</Lead>
              {story.results.body.map((paragraph) => (
                <Body key={paragraph}>{paragraph}</Body>
              ))}
            </>
          }
        />
        <motion.dl
          className="mt-16 grid gap-px border-y border-[var(--story-line)] bg-[var(--story-line)] sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.13)}
        >
          {story.results.stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="group bg-[color:color-mix(in_srgb,#C08F55_8%,var(--story-ground))] px-6 py-11 text-center">
              <dd className={cn("block font-heading text-6xl font-light leading-none transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:text-7xl", INK)}>
                {stat.num}
              </dd>
              <dt className="mt-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--story-muted)]">{stat.label}</dt>
            </motion.div>
          ))}
        </motion.dl>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        <CtaBand
          title={story.cta.title}
          quote={story.cta.quote}
          contact={story.cta.contact}
          tone="page"
          center
          className={cn(
            "rounded-3xl border border-[color:color-mix(in_srgb,#C08F55_30%,transparent)] bg-[color:color-mix(in_srgb,#C08F55_8%,var(--story-ground))] px-6 py-14 shadow-[0_30px_90px_-40px_rgba(192,143,85,0.5)] sm:py-16",
            "[&_h2]:font-extralight [&_h2]:uppercase [&_h2]:leading-[1.1]"
          )}
          titleNode={<SoftTitle as="span" lines={[story.cta.title]} className="block" />}
          eyebrow={<Eyebrow center>{story.cta.eyebrow}</Eyebrow>}
          lead={<Lead className="mx-auto mt-6 text-center">{story.cta.lead}</Lead>}
        >
          {/* The arches, faint, behind the copy. */}
          <Arches className="bottom-[6%] h-[74%] w-[84%] opacity-[0.14]" />
        </CtaBand>
      </Section>
    </StoryShell>
  );
}
