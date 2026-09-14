"use client";

import { type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n/language-context";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_REFERRER_POLICY } from "@/lib/youtube-embeds";
import { Body, CtaBand, Display, EASE, Eyebrow, Lead, PlayRing, Section, Split, StoryShell, VIEWPORT, fadeUp, Words, stagger } from "./primitives";

/*
 * Emblema's story - the editorial world: the client's accent from
 * `Project.accent` drives eyebrows / numerals / hairlines, sections alternate
 * between the page ground, a warm accent tint and warm-black bands with film
 * grain, headings are airy and uppercase, a small arch draws itself at the
 * head of the key sections and the film frames are arch-topped. Copy in
 * `projects.stories.emblema`; which films exist (and their YouTube ids) in
 * `Project.story.films`.
 */

/** Section surfaces: the page ground, a warm accent tint, or a warm black band with grain. */
type Surface = "paper" | "warm" | "dark";
const SURFACE: Record<Surface, string> = {
  paper: "",
  warm: "bg-[color:color-mix(in_srgb,var(--story-accent)_9%,var(--background))]",
  dark: "film-grain bg-[#141110] text-[#ece6e2] [--story-muted:rgba(236,230,226,0.62)] [--story-line:rgba(233,226,222,0.14)]",
};

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
        <span key={i} className="h-full flex-1 rounded-t-[50%/26%] border border-b-0 border-[#baa496]" />
      ))}
    </div>
  );
}

function FilmMedia({ videoId, orientation, title, placeholder }: { videoId: string | null; orientation: "wide" | "tall"; title: string; placeholder: string }) {
  const tall = orientation === "tall";
  const frame = cn(
    "relative w-full overflow-hidden border border-foreground/10 bg-[#1a1715]",
    tall ? "arch mx-auto aspect-[9/16] max-w-[430px]" : "arch-wide aspect-video"
  );
  if (videoId) {
    return (
      <div className={frame}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={title}
          allow={YOUTUBE_IFRAME_ALLOW}
          allowFullScreen
          loading="lazy"
          referrerPolicy={YOUTUBE_REFERRER_POLICY}
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
            "radial-gradient(115% 88% at 74% 4%, rgba(186,164,150,0.2) 0%, rgba(186,164,150,0) 62%), linear-gradient(162deg, #38241f 0%, #1e1917 60%, #121110 100%)",
        }}
      />
      <Arches />
      <span className="absolute bottom-[12%] left-[12%] right-[12%] h-px bg-[#baa496] opacity-50" aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center text-[#baa496]">
        <PlayRing className="border-[#baa496] bg-[#111010]/40" />
        <p className="text-[10px] font-bold uppercase tracking-[0.28em]">{placeholder}</p>
      </div>
    </div>
  );
}

function Band({ surface, tight, children }: { surface: Surface; tight?: boolean; children: ReactNode }) {
  return (
    <Section className={SURFACE[surface]} tight={tight}>
      {children}
    </Section>
  );
}

export function EmblemaStory({ project }: { project: Project }) {
  const { t } = useLanguage();
  const story = t.projects.stories.emblema;
  const copy = t.projects.items[project.id];
  const films = project.story?.films ?? [];
  const cover = films.find((film) => film.videoId)?.videoId ?? project.videoId;
  const style = {
    "--story-accent": project.accent[0],
    "--story-accent-bright": project.accent[1],
    "--story-muted": "var(--muted-foreground)",
    "--story-line": "color-mix(in srgb, var(--foreground) 13%, transparent)",
  } as CSSProperties;

  return (
    <StoryShell style={style} accent={project.accent[0]}>
      {/* ---------------- HERO ---------------- */}
      <header className="film-grain relative flex min-h-[min(92vh,860px)] items-end overflow-hidden bg-[#141110] py-24 text-[#ece6e2] sm:py-28">
        <div className="absolute inset-0" aria-hidden>
          {cover ? (
            <Image src={youtubeThumbnailUrl(cover)} alt="" fill priority sizes="100vw" className="scale-[1.08] object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(88% 72% at 78% 0%, rgba(186,164,150,0.3) 0%, rgba(186,164,150,0) 62%), linear-gradient(168deg, #3a2622 0%, #1c1715 58%, #100f0e 100%)",
              }}
            >
              <Arches className="left-auto right-[6%] h-[78%] w-[62%] translate-x-0 opacity-30" />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(20,17,16,0.96) 0%, rgba(20,17,16,0.6) 42%, rgba(20,17,16,0.32) 100%), linear-gradient(to right, rgba(20,17,16,0.66) 0%, rgba(20,17,16,0) 62%)",
            }}
          />
        </div>

        <motion.div
          className="relative z-[1] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 [--story-muted:rgba(236,230,226,0.62)] [--story-line:rgba(233,226,222,0.14)]"
          initial="hidden"
          animate="visible"
          variants={stagger(0.07, 0.1)}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.hero.eyebrow}</Eyebrow>
          </motion.div>
          <h1 className="font-heading text-[clamp(1.9rem,5vw,4.2rem)] font-extralight uppercase leading-[1.1] tracking-[0.005em]">
            {story.hero.titleLines.map((line, i) => (
              <span key={line} className="block whitespace-nowrap">
                <Words text={line} base={0.1 + i * 0.16} />
              </span>
            ))}
            <span className="block whitespace-nowrap text-[var(--story-accent-bright)]">
              <Words text={story.hero.titleAccent} base={0.1 + story.hero.titleLines.length * 0.16} />
            </span>
          </h1>
          <motion.p variants={fadeUp} className="mt-7 max-w-[54ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl">
            {story.hero.sub}
          </motion.p>

          <motion.dl
            variants={stagger(0.07, 0.5)}
            className="mt-12 grid grid-cols-1 gap-px border-y border-[var(--story-line)] bg-[var(--story-line)] sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]"
          >
            {story.hero.meta.map((m) => (
              <motion.div key={m.label} variants={fadeUp} className="bg-[#141110] px-5 py-5 first:pl-0">
                <dt className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--story-accent-bright)]">{m.label}</dt>
                <dd className="font-heading text-xl font-light leading-tight text-[#ece6e2]">{m.value}</dd>
              </motion.div>
            ))}
          </motion.dl>
          <span className="relative mt-10 block h-12 w-px overflow-hidden bg-gradient-to-b from-[#baa496] to-transparent" aria-hidden>
            <motion.span
              className="absolute inset-0 bg-[#baa496]"
              animate={{ y: ["-100%", "100%", "100%"] }}
              transition={{ duration: 2.6, ease: [0.65, 0, 0.35, 1], repeat: Infinity, times: [0, 0.55, 1] }}
            />
          </span>
        </motion.div>
      </header>

      {/* ---------------- THE CLIENT ---------------- */}
      <Band surface="paper">
        <Split
          left={
            <>
              <Eyebrow>{story.client.eyebrow}</Eyebrow>
              <Display tone="light" text={story.client.title} className="text-3xl sm:text-4xl lg:text-5xl" />
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
      </Band>

      {/* ---------------- THE FILMS ---------------- */}
      <Band surface="warm">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeUp}>
          <Eyebrow>{story.films.eyebrow}</Eyebrow>
          <Display tone="light" text={story.films.title} className="text-3xl sm:text-4xl lg:text-5xl" />
        </motion.div>
        <div className="mt-14 grid gap-20 lg:gap-32">
          {story.films.items.map((film, i) => {
            const media = films[i] ?? { videoId: null, orientation: "wide" as const };
            const index = String(i + 1).padStart(2, "0");
            return (
              <motion.div key={film.title} initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeUp}>
                <FilmMedia
                  videoId={media.videoId}
                  orientation={media.orientation}
                  title={`${copy.name} · ${film.title}`}
                  placeholder={story.films.placeholder.replace("{n}", index)}
                />
                <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16">
                  <div>
                    <span className="mb-3 block font-heading text-sm tracking-[0.22em] text-[var(--story-accent)]">{index}</span>
                    <h3 className="font-heading text-2xl font-extralight uppercase leading-[1.16] sm:text-3xl">
                      <Words text={film.title} />
                    </h3>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--story-muted)]">{film.project}</p>
                  </div>
                  <div>
                    <Body>{film.text}</Body>
                    <motion.ul
                      className="mt-6 flex flex-wrap gap-2.5 border-t border-[var(--story-line)] pt-5"
                      initial="hidden"
                      whileInView="visible"
                      viewport={VIEWPORT}
                      variants={stagger(0.07, 0.15)}
                    >
                      {film.tags.map((tag) => (
                        <motion.li
                          key={tag}
                          variants={fadeUp}
                          className="rounded-full border border-[color:color-mix(in_srgb,var(--story-accent)_35%,transparent)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--story-accent)]"
                        >
                          {tag}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Band>

      {/* ---------------- THE CHALLENGE ---------------- */}
      <Band surface="paper">
        <Split
          left={
            <>
              <Eyebrow>{story.challenge.eyebrow}</Eyebrow>
              <Display tone="light" text={story.challenge.title} className="text-3xl sm:text-4xl lg:text-5xl" />
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
      </Band>

      {/* ---------------- THE APPROACH ---------------- */}
      <Band surface="dark">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeUp}>
          <ArchMark />
          <Eyebrow>{story.principles.eyebrow}</Eyebrow>
          <Display tone="light" text={story.principles.title} className="max-w-[18ch] text-3xl sm:text-4xl lg:text-5xl" />
        </motion.div>
        <motion.div
          className="mt-14 grid gap-px border-y border-[var(--story-line)] bg-[var(--story-line)] md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.11)}
        >
          {story.principles.items.map((item, i) => (
            <motion.div key={item.title} variants={fadeUp} className="bg-[#141110] py-9 md:pr-8 md:first:pl-0 md:[&:not(:first-child)]:pl-8">
              <span className="mb-5 block font-heading text-4xl font-light leading-none text-[var(--story-accent-bright)]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mb-3.5 text-sm font-medium uppercase tracking-[0.13em]">{item.title}</h3>
              <Body>{item.text}</Body>
            </motion.div>
          ))}
        </motion.div>
      </Band>

      {/* ---------------- THE PROCESS ---------------- */}
      <Band surface="paper">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeUp}>
          <ArchMark />
          <Eyebrow>{story.process.eyebrow}</Eyebrow>
          <Display tone="light" text={story.process.title} className="text-3xl sm:text-4xl lg:text-5xl" />
        </motion.div>
        <motion.ol className="mt-14 border-t border-[var(--story-line)]" initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger(0.07)}>
          {story.process.steps.map((step, i) => (
            <motion.li
              key={step.title}
              variants={fadeUp}
              className="group relative grid grid-cols-[46px_minmax(0,1fr)] items-baseline gap-4 border-b border-[var(--story-line)] py-7 lg:grid-cols-[74px_minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-11"
            >
              <span className="font-heading text-2xl font-light leading-none text-[var(--story-accent)]">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-medium uppercase tracking-[0.13em] text-foreground">{step.title}</span>
              <p className="col-start-2 m-0 text-[0.96rem] text-[var(--story-muted)] lg:col-start-3">{step.text}</p>
              {/* Accent underline that grows on hover. */}
              <span className="absolute bottom-[-1px] left-0 h-px w-0 bg-[var(--story-accent)] transition-[width] duration-500 ease-out group-hover:w-full" aria-hidden />
            </motion.li>
          ))}
        </motion.ol>
      </Band>

      {/* ---------------- THE HARD PARTS ---------------- */}
      <Band surface="dark">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeUp}>
          <Eyebrow>{story.problems.eyebrow}</Eyebrow>
          <Display tone="light" text={story.problems.title} className="max-w-[20ch] text-3xl sm:text-4xl lg:text-5xl" />
        </motion.div>
        <motion.div
          className="mt-14 grid gap-px border-y border-[var(--story-line)] bg-[var(--story-line)]"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
        >
          {story.problems.pairs.map((pair) => (
            <motion.div key={pair.problem} variants={fadeUp} className="grid gap-6 bg-[#141110] py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--story-muted)]">{story.problems.problemLabel}</p>
                <p className="text-[0.99rem] leading-relaxed text-[var(--story-muted)]">{pair.problem}</p>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--story-accent-bright)]">{story.problems.solutionLabel}</p>
                <p className="text-[0.99rem] leading-relaxed text-[#ece6e2]">{pair.solution}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Band>

      {/* ---------------- THE RESULT ---------------- */}
      <Band surface="warm">
        <Split
          left={
            <>
              <ArchMark />
              <Eyebrow>{story.results.eyebrow}</Eyebrow>
              <Display tone="light" text={story.results.title} className="text-3xl sm:text-4xl lg:text-5xl" />
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
            <motion.div key={stat.label} variants={fadeUp} className="group bg-[color:color-mix(in_srgb,var(--story-accent)_9%,var(--background))] px-6 py-11 text-center">
              <dd className="block font-heading text-6xl font-light leading-none text-[var(--story-accent)] transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:text-7xl">
                {stat.num}
              </dd>
              <dt className="mt-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--story-muted)]">{stat.label}</dt>
            </motion.div>
          ))}
        </motion.dl>
      </Band>

      {/* ---------------- CTA ---------------- */}
      <Band surface="dark" tight>
        <CtaBand
          title={story.cta.title}
          quote={story.cta.quote}
          contact={story.cta.contact}
          tone="dark"
          center
          className="[&_h2]:font-extralight [&_h2]:uppercase [&_h2]:leading-[1.1]"
          eyebrow={<Eyebrow center>{story.cta.eyebrow}</Eyebrow>}
          lead={<Lead className="mx-auto mt-6 text-center">{story.cta.lead}</Lead>}
        />
      </Band>
    </StoryShell>
  );
}
