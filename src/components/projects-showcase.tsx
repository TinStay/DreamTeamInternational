"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { IconArrowDown, IconCircleArrowRightFilled } from "@tabler/icons-react";
import { ProjectCard, ProjectTagChips } from "@/components/projects-section";
import {
  clamp,
  clamp01,
  easeInOut,
  easeOut,
  lerp,
  Reveal,
  ParallaxLayer,
} from "@/components/projects/showcase-primitives";
import { sceneVisualFor, type MorphTarget } from "@/components/projects/showcase-scenes";
import { primaryGradientInteractiveClassName } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { SHOWCASE_PROJECTS, type Project } from "@/lib/projects";
import { projectPath, projectsPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

/*
 * Scroll timeline, measured in "units" (1 unit = one viewport of scroll):
 *
 *   [ INTRO ][ SPAN ][ SPAN ] … [ SPAN ][ OUTRO ]
 *
 * INTRO: the cinema headline scales/blurs away, then the curtains (page
 * colour) open on the first project. Each project then owns one SPAN: the
 * first HOLD share it sits framed (with a slow 4% push-in), the rest it hands
 * over to the next project with one of the TRANSITIONS. OUTRO keeps the last
 * project framed a moment before the page scrolls on. Kept short (≈0.9
 * viewport per project) so a couple of wheel ticks advance a scene; the
 * spring below is stiff enough that the frame sequences track the wheel
 * without visible lag.
 */
const PROJECTS = SHOWCASE_PROJECTS;
const COUNT = PROJECTS.length;
const INTRO = 0.7;
const SPAN = 0.9;
const OUTRO = 0.3;
const UNITS = INTRO + COUNT * SPAN + OUTRO;
const HOLD = 0.5;
/** Hand-over i → i+1 cycles through these (`flow` = diagonal light-wipe). */
const TRANSITIONS = ["flow", "push", "pushX", "zoomOut"] as const;
type Transition = (typeof TRANSITIONS)[number];
const transitionFor = (index: number): Transition => TRANSITIONS[index % TRANSITIONS.length];

/* ------------------------------------------------------------------------ */
/* Scene geometry                                                             */
/* ------------------------------------------------------------------------ */

type SceneFrame = {
  opacity: number;
  transform: string;
  filter: string;
  clipPath: string;
  zIndex: number;
  visibility: "visible" | "hidden";
};

const HIDDEN_FRAME: SceneFrame = {
  opacity: 0,
  transform: "none",
  filter: "none",
  clipPath: "none",
  zIndex: 0,
  visibility: "hidden",
};

/**
 * Where scene `index` is for local time `t` (0 = framed, -1 = one span before,
 * +1 = one span after). Outgoing scenes (t ≥ 0) play the transition that
 * leads to the next project; incoming ones (t < 0) play the transition that
 * led from the previous project. Incoming scenes sit *below* the outgoing one
 * until their transition starts, so nothing peeks through during the hold.
 */
function sceneFrame(t: number, index: number): SceneFrame {
  // The first scene is revealed by the curtains - always solid until it leaves.
  const beforeFirst = index === 0 && t <= 0;
  if (!beforeFirst && (t <= -1 || t >= 1)) return HIDDEN_FRAME;

  const frame: SceneFrame = {
    opacity: 1,
    transform: "none",
    filter: "none",
    clipPath: "none",
    zIndex: 10 - index,
    visibility: "visible",
  };
  if (beforeFirst) return frame;

  const out = t >= 0;
  const type = out
    ? index < COUNT - 1
      ? transitionFor(index)
      : null
    : transitionFor(index - 1);
  const local = out ? t : t + 1;
  const hold = type === "flow" ? 0.25 : HOLD;
  const k = type ? easeInOut(clamp01((local - hold) / (1 - hold))) : 0;
  const holdScale = out ? 1 + 0.04 * Math.min(t / HOLD, 1) : 1;
  if (out) frame.transform = `scale(${holdScale})`;
  if (!type) return frame;

  switch (type) {
    case "flow": {
      // Outgoing scene lifts, desaturates and brightens; the next one is
      // revealed underneath by a soft diagonal wipe sweeping bottom → top.
      if (out) {
        frame.transform = `scale(${holdScale + 0.06 * k}) translate3d(0, ${-5 * k}%, 0)`;
        frame.filter = `saturate(${1 - 0.5 * k}) brightness(${1 + 0.3 * k})`;
        frame.zIndex = 11;
      } else {
        const edge = 125 - 150 * k;
        frame.clipPath = `polygon(0 ${edge + 22}%, 100% ${edge - 22}%, 100% 100%, 0 100%)`;
        frame.transform = `scale(${1.04 - 0.04 * k})`;
        frame.zIndex = 12;
      }
      break;
    }
    case "push":
      frame.transform = out
        ? `translate3d(0, ${-100 * k}%, 0) scale(${holdScale})`
        : `translate3d(0, ${100 * (1 - k)}%, 0)`;
      frame.zIndex = out ? 11 : 12;
      break;
    case "pushX":
      frame.transform = out
        ? `translate3d(${-100 * k}%, 0, 0) scale(${holdScale - 0.08 * k})`
        : `translate3d(${100 * (1 - k)}%, 0, 0)`;
      if (out) frame.opacity = 1 - 0.3 * k;
      frame.zIndex = out ? 11 : 12;
      break;
    case "zoomOut":
      if (out) {
        frame.transform = `scale(${holdScale - 0.3 * k})`;
        frame.opacity = 1 - k;
      } else {
        frame.transform = `scale(${1 + 0.3 * (1 - k)})`;
        frame.opacity = k;
        frame.zIndex = 15;
      }
      break;
  }
  return frame;
}

/* ------------------------------------------------------------------------ */
/* Scene = brand world + shared text overlay                                  */
/* ------------------------------------------------------------------------ */

const TONE = {
  dark: {
    eyebrow: "text-white/70",
    headline: "text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]",
    highlight: "text-white/85",
    cta: "bg-white text-neutral-900 shadow-[0_12px_32px_rgba(255,255,255,0.2)] hover:bg-white/90 hover:shadow-[0_16px_40px_rgba(255,255,255,0.3)]",
  },
  light: {
    eyebrow: "text-neutral-600",
    headline: "text-neutral-900",
    highlight: "text-neutral-700",
    cta: "bg-neutral-900 text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)] hover:bg-neutral-800 hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
  },
} as const;

/**
 * Where the copy block sits per `SceneVisual.layout`. Bottom padding below lg
 * clears the mobile dock; `top-left` keeps clear of the floating header pill;
 * `center` sits a touch below the middle to leave the top for a wordmark.
 */
const TEXT_LAYOUT = {
  "bottom-left":
    "left-5 right-10 bottom-28 sm:left-8 sm:right-14 lg:bottom-12 lg:left-12 lg:right-auto lg:max-w-[46vw]",
  center:
    "inset-x-5 top-[54%] -translate-y-1/2 items-center text-center sm:inset-x-8 lg:inset-x-0 lg:mx-auto lg:max-w-[64ch]",
  "top-left":
    "left-5 right-10 top-[max(7.5rem,18vh)] sm:left-8 sm:right-14 lg:left-12 lg:right-auto lg:top-[max(9.5rem,24vh)] lg:max-w-[40vw]",
} as const;

/** The scene root's position on stage for local time `t` (see `sceneFrame`), as motion values. */
function useSceneFrameStyle(t: MotionValue<number>, index: number, zBoost = 0) {
  const opacity = useTransform(t, (v) => sceneFrame(v, index).opacity);
  const transform = useTransform(t, (v) => sceneFrame(v, index).transform);
  const filter = useTransform(t, (v) => sceneFrame(v, index).filter);
  const clipPath = useTransform(t, (v) => sceneFrame(v, index).clipPath);
  const zIndex = useTransform(t, (v) => sceneFrame(v, index).zIndex + zBoost);
  const visibility = useTransform(t, (v) => sceneFrame(v, index).visibility);
  return { opacity, transform, filter, clipPath, zIndex, visibility };
}

/**
 * One full-screen project scene: the brand world from `showcase-scenes.tsx`
 * underneath, the shared copy block on top - client name, headline,
 * highlight, result tags and CTA where the scene's `layout` puts them - on
 * its own parallax depth and revealed in a stagger as the scene frames.
 */
function ProjectScene({
  project,
  index,
  u,
  shouldMount,
  framesEnabled,
}: {
  project: Project;
  index: number;
  /** Timeline position in units (see the header comment). */
  u: MotionValue<number>;
  /** Keep only the neighbours' players alive - several autoplaying iframes is too much. */
  shouldMount: boolean;
  framesEnabled: boolean;
}) {
  const { t: dict, language } = useLanguage();
  const p = dict.projects;
  const copy = p.items[project.id];
  const { tone, background, layout, Visual } = sceneVisualFor(project);
  const colors = TONE[tone];

  const t = useTransform(u, (v) => (v - INTRO) / SPAN - index);
  const frameStyle = useSceneFrameStyle(t, index);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden will-change-[transform,opacity]"
      style={{ ...frameStyle, backgroundColor: background }}
    >
      <Visual project={project} t={t} shouldMount={shouldMount} framesEnabled={framesEnabled} />

      {/* Name, headline, highlight, tags, CTA - placed per scene layout. */}
      <ParallaxLayer t={t} depth={0.7} dx={-0.05} className="pointer-events-none">
        <div className={cn("absolute flex flex-col gap-4 sm:gap-5", TEXT_LAYOUT[layout])}>
          <Reveal t={t} delay={0.04}>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", colors.eyebrow)}>{copy.name}</p>
          </Reveal>
          <Reveal t={t} delay={0.1}>
            <h3
              className={cn(
                "font-heading text-3xl font-bold leading-[1.02] text-balance sm:text-4xl lg:text-5xl xl:text-6xl",
                colors.headline
              )}
            >
              {copy.headline}
            </h3>
          </Reveal>
          <Reveal t={t} delay={0.17} className={layout === "center" ? "flex justify-center" : undefined}>
            <p className={cn("max-w-[38ch] text-base leading-relaxed text-pretty sm:text-lg lg:text-xl", colors.highlight)}>
              {copy.highlight}
            </p>
          </Reveal>
          <Reveal t={t} delay={0.2} className={layout === "center" ? "flex justify-center" : undefined}>
            <ProjectTagChips
              project={project}
              variant="highlights"
              tone={tone}
              className={layout === "center" ? "justify-center" : undefined}
            />
          </Reveal>
          <Reveal t={t} delay={0.26} className="pointer-events-auto">
            <Link
              href={projectPath(language, project.id)}
              className={cn(
                "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold transition-[transform,background-color,box-shadow] duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] lg:h-12 lg:px-6 lg:text-base",
                colors.cta
              )}
            >
              {p.viewProject}
              <IconCircleArrowRightFilled className="size-5 shrink-0" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </ParallaxLayer>
    </motion.div>
  );
}

/**
 * A scene's `Overlay` (e.g. the Plasico wordmark), drawn *above* the morph
 * shape but moving exactly with its scene - same frame transform, z lifted
 * over the overlay's layer.
 */
function SceneOverlay({
  project,
  index,
  u,
  shouldMount,
  framesEnabled,
}: {
  project: Project;
  index: number;
  u: MotionValue<number>;
  shouldMount: boolean;
  framesEnabled: boolean;
}) {
  const { Overlay } = sceneVisualFor(project);
  const t = useTransform(u, (v) => (v - INTRO) / SPAN - index);
  const frameStyle = useSceneFrameStyle(t, index, 10);
  if (!Overlay) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={frameStyle}>
      <Overlay project={project} t={t} shouldMount={shouldMount} framesEnabled={framesEnabled} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------------ */
/* Stage furniture                                                            */
/* ------------------------------------------------------------------------ */

const MORPH_TARGETS: MorphTarget[] = PROJECTS.map((project) => sceneVisualFor(project).morph);

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/**
 * The one shape that travels between worlds: size, position, colour and
 * alpha are interpolated from scene i's `morph` target to scene i+1's during
 * each hand-over (with a quarter-turn wobble in the middle), so the Mindguard
 * hairline stretches into the Plasico bar and swells into the OSMO circle.
 * Always pill-shaped (radius ≥ half the smaller side), like the reference.
 */
function MorphOverlay({ u }: { u: MotionValue<number> }) {
  const state = useTransform(u, (v) => {
    const uc = (v - INTRO) / SPAN;
    const i0 = clamp(Math.floor(uc), 0, COUNT - 1);
    const i1 = Math.min(i0 + 1, COUNT - 1);
    const f = uc - i0;
    const k = uc < 0 ? 0 : easeInOut(clamp01((f - HOLD) / (1 - HOLD)));
    const A = MORPH_TARGETS[i0];
    const B = MORPH_TARGETS[i1];
    const ca = hexToRgb(A.color);
    const cb = hexToRgb(B.color);
    const rgb = ca.map((c, j) => Math.round(lerp(c, cb[j], k))).join(",");
    // A scene that draws the shape itself keeps the overlay hidden while framed (fast 6% hand-off).
    const ownHide = A.ownsShape ? 1 - clamp01((f - HOLD) / 0.06) : B.ownsShape ? k : 0;
    const endFade = clamp01(1 - (uc - (COUNT - 1) - 0.35) * 3);
    const px = lerp(A.px ?? 0, B.px ?? 0, k);
    return {
      width: `calc(${lerp(A.w[0], B.w[0], k) * 100}% + ${lerp(A.w[1], B.w[1], k) * 100}svh + ${px}px)`,
      height: `calc(${lerp(A.h[0], B.h[0], k) * 100}% + ${lerp(A.h[1], B.h[1], k) * 100}svh + ${px}px)`,
      left: `${lerp(A.x, B.x, k) * 100}%`,
      top: `${lerp(A.y, B.y, k) * 100}%`,
      rotate: k * (1 - k) * 90,
      backgroundColor: `rgba(${rgb},${lerp(A.alpha, B.alpha, k)})`,
      mixBlendMode: (k < 0.5 ? A : B).blend ?? "normal",
      opacity: clamp01((v - 0.7) * 3) * endFade * (1 - ownHide),
    };
  });
  const width = useTransform(state, (o) => o.width);
  const height = useTransform(state, (o) => o.height);
  const left = useTransform(state, (o) => o.left);
  const top = useTransform(state, (o) => o.top);
  const rotate = useTransform(state, (o) => o.rotate);
  const backgroundColor = useTransform(state, (o) => o.backgroundColor);
  const mixBlendMode = useTransform(state, (o) => o.mixBlendMode);
  const opacity = useTransform(state, (o) => o.opacity);
  return (
    <motion.div
      className="pointer-events-none absolute z-[16] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-[transform,width,height]"
      style={{ width, height, left, top, rotate, backgroundColor, mixBlendMode, opacity }}
      aria-hidden
    />
  );
}

/** One rail bar: fills top → bottom as its project approaches; click jumps to it. */
function RailBar({
  u,
  index,
  label,
  isActive,
  onJump,
}: {
  u: MotionValue<number>;
  index: number;
  label: string;
  isActive: boolean;
  onJump: (index: number) => void;
}) {
  const scaleY = useTransform(u, (v) => clamp01((v - INTRO) / SPAN - index + 1));
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={label}
      onClick={() => onJump(index)}
      className="group cursor-pointer px-2 py-0.5 transition-transform duration-200 ease-out hover:-translate-x-0.5"
    >
      <span className="block h-9 w-0.5 overflow-hidden rounded-full bg-white/25 transition-[background-color] duration-200 group-hover:bg-white/45 sm:h-11">
        <motion.span className="block h-full w-full origin-top bg-white" style={{ scaleY }} />
      </span>
    </button>
  );
}

/** Scroll position (px) at which project `index` is framed in the sticky stage. */
function scrollTargetFor(section: HTMLElement, stage: HTMLElement, index: number) {
  const top = section.getBoundingClientRect().top + window.scrollY;
  const travel = section.offsetHeight - stage.offsetHeight;
  return top + ((INTRO + index * SPAN) / UNITS) * travel;
}

/* ------------------------------------------------------------------------ */
/* Section                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Scroll-driven "case studies journey" (home page). A sticky stage pins one
 * full-screen brand world per project (`SHOWCASE_PROJECTS`, scenes in
 * `projects/showcase-scenes.tsx`); the scroll position is smoothed with a
 * spring and mapped onto a timeline in viewport units: a cinema-style intro
 * (headline scales away, black curtains open), then each project holds and
 * hands over with a wipe / push / zoom, parallax layers drifting at their own
 * depth. Right-hand rail = counter + per-project progress bars (also jump
 * buttons). Reduced-motion users get the plain card list.
 */
export function ProjectsShowcase({ className }: { className?: string }) {
  const { t, language } = useLanguage();
  const p = t.projects;
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Frame sequences (≈8 MB of webp) only start loading once the section is close.
  const framesEnabled = useInView(sectionRef, { once: true, margin: "800px 0px 800px 0px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  // Over-damped so the stage glides after each wheel tick without overshooting,
  // but quick (~50 ms) so canvases and players don't trail the scroll.
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.5, restDelta: 0.0002 });
  const u = useTransform(smooth, (v) => v * UNITS);

  useMotionValueEvent(u, "change", (v) => {
    const next = clamp(Math.round((v - INTRO) / SPAN), 0, COUNT - 1);
    setActive((prev) => (prev === next ? prev : next));
  });

  // Intro: headline scales up, blurs and fades; curtains open right after.
  const introT = useTransform(u, (v) => clamp01(v));
  const introGone = useTransform(introT, (v) => easeOut(clamp01((v - 0.2) / 0.3)));
  const introOpacity = useTransform(introGone, (v) => 1 - v);
  const introScale = useTransform(introT, (v) => 1 + v * 0.35);
  const introY = useTransform(introT, (v) => -v * 40);
  const introFilter = useTransform(introGone, (v) => `blur(${v * 10}px)`);
  const introVisibility = useTransform(introGone, (v) => (v >= 1 ? "hidden" : "visible"));
  const curtainScale = useTransform(u, (v) => 1 - easeOut(clamp01((v - 0.5) / 0.5)));
  const curtainVisibility = useTransform(curtainScale, (v) => (v <= 0.001 ? "hidden" : "visible"));
  // Rail + "view all": in once the first scene is framed, out with the last one.
  const furnitureOpacity = useTransform(u, (v) => {
    const uc = (v - INTRO) / SPAN;
    return clamp01((v - 0.8) * 3) * clamp01(1 - (uc - (COUNT - 1) - 0.35) * 3);
  });

  const jumpTo = useCallback((index: number) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    window.scrollTo({ top: scrollTargetFor(section, stage, index), behavior: "smooth" });
  }, []);

  if (reduceMotion) {
    return (
      <section id="projects" className={cn("relative w-full py-12 sm:py-16", className)}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <h2 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            {p.title1} <span className="text-section-accent">{p.title2}</span>
          </h2>
          {PROJECTS.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </section>
    );
  }

  const counter = `${String(active + 1).padStart(2, "0")} / ${String(COUNT).padStart(2, "0")}`;

  return (
    <>
      <section
        id="projects"
        ref={sectionRef}
        className={cn("relative w-full", className)}
        style={{ height: `${UNITS * 100}svh` }}
      >
        {/* Transparent stage: the page background shows through the intro and between scenes. */}
        <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
          {/* Intro headline - the section title, cinema style. */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6 text-center will-change-[transform,opacity]"
            style={{
              opacity: introOpacity,
              scale: introScale,
              y: introY,
              filter: introFilter,
              visibility: introVisibility,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{p.showcase.eyebrow}</p>
            <h2 className="font-heading text-5xl font-bold leading-none tracking-tight text-balance text-foreground md:text-7xl lg:text-8xl">
              {p.showcase.title1} <span className="text-section-accent">{p.showcase.title2}</span>
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">{p.showcase.subtitle}</p>
            <p className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <IconArrowDown className="size-4 animate-bounce" aria-hidden />
              {p.scrollHint}
            </p>
          </motion.div>

          {/* Curtains: two page-coloured halves that open on the first project. */}
          <motion.div
            className="absolute inset-x-0 top-0 z-[19] h-1/2 origin-top bg-background will-change-transform"
            style={{ scaleY: curtainScale, visibility: curtainVisibility }}
            aria-hidden
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 z-[19] h-1/2 origin-bottom bg-background will-change-transform"
            style={{ scaleY: curtainScale, visibility: curtainVisibility }}
            aria-hidden
          />

          {/* Scenes */}
          <div className="absolute inset-0">
            {PROJECTS.map((project, index) => (
              <ProjectScene
                key={project.id}
                project={project}
                index={index}
                u={u}
                shouldMount={Math.abs(index - active) <= 1}
                framesEnabled={framesEnabled}
              />
            ))}
            <MorphOverlay u={u} />
            {PROJECTS.map((project, index) =>
              sceneVisualFor(project).Overlay ? (
                <SceneOverlay
                  key={project.id}
                  project={project}
                  index={index}
                  u={u}
                  shouldMount={Math.abs(index - active) <= 1}
                  framesEnabled={framesEnabled}
                />
              ) : null
            )}
          </div>

          {/* "View all" - top-right, above the scenes (difference-blended so it reads on light worlds too). */}
          <motion.div
            className="absolute right-5 top-24 z-30 hidden mix-blend-difference sm:right-8 sm:block lg:right-12 lg:top-28"
            style={{ opacity: furnitureOpacity }}
          >
            <Link
              href={projectsPath(language)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-[1px] hover:bg-white/15"
            >
              {p.viewAll}
              <IconCircleArrowRightFilled className="size-4" aria-hidden />
            </Link>
          </motion.div>

          {/* Progress rail: counter + one bar per project (jump buttons). */}
          <motion.div
            className="absolute right-1 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-3 mix-blend-difference sm:right-4 lg:right-8"
            style={{ opacity: furnitureOpacity }}
          >
            <p className="pr-2 font-mono text-xs font-semibold tracking-[0.14em] text-white">{counter}</p>
            <div className="flex flex-col gap-1" role="tablist" aria-label={p.showcase.railLabel}>
              {PROJECTS.map((project, index) => (
                <RailBar
                  key={project.id}
                  u={u}
                  index={index}
                  label={p.items[project.id].name}
                  isActive={index === active}
                  onJump={jumpTo}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Big CTA below the showcase */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl justify-center px-4 py-12 sm:py-16">
        <Link
          href={projectsPath(language)}
          className={cn(
            primaryGradientInteractiveClassName,
            "inline-flex h-14 cursor-pointer items-center gap-3 rounded-full px-8 text-base font-bold sm:h-16 sm:px-10 sm:text-lg"
          )}
        >
          {p.viewAll}
          <IconCircleArrowRightFilled className="size-6 shrink-0" aria-hidden />
        </Link>
      </div>
    </>
  );
}
