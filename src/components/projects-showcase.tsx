"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
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
import { IconArrowDown } from "@tabler/icons-react";
import { ProjectCard } from "@/components/projects-section";
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
import {
  OSMO_COPY_FADE,
  OSMO_OUTRO_START,
  SCENE_FRAMED,
  SHOWCASE_HOLD,
  SHOWCASE_HOLD_MOBILE,
  SHOWCASE_INTRO,
  SHOWCASE_SPAN,
  SHOWCASE_UNITS,
} from "@/components/projects/showcase-timeline";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { useLanguage } from "@/lib/i18n/language-context";
import { useMediaQuery } from "@/lib/use-media-query";
import { PARTNERS, PARTNER_ICON_BASE } from "@/lib/partners";
import { SHOWCASE_PROJECTS, type Project } from "@/lib/projects";
import { projectPath } from "@/lib/routes";
import { scrollToY, useScrollEased } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";
import { SnapStop } from "@/components/ui/snap-stop";

/*
 * Scroll timeline, measured in "units" (1 unit = one viewport of scroll):
 *
 *   [ INTRO ][ SPAN ][ SPAN ] … [ SPAN ][ OUTRO ]
 *
 * INTRO: the cinema headline scales/blurs away, then the first project is
 * revealed through a curtain-style clip (the page background stays visible
 * around it). Each project then owns one SPAN: the first HOLD share it sits
 * framed (with a slow 4% push-in), the rest it hands over to the next project
 * with one of the TRANSITIONS. The timeline ends with the last project still
 * framed (only its hold), so the sticky stage simply scrolls away into the
 * next section - no empty tail. About 0.7 viewport of scroll per project -
 * most of it the framed stay, the hand-over a fifth of a viewport; the spring
 * below is stiff enough that the frame sequences track the wheel without
 * visible lag.
 */
const PROJECTS = SHOWCASE_PROJECTS;
const COUNT = PROJECTS.length;
const INTRO = SHOWCASE_INTRO;
const SPAN = SHOWCASE_SPAN;
const HOLD = SHOWCASE_HOLD;
const UNITS = SHOWCASE_UNITS;
/** Curtain reveal of the first scene, in timeline units. */
const CURTAIN_START = 0.35;
const CURTAIN_END = INTRO;
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
 * `hold` is where the hand-over starts (the hold on desktop, earlier on
 * phones so the next scene moves with the finger).
 */
function sceneFrame(t: number, index: number, hold: number = HOLD): SceneFrame {
  // The first scene is revealed by the curtains - always solid until it leaves.
  const beforeFirst = index === 0 && t <= 0;
  // The last scene has nothing to hand over to: it stays framed while the stage scrolls away.
  const last = index === COUNT - 1 && t >= 0;
  if (!beforeFirst && !last && (t <= -1 || t >= 1)) return HIDDEN_FRAME;

  const frame: SceneFrame = {
    opacity: 1,
    transform: "none",
    filter: "none",
    clipPath: "none",
    zIndex: 10 - index,
    visibility: "visible",
  };
  if (beforeFirst) {
    // Curtains: the scene opens from a horizontal slit at mid-height (the intro's letterbox streak is on the same
    // line) - eased in and out, so it grows out of the line gently and settles.
    const u = t * SPAN + INTRO;
    const open = easeInOut(clamp01((u - CURTAIN_START) / (CURTAIN_END - CURTAIN_START)));
    const inset = 50 * (1 - open);
    frame.clipPath = open >= 1 ? "none" : `inset(${inset}% 0 ${inset}% 0)`;
    frame.visibility = open <= 0.001 ? "hidden" : "visible";
    return frame;
  }

  const out = t >= 0;
  const type = out
    ? index < COUNT - 1
      ? transitionFor(index)
      : null
    : transitionFor(index - 1);
  const local = out ? t : t + 1;
  // The flow wipe is the slow one: on desktop it starts a little before the hold ends.
  const start = type === "flow" ? Math.max(hold - 0.1, SHOWCASE_HOLD_MOBILE) : hold;
  const k = type ? easeInOut(clamp01((local - start) / (1 - start))) : 0;
  const holdScale = out ? 1 + 0.04 * Math.min(t / HOLD, 1) : 1;
  if (out) frame.transform = `scale(${holdScale})`;
  if (!type) {
    // Last scene: fade away at the very end so the page background shows through the transparent stage.
    if (last) {
      frame.opacity = 1 - easeInOut(clamp01((t - (HOLD - 0.05)) / 0.05));
      if (frame.opacity <= 0.001) frame.visibility = "hidden";
    }
    return frame;
  }

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
      // Outgoing keeps scale ≥ 1 so no gap opens between the two while they slide.
      frame.transform = out
        ? `translate3d(${-100 * k}%, 0, 0) scale(${holdScale})`
        : `translate3d(${100 * (1 - k)}%, 0, 0)`;
      if (out) frame.opacity = 1 - 0.3 * k;
      frame.zIndex = out ? 11 : 12;
      break;
    case "zoomOut":
      // The incoming scene fades in fast on top; the outgoing one only fades
      // once it is covered, so the page background never shows through.
      if (out) {
        // Shrink only once the incoming scene covers, so the page never shows around the edges.
        const covered = clamp01((k - 0.35) / 0.65);
        frame.transform = `scale(${holdScale - 0.3 * covered})`;
        frame.opacity = 1 - covered;
      } else {
        frame.transform = `scale(${1 + 0.3 * (1 - k)})`;
        frame.opacity = clamp01(k / 0.4);
        frame.zIndex = 15;
      }
      break;
  }
  // A fully transparent scene must not sit in the hit-testing / tab order.
  if (frame.opacity <= 0.001) frame.visibility = "hidden";
  return frame;
}

/* ------------------------------------------------------------------------ */
/* Scene = brand world + shared text overlay                                  */
/* ------------------------------------------------------------------------ */

const TONE = {
  dark: {
    /** Dark-ink logos get a white pill on dark worlds. */
    markPill: "rounded-full bg-white px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
    eyebrow: "text-white/70",
    headline: "text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]",
    highlight: "text-white/85",
    cta: "bg-white text-neutral-900 shadow-[0_12px_32px_rgba(255,255,255,0.2)] hover:bg-white/90 hover:shadow-[0_16px_40px_rgba(255,255,255,0.3)]",
  },
  light: {
    markPill: "",
    eyebrow: "text-neutral-600",
    headline: "text-neutral-900",
    highlight: "text-neutral-700",
    cta: "bg-neutral-900 text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)] hover:bg-neutral-800 hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
  },
} as const;

/**
 * Where the copy block sits per `SceneVisual.layout`. Bottom padding below lg
 * clears the mobile dock; the top variants keep clear of the floating header
 * pill; `center` sits a touch below the middle; `left-column` fills the left
 * half and hugs the frame on the right (right-aligned from lg); `top-center`
 * sits between the two frames of a top row (below the wide frame on mobile).
 */
/** Below lg the Boleron / Mindguard / OSMO chips shrink with the rest of their compact copy blocks. */
const DENSE_CHIPS =
  "max-lg:gap-1 max-lg:[&>div]:gap-1 max-lg:[&>div]:px-1.5 max-lg:[&>div]:py-0.5 max-lg:[&>div]:text-[0.58rem] max-lg:[&>div]:tracking-[0.12em] max-lg:[&_svg]:size-2.5";

const TEXT_LAYOUT = {
  "bottom-left": {
    block: "left-5 right-10 bottom-28 sm:left-8 sm:right-14 lg:bottom-12 lg:left-12 lg:right-auto lg:max-w-[46vw]",
    row: "",
    chips: "",
  },
  center: {
    block: "inset-x-5 top-[54%] -translate-y-1/2 items-center text-center sm:inset-x-8 lg:inset-x-0 lg:mx-auto lg:max-w-[70ch]",
    row: "flex justify-center",
    chips: "justify-center",
  },
  // Below lg the blocks sit low, just above the mobile dock (`bottom-[5.5rem]`), with tighter gaps.
  "center-bottom": {
    block:
      "inset-x-5 bottom-[max(6.5rem,17vh)] mx-auto max-w-[min(88vw,32rem)] items-center gap-3 text-center sm:inset-x-8 sm:gap-4 lg:inset-x-0 lg:bottom-[9vh] lg:max-w-[min(70ch,48vw)] lg:gap-5 2xl:top-[49%] 2xl:bottom-auto 2xl:-translate-y-1/2",
    row: "flex justify-center",
    chips: "justify-center",
  },
  boleron: {
    // 20vw left margin; the bottom margin grows toward 20vh on tall viewports but stays clear of the lockup on short ones.
    block:
      "left-[8vw] right-[8vw] bottom-[5.5rem] gap-3 sm:gap-4 lg:left-[max(2rem,4vw)] lg:right-auto lg:bottom-[8vh] lg:w-[min(50vw,calc(60vw-12rem))] lg:gap-5",
    row: "",
    chips: DENSE_CHIPS,
  },
  "top-left": {
    block: "left-5 right-10 top-[max(9rem,18vh)] sm:left-8 sm:right-14 lg:left-12 lg:right-auto lg:top-[max(9.5rem,15vh)] lg:max-w-[min(30vw,40ch)]",
    row: "",
    chips: "",
  },
  "top-left-wide": {
    block:
      "left-5 right-10 top-[max(9rem,18vh)] sm:left-8 sm:right-14 lg:left-12 lg:right-auto lg:top-[52vh] lg:max-w-[28vw] lg:-translate-y-1/2 xl:max-w-[30vw]",
    row: "",
    chips: "",
  },
  // Below lg: a compact block inside the top of the (smaller) disc, under the white mark (see `OsmoVisual`).
  "in-circle": {
    block:
      "left-[12vw] right-[12vw] top-[calc(max(5.75rem,10vh)+6.75rem)] items-center gap-2 text-center sm:left-[22vw] sm:right-[22vw] sm:top-[calc(max(5.75rem,10vh)+8.5rem)] sm:gap-3 lg:left-[var(--osmo-cx)] lg:right-auto lg:top-[56vh] lg:w-[32vw] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:gap-4",
    row: "flex justify-center",
    chips: `justify-center ${DENSE_CHIPS}`,
  },
  // Below lg: a compact block at the bottom, under the tablet that sits up top (see `MindguardVisual`). The mark
  // row pulls the MindGuard file's transparent left padding (5.3% of it - 0.155 × the mark's height) back, so the
  // mark's ink lines up with the left-aligned copy under it.
  "left-column": {
    block:
      "left-5 right-8 bottom-[5.5rem] gap-2.5 sm:left-8 sm:right-14 sm:gap-3 lg:top-[5.5rem] lg:bottom-0 lg:left-0 lg:right-[60%] lg:items-start lg:justify-center lg:gap-5 lg:px-[max(2rem,4vw)] lg:text-left",
    row: "flex justify-start",
    mark: "-ml-[0.43rem] sm:-ml-[0.54rem] lg:-ml-[0.93rem] xl:-ml-[1.09rem] 2xl:-ml-[1.39rem]",
    chips: `justify-start ${DENSE_CHIPS}`,
  },
} as const;

/** Type ramp per layout: the left column and wide top-left get the bigger headline. */
const HEADLINE_SIZE = {
  "bottom-left": "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl",
  boleron: "text-2xl sm:text-4xl lg:text-5xl 2xl:text-6xl",
  center: "text-3xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl",
  "center-bottom": "text-3xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl",
  "top-left": "text-3xl sm:text-4xl lg:text-4xl xl:text-5xl",
  "top-left-wide": "text-3xl sm:text-4xl lg:text-5xl xl:text-5xl 2xl:text-7xl",
  "left-column": "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl",
  "in-circle": "text-xl sm:text-2xl lg:text-5xl xl:text-6xl 2xl:text-7xl",
} as const;
const HIGHLIGHT_SIZE = {
  "bottom-left": "text-base sm:text-lg lg:text-xl",
  boleron: "text-sm sm:text-lg lg:text-xl",
  center: "text-base sm:text-lg lg:text-xl",
  "center-bottom": "text-base sm:text-lg lg:text-xl",
  "top-left": "text-base sm:text-lg",
  "top-left-wide": "text-base sm:text-lg lg:text-xl 2xl:text-2xl",
  "left-column": "text-sm sm:text-base lg:text-xl",
  "in-circle": "text-xs sm:text-sm lg:text-xl xl:text-2xl",
} as const;

/** The scene root's position on stage for local time `t` (see `sceneFrame`), as motion values. */
function useSceneFrameStyle(t: MotionValue<number>, index: number, hold: number) {
  const opacity = useTransform(t, (v) => sceneFrame(v, index, hold).opacity);
  const transform = useTransform(t, (v) => sceneFrame(v, index, hold).transform);
  const filter = useTransform(t, (v) => sceneFrame(v, index, hold).filter);
  const clipPath = useTransform(t, (v) => sceneFrame(v, index, hold).clipPath);
  const zIndex = useTransform(t, (v) => sceneFrame(v, index, hold).zIndex);
  const visibility = useTransform(t, (v) => sceneFrame(v, index, hold).visibility);
  return { opacity, transform, filter, clipPath, zIndex, visibility };
}

/**
 * Brand mark leading the copy block: the client's logo (white-ink variant on
 * dark worlds when one exists, otherwise the dark-ink one on a white pill),
 * falling back to the client name for projects without a partner logo.
 */
function BrandMark({
  project,
  tone,
  size = "md",
  mark = "logo",
  className,
}: {
  project: Project;
  tone: "dark" | "light";
  size?: "md" | "lg" | "xl";
  mark?: "logo" | "logo-large" | "wordmark" | "custom" | "none";
  className?: string;
}) {
  const { t } = useLanguage();
  const partner = project.partnerId ? PARTNERS.find((candidate) => candidate.id === project.partnerId) : undefined;
  const name = t.projects.items[project.id].name;
  if (mark === "none") return null;
  if (mark === "wordmark") {
    // Giant, airy uppercase wordmark (light weight, wide tracking); scales with the viewport.
    return (
      <p
        className={cn(
          "font-heading text-[clamp(2.75rem,8.5vw,8rem)] font-light uppercase leading-[0.95] tracking-[0.06em]",
          TONE[tone].headline,
          className
        )}
      >
        {name}
      </p>
    );
  }
  const file = tone === "dark" ? (partner?.dark ?? partner?.light) : (partner?.light ?? partner?.dark);
  if (mark === "logo-large" && partner && file) {
    // Big mark spanning the copy column; a dark-ink-only logo becomes a white silhouette on dark worlds.
    const silhouette = tone === "dark" && !partner.dark;
    return (
      <Image
        src={`${PARTNER_ICON_BASE}${file}`}
        alt={partner.ariaLabel}
        width={800}
        height={280}
        sizes="(max-width: 1024px) 70vw, 520px"
        className={cn("h-auto w-[min(70vw,320px)] object-contain sm:w-[min(60vw,420px)] lg:w-[min(36vw,520px)]", silhouette && "brightness-0 invert", className)}
      />
    );
  }
  if (!partner || !file) {
    return <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", TONE[tone].eyebrow, className)}>{name}</p>;
  }
  const needsPill = tone === "dark" && !partner.dark;
  // A white-ink-only mark on a light world is inverted so it reads.
  const invert = tone === "light" && !partner.light && partner.invertOnLight;
  return (
    <span className={cn("inline-flex items-center", needsPill && TONE.dark.markPill, className)}>
      <Image
        src={`${PARTNER_ICON_BASE}${file}`}
        alt={partner.ariaLabel}
        width={400}
        height={140}
        sizes={size === "xl" ? "(max-width: 1024px) 380px, 640px" : size === "lg" ? "(max-width: 1024px) 220px, 480px" : "200px"}
        className={cn(
          "w-auto object-contain",
          size === "xl"
            ? // Desktop: sized by the viewport height, so a 15" laptop (a short viewport) gets a smaller mark than a
              // tall monitor - about 14rem at 864px tall, 18rem from 1100px up.
              "h-20 max-w-[320px] sm:h-24 sm:max-w-[380px] lg:h-[clamp(9rem,22vh,13rem)] lg:max-w-[30vw] xl:h-[clamp(10rem,24vh,14rem)] 2xl:h-[clamp(11rem,26vh,18rem)]"
            : size === "lg"
              ? "h-11 max-w-[220px] sm:h-14 lg:h-24 lg:max-w-[340px] xl:h-28 xl:max-w-[400px] 2xl:h-36 2xl:max-w-[480px]"
              : "h-9 max-w-[200px] sm:h-11 lg:h-12",
          invert && "invert"
        )}
      />
    </span>
  );
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
  hold,
  shouldMount,
  framesEnabled,
  endFade,
}: {
  project: Project;
  index: number;
  /** Timeline position in units (see the header comment). */
  u: MotionValue<number>;
  /** Scene-local time the hand-over starts at (see `sceneFrame`). */
  hold: number;
  /** Only the visible scenes + the next one up keep a player mounted. */
  shouldMount: boolean;
  framesEnabled: boolean;
  /** Unsmoothed end-of-timeline fade (1 → 0 over the last stretch of real scroll), so the stage is transparent before it unpins. */
  endFade: MotionValue<number>;
}) {
  const { t: dict, language } = useLanguage();
  const p = dict.projects;
  const copy = p.items[project.id];
  const { tone, background, layout, mark, Mark, Visual, headline, Detail, highlight: showHighlight = true, className: sceneClass } = sceneVisualFor(project);
  const colors = TONE[tone];
  // A layout may pull its mark row back over the copy (the MindGuard file's transparent left padding).
  const markRow = (TEXT_LAYOUT[layout] as { mark?: string }).mark;

  const t = useTransform(u, (v) => (v - INTRO) / SPAN - index);
  const frameStyle = useSceneFrameStyle(t, index, hold);
  const last = index === COUNT - 1;
  // Parked scenes (not yet arriving / mostly gone) are inert: out of the tab order and the a11y tree. Driven by the
  // scene's own time so the outgoing scene stays interactive while it is still visually framed.
  const [parked, setParked] = useState(index !== 0);
  const parkedAfter = hold + 0.4 * (1 - hold);
  useMotionValueEvent(t, "change", (v) => {
    const next = v < -0.1 || v > parkedAfter;
    setParked((prev) => (prev === next ? prev : next));
  });
  // Last scene: the copy fades out before the outro disc appears (and leaves the tab order), and the whole scene
  // dissolves with the unsmoothed scroll at the very end.
  const copyOpacity = useTransform(t, (v) => (last ? 1 - easeInOut(clamp01((v - OSMO_OUTRO_START) / OSMO_COPY_FADE)) : 1));
  const copyVisibility = useTransform(t, (v) => (last && v >= OSMO_OUTRO_START + OSMO_COPY_FADE - 0.005 ? "hidden" : "visible"));
  const opacity = useTransform([frameStyle.opacity, endFade], ([o, e]: number[]) => (last ? o * e : o));
  // Recompute visibility from the frame + the end fade (a fully transparent scene must leave hit-testing / tab order).
  const visibility = useTransform([t, endFade], ([v, e]: number[]) => {
    const f = sceneFrame(v, index, hold);
    return f.visibility === "hidden" || (last && f.opacity * e <= 0.001) ? "hidden" : "visible";
  });

  return (
    <motion.div
      className={cn("absolute inset-0 overflow-clip will-change-[transform,opacity]", sceneClass)}
      style={{ ...frameStyle, opacity, visibility, backgroundColor: background }}
      inert={parked ? true : undefined}
    >
      <Visual project={project} t={t} shouldMount={shouldMount} framesEnabled={framesEnabled} />

      {/* Name, headline, highlight, tags, CTA - placed per scene layout. */}
      <ParallaxLayer t={t} depth={0.25} dx={-0.05} className="pointer-events-none">
        <motion.div
          className={cn("absolute flex flex-col gap-4 sm:gap-5", TEXT_LAYOUT[layout].block)}
          style={{ opacity: copyOpacity, visibility: copyVisibility }}
        >
          {/* Scenes whose mark is decorative (giant text / mascot) still announce the client. */}
          {mark === "none" || mark === "custom" ? <p className="sr-only">{copy.name}</p> : null}
          {mark === "custom" && Mark ? (
            <Reveal t={t} delay={0.04} className={TEXT_LAYOUT[layout].row}>
              <Mark />
            </Reveal>
          ) : mark !== "none" && mark !== "custom" ? (
            <Reveal t={t} delay={0.04} className={cn(TEXT_LAYOUT[layout].row, markRow)}>
              <BrandMark
                project={project}
                tone={tone}
                mark={mark}
                size={
                  layout === "center" || layout === "center-bottom"
                    ? "xl"
                    : layout === "left-column" || layout === "top-left-wide"
                      ? "lg"
                      : "md"
                }
              />
            </Reveal>
          ) : null}
          <Reveal t={t} delay={0.1}>
            {/* The leading comes after the sizes: tailwind-merge drops a leading that precedes a font-size class. */}
            <h3 className={cn("font-heading font-bold text-balance", HEADLINE_SIZE[layout], colors.headline, headline, "leading-[1.02]")}>
              {copy.headline}
            </h3>
          </Reveal>
          {Detail || showHighlight ? (
            <Reveal t={t} delay={0.17} className={TEXT_LAYOUT[layout].row}>
              {Detail ? (
                <Detail />
              ) : (
                <p className={cn("max-w-[38ch] leading-relaxed text-pretty", HIGHLIGHT_SIZE[layout], colors.highlight)}>
                  {copy.highlight}
                </p>
              )}
            </Reveal>
          ) : null}
          {/* The highlight tags are parked for now.
          <Reveal t={t} delay={0.2} className={TEXT_LAYOUT[layout].row}>
            <ProjectTagChips project={project} variant="highlights" tone={tone} className={TEXT_LAYOUT[layout].chips} />
          </Reveal> */}
          <Reveal t={t} delay={0.26} className={cn("pointer-events-auto", TEXT_LAYOUT[layout].row)}>
            <ButtonWithIcon href={projectPath(language, project.id)} surface={tone === "dark" ? "light" : "dark"}>
              {p.viewProject}
            </ButtonWithIcon>
          </Reveal>
        </motion.div>
      </ParallaxLayer>
    </motion.div>
  );
}

/**
 * A scene's `Overlay` (the giant PLASICO name), drawn *above* the morph shape
 * but moving exactly with its scene - same frame transform, z lifted over the
 * morph's layer.
 */
function SceneOverlay({
  project,
  index,
  u,
  hold,
  shouldMount,
  framesEnabled,
  endFade,
}: {
  project: Project;
  index: number;
  u: MotionValue<number>;
  hold: number;
  shouldMount: boolean;
  framesEnabled: boolean;
  endFade: MotionValue<number>;
}) {
  const { Overlay } = sceneVisualFor(project);
  const t = useTransform(u, (v) => (v - INTRO) / SPAN - index);
  const frameStyle = useSceneFrameStyle(t, index, hold);
  const last = index === COUNT - 1;
  // Always above the morph shape (+30); during the hand-over it fades exactly with the incoming scene's cover so
  // it is gone the moment the next world is opaque (the incoming scene's local time is t - 1).
  const zIndex = useTransform(frameStyle.zIndex, (z) => z + 30);
  const opacity = useTransform([t, endFade], ([v, e]: number[]) => {
    const own = sceneFrame(v, index, hold).opacity;
    const incoming = !last && v >= 0 ? sceneFrame(v - 1, index + 1, hold).opacity : 0;
    return own * (1 - incoming) * (last ? e : 1);
  });
  const visibility = useTransform(opacity, (o) => (o <= 0.001 ? "hidden" : "visible"));
  if (!Overlay) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-clip" style={{ ...frameStyle, zIndex, opacity, visibility }}>
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
/** `true` from the lg breakpoint (1024px) - the scenes lay out differently below it. */
function useIsLg() {
  const [isLg, setIsLg] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isLg;
}

function MorphOverlay({ u, hold }: { u: MotionValue<number>; hold: number }) {
  const isLg = useIsLg();
  const state = useTransform(u, (v) => {
    const uc = (v - INTRO) / SPAN;
    const i0 = clamp(Math.floor(uc), 0, COUNT - 1);
    const i1 = Math.min(i0 + 1, COUNT - 1);
    const f = uc - i0;
    // The shape travels with the scenes' hand-over (earlier on phones, see `sceneFrame`).
    const k = uc < 0 ? 0 : easeInOut(clamp01((f - hold) / (1 - hold)));
    const A = MORPH_TARGETS[i0];
    const B = MORPH_TARGETS[i1];
    const ca = hexToRgb(A.color);
    const cb = hexToRgb(B.color);
    const rgb = ca.map((c, j) => Math.round(lerp(c, cb[j], k))).join(",");
    // A scene that draws the shape itself keeps the overlay hidden while framed (fast 6% hand-off).
    const ownHide = A.ownsShape ? 1 - clamp01((f - hold) / 0.06) : B.ownsShape ? k : 0;
    const px = lerp(A.px ?? 0, B.px ?? 0, k);
    return {
      width: `calc(${lerp(A.w[0], B.w[0], k) * 100}% + ${lerp(A.w[1], B.w[1], k) * 100}svh + ${px}px)`,
      height: `calc(${lerp(A.h[0], B.h[0], k) * 100}% + ${lerp(A.h[1], B.h[1], k) * 100}svh + ${px}px)`,
      left: `${lerp(isLg ? A.x : (A.xMobile ?? A.x), isLg ? B.x : (B.xMobile ?? B.x), k) * 100}%`,
      top: `${lerp(isLg ? A.y : (A.yMobile ?? A.y), isLg ? B.y : (B.yMobile ?? B.y), k) * 100}%`,
      rotate: k * (1 - k) * 90,
      backgroundColor: `rgba(${rgb},${lerp(A.alpha, B.alpha, k)})`,
      mixBlendMode: (k < 0.5 ? A : B).blend ?? "normal",
      opacity: clamp01((v - CURTAIN_START) * 3) * (1 - ownHide),
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
    <li>
      <button
        type="button"
        aria-current={isActive ? "true" : undefined}
        aria-label={label}
        onClick={() => onJump(index)}
        className="group cursor-pointer px-2 py-0.5 transition-transform duration-200 ease-out hover:-translate-x-0.5"
      >
        <span className="block h-9 w-0.5 overflow-hidden rounded-full bg-white/30 transition-[background-color] duration-200 group-hover:bg-white/50 sm:h-11">
          <motion.span className="block h-full w-full origin-top bg-white" style={{ scaleY }} />
        </span>
      </button>
    </li>
  );
}

/** Scroll position (px) at which project `index` is framed in the sticky stage. */
/** Scroll position at which scene `index` is fully framed, copy revealed (`SCENE_FRAMED`) - the rail's jumps. */
function scrollTargetFor(section: HTMLElement, stage: HTMLElement, index: number) {
  const top = section.getBoundingClientRect().top + window.scrollY;
  const travel = section.offsetHeight - stage.offsetHeight;
  return top + ((INTRO + (index + SCENE_FRAMED) * SPAN) / UNITS) * travel;
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
  const { t } = useLanguage();
  const p = t.projects;
  const reduceMotion = useReducedMotion();
  // Phones hand over early so the next scene moves with the finger between two snap stops (reels-style).
  const hold = useMediaQuery("(max-width: 1023px) and (pointer: coarse)") ? SHOWCASE_HOLD_MOBILE : HOLD;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  /** Scenes that keep a player mounted: the framed one, the previous one while it is still leaving, and the next one from 10% into the hold. */
  const [mounted, setMounted] = useState<number[]>([0, 1]);
  // Frame sequences (≈4.4 MB of webp) only start loading once the section is close.
  const framesEnabled = useInView(sectionRef, { once: true, margin: "800px 0px 800px 0px" });
  // Players only live while the stage itself is on screen - nothing keeps playing under the rest of the page.
  const stageOnScreen = useInView(sectionRef);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  // Under native scrolling: over-damped so the stage glides after each wheel tick without overshooting, but quick
  // (~50 ms) so canvases and players don't trail the scroll. While Lenis glides the wheel the raw progress is used.
  const smooth = useScrollEased(
    scrollYProgress,
    useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.5, restDelta: 0.0002 })
  );
  const u = useTransform(smooth, (v) => v * UNITS);

  useMotionValueEvent(u, "change", (v) => {
    const uc = (v - INTRO) / SPAN;
    const next = clamp(Math.round(uc), 0, COUNT - 1);
    setActive((prev) => (prev === next ? prev : next));
    setMounted((prev) => {
      // Enter at the thresholds below; leave only once well past hidden (hysteresis so wheel jitter never remounts a player).
      const keep = new Set(prev.filter((j) => Math.abs(uc - j) < 1.1));
      keep.add(next);
      if (next > 0 && uc < next) keep.add(next - 1); // previous still transitioning out
      if (next < COUNT - 1 && uc >= next + 0.1) keep.add(next + 1); // next up, mounted early in the hold
      const set = [...keep].sort((a, b) => a - b);
      return prev.length === set.length && prev.every((x, i) => x === set[i]) ? prev : set;
    });
  });

  // Intro: headline scales up, blurs and fades; curtains open right after.
  const introT = useTransform(u, (v) => clamp01(v));
  const introGone = useTransform(introT, (v) => easeOut(clamp01((v - 0.2) / 0.3)));
  const introOpacity = useTransform(introGone, (v) => 1 - v);
  const introScale = useTransform(introT, (v) => 1 + v * 0.35);
  const introY = useTransform(introT, (v) => -v * 40);
  const introFilter = useTransform(introGone, (v) => `blur(${v * 10}px)`);
  // The cinema behind the headline: a faint letterbox band across the middle of the stage - the screen the first
  // scene opens from (the slit in `sceneFrame` is at the same 50%) - with a streak of light along its centre line
  // that wakes as the headline leaves, and a soft pool of light. All of it fades as the picture grows past it.
  const cinemaOpen = useTransform(u, (v) => easeInOut(clamp01((v - CURTAIN_START) / (CURTAIN_END - CURTAIN_START))));
  const cinemaOpacity = useTransform(cinemaOpen, (v) => 1 - v);
  const cinemaBand = useTransform(introT, (v) => 0.9 + 0.1 * easeOut(clamp01(v / CURTAIN_START)));
  // The streak wakes once the headline is mostly gone (it fades over 0.2 → 0.5), peaking as the slit starts to open.
  const cinemaStreak = useTransform(u, (v) => easeOut(clamp01((v - 0.26) / 0.12)));
  // Rail: in once the first scene is framed (and out of the tab order while invisible).
  const furnitureOpacity = useTransform(u, (v) => {
    const tLast = (v - INTRO) / SPAN - (COUNT - 1);
    return clamp01((v - INTRO + 0.2) * 3) * (1 - easeInOut(clamp01((tLast - OSMO_OUTRO_START) / OSMO_COPY_FADE)));
  });
  // End-of-timeline dissolve on the RAW scroll progress (no spring lag): fully transparent the instant the stage unpins.
  const endFade = useTransform(scrollYProgress, (v) => {
    const tLast = (v * UNITS - INTRO) / SPAN - (COUNT - 1);
    return 1 - easeInOut(clamp01((tLast - (HOLD - 0.08)) / 0.08));
  });
  const furnitureVisibility = useTransform(furnitureOpacity, (v) => (v <= 0.001 ? "hidden" : "visible"));

  const jumpTo = useCallback((index: number) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    scrollToY(scrollTargetFor(section, stage, index));
  }, []);

  if (reduceMotion) {
    return (
      <section id="projects" ref={sectionRef} className={cn("relative w-full py-12 sm:py-16", className)}>
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
            <div className="text-center">
              <h2 className="font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl text-foreground">
                {p.title1} <span className="text-section-accent">{p.title2}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{p.subtitle}</p>
            </div>
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
        {/* Mobile scene snapping (see `SnapStop`): the intro, then each scene fully framed with its copy revealed
            (`SCENE_FRAMED` - the same positions the rail jumps to, `scrollTargetFor`). */}
        <SnapStop className="absolute inset-x-0 top-0" />
        {PROJECTS.map((project, index) => (
          <SnapStop
            key={project.id}
            className="absolute inset-x-0"
            style={{ top: `${((((INTRO + (index + SCENE_FRAMED) * SPAN) / UNITS) * (UNITS - 1)) * 100).toFixed(3)}svh` }}
          />
        ))}
        {/* Transparent stage: the page background shows through the intro and between scenes. */}
        <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-clip">
          {/* The cinema (under the headline and the scenes): the pool of light, the letterbox band widening a little
              as the intro plays, and the streak along its centre line - theme tokens, so it is as quiet on the
              off-white ground as on the dark one. */}
          <motion.div className="pointer-events-none absolute inset-0 z-0 will-change-[opacity]" style={{ opacity: cinemaOpacity }} aria-hidden>
            <div className="absolute left-1/2 top-1/2 h-[min(64vh,760px)] w-[min(110vw,1500px)] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-radial from-foreground/[0.05] via-foreground/[0.015] via-45% to-transparent to-70%" />
            <motion.div
              className="absolute inset-x-0 top-1/2 h-[clamp(200px,42vh,520px)] -translate-y-1/2 border-y border-foreground/[0.08] bg-gradient-to-b from-transparent via-foreground/[0.03] to-transparent will-change-transform"
              style={{ scaleY: cinemaBand }}
            />
            <motion.div className="absolute inset-x-[6%] top-1/2 -translate-y-1/2" style={{ opacity: cinemaStreak }}>
              <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 bg-gradient-to-b from-transparent via-foreground/[0.09] to-transparent" />
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-foreground/45 to-transparent" />
            </motion.div>
          </motion.div>
          {/* Intro headline - the section title, cinema style. */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6 text-center will-change-[transform,opacity]"
            style={{
              opacity: introOpacity,
              scale: introScale,
              y: introY,
              filter: introFilter,
            }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground md:text-base">{p.showcase.eyebrow}</p>
            <h2 className="font-heading text-6xl font-bold leading-none tracking-tight text-balance text-foreground md:text-8xl lg:text-9xl">
              {p.showcase.title1} <span className="text-section-accent">{p.showcase.title2}</span>
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">{p.showcase.subtitle}</p>
            <p className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <IconArrowDown className="size-4 animate-bounce" aria-hidden />
              {p.scrollHint}
            </p>
          </motion.div>

          {/* Scenes */}
          <div className="absolute inset-0">
            {PROJECTS.map((project, index) => (
              <ProjectScene
                key={project.id}
                project={project}
                index={index}
                u={u}
                hold={hold}
                shouldMount={stageOnScreen && mounted.includes(index)}
                framesEnabled={framesEnabled}
                endFade={endFade}
              />
            ))}
            <MorphOverlay u={u} hold={hold} />
            {PROJECTS.map((project, index) =>
              sceneVisualFor(project).Overlay ? (
                <SceneOverlay
                  key={project.id}
                  project={project}
                  index={index}
                  u={u}
                  hold={hold}
                  shouldMount={stageOnScreen && mounted.includes(index)}
                  framesEnabled={framesEnabled}
                  endFade={endFade}
                />
              ) : null
            )}
          </div>

          {/* Progress rail: counter + one bar per project (jump buttons), on its own dark pill so it reads on every world. */}
          <motion.nav
            aria-label={p.showcase.railLabel}
            className="absolute right-1 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-3 px-1 py-3 text-white mix-blend-difference sm:right-2 lg:right-3"
            style={{ opacity: furnitureOpacity, visibility: furnitureVisibility }}
          >
            <p className="hidden pr-2 font-mono text-xs font-semibold tracking-[0.14em] lg:block">{counter}</p>
            <ul className="flex flex-col gap-1">
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
            </ul>
          </motion.nav>
        </div>
      </section>
    </>
  );
}
