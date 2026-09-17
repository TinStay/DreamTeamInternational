"use client";

import { type ComponentType } from "react";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";
import { ProjectThumbnail } from "@/components/projects-section";
import {
  clamp01,
  easeInOut,
  easeOut,
  FrameSequence,
  ParallaxLayer,
  ProjectEmbedCover,
  Reveal,
  Sparks,
} from "@/components/projects/showcase-primitives";
import { OSMO_CIRCLE, OSMO_GREEN, SHOWCASE_HOLD, SHOWCASE_HOLD_MOBILE } from "@/components/projects/showcase-timeline";
import { useMediaQuery } from "@/lib/use-media-query";
import { useLanguage } from "@/lib/i18n/language-context";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project, ProjectKey } from "@/lib/projects";
import { cn } from "@/lib/utils";

/*
 * Per-brand worlds for the home "case studies journey", ported from the
 * "Smooth scroll case studies section" design (one bespoke scene per client:
 * background, glows, particles, hero visual, morph-overlay target). The shared
 * copy block (brand mark / headline / highlight / tags / CTA per `layout`) is
 * drawn by `projects-showcase.tsx` on top of these, so each hero visual keeps
 * that area clear.
 */

export type SceneVisualProps = {
  project: Project;
  /** Scene-local time: 0 = framed, -1 = one span before, +1 = one span after. */
  t: MotionValue<number>;
  /** Only the active project's neighbours mount a YouTube player. */
  shouldMount: boolean;
  /** Frame sequences start downloading once the section is near the viewport. */
  framesEnabled: boolean;
};

/**
 * Target of the shared morph overlay while this scene is framed - one shape
 * that travels between worlds (nothing on Boleron / Emblema, a hairline on
 * Mindguard, a bar along the bottom on Plasico, a big circle on OSMO).
 * Sizes are [× stage width, × stage height] (+ `px`), position is a fraction
 * of the stage.
 */
export type MorphTarget = {
  w: [number, number];
  h: [number, number];
  px?: number;
  x: number;
  y: number;
  /**
   * `x` / `y` below the lg breakpoint (where scenes lay out differently); default to `x` / `y`. `yMobile` may
   * also be a CSS length (a variable the scene sets on the scenes' wrapper - Plasico's name centre), so the shape
   * can follow a phone layout that is not a fixed fraction of the stage.
   */
  xMobile?: number;
  yMobile?: number | string;
  /** The height below lg as a CSS length (Plasico's bar, only as tall as its name there); `h` otherwise. */
  hMobile?: string;
  color: string;
  alpha: number;
  blend?: "normal" | "multiply" | "screen";
  /** The scene draws the shape itself while framed - hide the overlay until the hand-over starts. */
  ownsShape?: boolean;
};

export type SceneVisual = {
  /** Text overlay colour scheme for this world. */
  tone: "dark" | "light";
  /** Solid colour behind the scene (also what the wipe / push reveals). */
  background: string;
  /**
   * Where the brand mark / headline / highlight / tags / CTA block sits:
   * `top-left-wide` = top-left at 40% of the width; `left-column` = the
   * left ~40%, left-aligned, with the tablet frame on the right.
   */
  layout: "bottom-left" | "center" | "center-bottom" | "top-left" | "top-left-wide" | "left-column" | "in-circle" | "boleron";
  morph: MorphTarget;
  /**
   * What leads the copy block: the partner logo (default), the same logo big
   * (`logo-large`, white silhouette on dark worlds), the client name as a
   * giant wordmark, or nothing (the scene places its own mark).
   */
  mark?: "logo" | "logo-large" | "wordmark" | "custom" | "none";
  /** The mark component for `mark: "custom"` (rendered inside the copy block). */
  Mark?: ComponentType;
  /**
   * The headline's display face - classes for the copy block's `h3` (a font variable from `layout.tsx`, weight,
   * style); the heading face when unset.
   */
  headline?: string;
  /**
   * What sits under the headline instead of the `highlight` paragraph - a block of the scene's own (MindGuard's
   * "shown to" label + list); the paragraph when unset.
   */
  Detail?: ComponentType;
  /** `false` drops the highlight paragraph altogether (Emblema shows only its headline). */
  highlight?: boolean;
  Visual: ComponentType<SceneVisualProps>;
  /** Optional layer the showcase draws *above* the morph shape (same scene transform). */
  Overlay?: ComponentType<SceneVisualProps>;
  /**
   * Classes on the scenes' wrapper (all scenes' together) - a world's geometry as CSS variables, for its visual,
   * the copy block and the morph shape alike.
   */
  className?: string;
};

const DEEP = "#070b1a";

/* ---------------------------------------------------------------- Boleron */

/** Boleron brand gradient (cyan → blue → violet) with soft organic blobs, from the client's key visual. */
const BOLERON = { cyan: "#25C7EA", blue: "#2B7BE6", violet: "#8A3BD6", deep: "#1E3FB5" };
const RONI_FRAMES = 72;
function BoleronVisual({ t, framesEnabled }: SceneVisualProps) {
  // Roni raises the phone while the scene frames (done by t≈0.15, so the final
  // pose holds for most of the stay); then sinks away as the wipe passes.
  const roniProgress = useTransform(t, (v) => (v + 0.6) / 0.75);
  // He leaves as the scene hands over: on phones from the early hand-over, fast; on desktop with the flow wipe.
  const compact = useMediaQuery("(max-width: 1023px) and (pointer: coarse)");
  const leaveAt = compact ? SHOWCASE_HOLD_MOBILE : SHOWCASE_HOLD - 0.1;
  const roniSink = useTransform(t, (v) => `${70 * easeInOut(clamp01((v - leaveAt) / (compact ? 0.3 : 0.4)))}vh`);
  const roniFade = useTransform(t, (v) => 1 - clamp01((v - leaveAt) / (compact ? 0.16 : 0.3)));
  const blob = "absolute rounded-[46%] bg-white/[0.07]";
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(100deg, ${BOLERON.cyan} 0%, ${BOLERON.blue} 46%, ${BOLERON.violet} 100%)` }}
      />
      {/* Organic blobs + the big arc top-right, on two parallax depths. */}
      <ParallaxLayer t={t} depth={0.16} scale={0.08} className="pointer-events-none">
        <div className="absolute right-[-18vw] top-[-42vh] aspect-square w-[min(1100px,86vw)] rounded-full border-[clamp(40px,6vw,90px)] border-white/[0.06]" />
        <div className="absolute right-[-4vw] top-[-22vh] aspect-square w-[min(620px,50vw)] rounded-full border-[clamp(28px,4vw,60px)] border-white/[0.05]" />
        <div className={cn(blob, "left-[38%] top-[-10%] h-[70vh] w-[34vw] rotate-[22deg] rounded-[45%]")} />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={0.32} dx={0.05} scale={0.14} className="pointer-events-none">
        <div className={cn(blob, "left-[-10%] bottom-[-16%] h-[44vh] w-[46vw] rotate-[-12deg] rounded-[50%]")} />
        {/* Wide and nearly level behind Roni - no capsules (they read as chips). */}
        <div className={cn(blob, "right-[-12%] bottom-[-16%] h-[26vh] w-[58vw] rotate-[5deg] rounded-[50%]")} />
        <div className={cn(blob, "left-[44%] bottom-[6%] h-[12vh] w-[30vw] rotate-[-10deg] rounded-[50%]")} />
      </ParallaxLayer>
      {/* The brand word as live text behind Roni - Montserrat ExtraBold like the reference animation
          (`--font-montserrat` from layout.tsx; the rounded faces closer to the logo's Circe - Nunito Black, Fredoka -
          were tried and read worse). Centred up top on phones; on desktop it sits flush left right above the copy
          block (which is bottom-anchored at 8vh - see TEXT_LAYOUT.boleron), 14-16vw by breakpoint and
          bottom-anchored so it stays clear of the floating header on short laptop screens. */}
      <ParallaxLayer t={t} depth={0.55} className="pointer-events-none">
        <span
          className="absolute left-1/2 top-[var(--bol-top)] -translate-x-1/2 select-none whitespace-nowrap text-[22vw] font-extrabold leading-none tracking-[-0.05em] text-white lg:left-[max(2rem,4vw)] lg:top-auto lg:bottom-[calc(8vh+18rem)] lg:translate-x-0 lg:text-[14vw] xl:text-[15vw] 2xl:bottom-[calc(8vh+20rem)] 2xl:text-[16vw]"
          style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
          aria-hidden
        >
          Boleron
        </span>
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.05} className="pointer-events-none">
        <div
          className="absolute left-[72%] top-[62%] size-[min(64vh,600px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,.26) 0%, rgba(255,255,255,.1) 40%, rgba(255,255,255,0) 70%)" }}
        />
      </ParallaxLayer>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[28vh]"
        style={{ background: `linear-gradient(180deg, transparent, rgba(30,63,181,.45))` }}
      />
      <ParallaxLayer t={t} depth={-0.1} className="pointer-events-none">
        <motion.div
          className="absolute left-1/2 top-[calc(var(--bol-top)_+_var(--bol-word)_+_var(--bol-block)_+_2rem)] aspect-[1206/1054] h-[var(--bol-roni)] -translate-x-1/2 [mask-image:linear-gradient(180deg,#000_0%,#000_72%,transparent_97%)] lg:left-[72%] lg:top-auto lg:bottom-[3vh] lg:h-[min(76vh,880px)]"
          style={{ y: roniSink, opacity: roniFade }}
        >
          <FrameSequence
            progress={roniProgress}
            base="/projects/boleron/roni"
            count={RONI_FRAMES}
            width={804}
            height={703}
            enabled={framesEnabled}
            className="h-full w-full"
          />
        </motion.div>
      </ParallaxLayer>
    </>
  );
}

/* ---------------------------------------------------------------- Emblema */

const EMBLEMA = { bg: "#F3EFE8", ink: "#1E1B17", gold: "#B8965A" };
const EMBLEMA_FRAMES = 72;

function EmblemaVisual({ t, framesEnabled }: SceneVisualProps) {
  const { t: dict } = useLanguage();
  const buildings = dict.projects.showcase.scenes.emblema.buildings;
  // Buildings rise from the ground once the scene is framed and finish during the hold - on phones by the
  // stop (t 0.27, `SCENE_FRAMED`), so they stand complete when the page settles.
  const compact = useMediaQuery("(max-width: 1023px) and (pointer: coarse)");
  const buildProgress = useTransform(t, (v) => clamp01((v + 0.3) / (compact ? 0.57 : 0.75)));
  const labelK = useTransform(buildProgress, (v) => easeOut(clamp01((v - 0.35) / 0.25)));
  const labelY = useTransform(labelK, (v) => (1 - v) * 14);
  const goldGlow = `radial-gradient(closest-side, rgba(184,150,90,.55) 0%, rgba(184,150,90,.28) 45%, rgba(184,150,90,.08) 75%, transparent 100%)`;
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(70% 55% at 50% 40%, #FFFFFF 0%, ${EMBLEMA.bg} 55%, #E6DFD3 100%)` }}
      />
      {/* Background geometry: thin gold rings behind the copy + a horizon hairline. */}
      <ParallaxLayer t={t} depth={0.28} scale={0.12} className="pointer-events-none">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(760px,70vh)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B8965A]/25" />
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(1040px,96vh)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#B8965A]/18" />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.2} className="pointer-events-none">
        <div className="absolute inset-x-0 bottom-[12vh] h-px bg-gradient-to-r from-transparent via-[#B8965A]/45 to-transparent" />
      </ParallaxLayer>
      {/* Buildings sequence - oversized so the split towers sit well out to the sides of the centred copy on desktop;
          below lg they stand 1.5rem under the copy block, the full width (80vw from sm) - the two together one
          stack centred on the screen (`--emb-top`, on the scene config). */}
      <ParallaxLayer t={t} depth={0.12} className="pointer-events-none">
        <div className="absolute left-1/2 top-[calc(var(--emb-top)_+_var(--emb-block)_+_1.5rem)] aspect-[1284/716] w-[100vw] -translate-x-1/2 sm:w-[80vw] lg:top-auto lg:bottom-[12vh] lg:w-[min(80vw,140vh,1720px)]">
          <div className="animate-showcase-breathe absolute inset-0 origin-bottom">
            <div className="absolute left-[6%] top-[58%] h-[90%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: goldGlow }} />
            <div className="absolute left-[89%] top-[58%] h-[90%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: goldGlow }} />
            <Sparks
              colors={["#F0D89A", "#C9A45C"]}
              count={22}
              region={{ left: [-12, 112], top: [40, 90] }}
              size={3}
              glow={10}
              className="overflow-visible"
            />
            <FrameSequence
              progress={buildProgress}
              base="/projects/emblema/buildings"
              count={EMBLEMA_FRAMES}
              width={963}
              height={537}
              enabled={framesEnabled}
              split
              className="absolute inset-0 [--split-gap:-10%] lg:drop-shadow-[0_12px_22px_rgba(30,27,23,0.18)] lg:[--split-gap:18%]"
            />
            {buildings.map((building, i) => (
              <motion.div
                key={building.name}
                className={cn(
                  // Under each tower - desktop only; on phones the towers are small and the labels would crowd them.
                  "absolute top-[94%] hidden -translate-x-1/2 flex-col items-center gap-1.5 text-center lg:flex",
                  i === 0 ? "left-[5%]" : "left-[91%]"
                )}
                style={{ opacity: labelK, y: labelY }}
              >
                <span className="h-[clamp(12px,3vh,28px)] w-px opacity-70" style={{ backgroundColor: EMBLEMA.gold }} />
                <span
                  className="whitespace-nowrap font-heading text-[clamp(16px,2.2vw,36px)] font-semibold italic leading-tight"
                  style={{ color: EMBLEMA.ink }}
                >
                  {building.name}
                </span>
                <span
                  className="whitespace-nowrap font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: EMBLEMA.gold }}
                >
                  {building.place}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </ParallaxLayer>
    </>
  );
}

/* -------------------------------------------------------------- Mindguard */

const MINDGUARD = { bg: "#0B1730", teal: "#7DDED2" };
const MINDGUARD_MARK = "/company_icons/mindguard_logo_dark.png";

/**
 * Under the headline: where the film was shown - a small teal label over the list, each line with a teal dot
 * (`showcase.scenes.mindguard`); left-aligned with the column at every breakpoint.
 */
function MindguardShownTo() {
  const { t: dict } = useLanguage();
  const { label, items } = dict.projects.showcase.scenes.mindguard.shownTo;
  return (
    <div className="flex flex-col gap-2 lg:gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] sm:text-[11px] lg:text-xs" style={{ color: MINDGUARD.teal }}>
        {label}
      </p>
      <ul className="flex flex-col gap-1 text-sm font-medium leading-snug text-white/90 sm:text-base lg:gap-1.5 lg:text-xl">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: MINDGUARD.teal }} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Navy world. Copy lives in the left half (right-aligned against the frame),
 * the tablet frame fills the right half; the white Mindguard mark floats,
 * ghosted, above the copy. Below lg the tablet sits up top under the header
 * (its width capped by the viewport height, so it never meets the compact
 * copy block anchored at the bottom) and the glow / wave move up with it.
 */
function MindguardVisual({ t, project, shouldMount }: SceneVisualProps) {
  const { t: dict } = useLanguage();
  const ringK = useTransform(t, (v) => easeOut(clamp01((v + 0.45) / 0.35)));
  const ringScale = useTransform(ringK, (v) => 0.6 + 0.4 * v);
  // The line draws across the stage, the dot rides its tip, both duck out the moment the hand-over starts.
  const waveK = useTransform(t, (v) => clamp01((v + 0.3) / 0.8));
  const waveVisible = useTransform(t, (v) => clamp01((v + 0.4) * 4) * (1 - clamp01((v - 0.5) / 0.06)));
  const dotLeft = useTransform(waveK, (v) => `${v * 100}%`);
  const dotOpacity = useTransform(t, (v) => {
    const k = clamp01((v + 0.3) / 0.8);
    const visible = clamp01((v + 0.4) * 4) * (1 - clamp01((v - 0.5) / 0.06));
    return visible * (k < 1 ? 1 : 1 - clamp01((v - 0.5) * 6));
  });
  const tabletK = useTransform(t, (v) => easeOut(clamp01((v + 0.5) / 0.5)));
  const tabletY = useTransform(tabletK, (v) => (1 - v) * 80);
  const tabletScale = useTransform(tabletK, (v) => 0.9 + 0.1 * v);
  const tabletShadow = useTransform(
    tabletK,
    (v) =>
      `0 0 0 8px rgba(125,222,210,${0.06 * v}), 0 ${50 - 20 * (1 - v)}px 120px rgba(0,0,0,.6), 0 0 ${60 * v}px rgba(125,222,210,${0.25 * v})`
  );
  // Soft gradients, no blur filters: a blurred layer costs the GPU a full re-blur every frame it moves.
  const tealGlow = `radial-gradient(closest-side, rgba(125,222,210,.8) 0%, rgba(125,222,210,.42) 34%, rgba(125,222,210,.1) 66%, transparent 100%)`;
  const tealSlab = `radial-gradient(ellipse closest-side, rgba(125,222,210,.34) 0%, rgba(125,222,210,.28) 58%, rgba(125,222,210,.1) 84%, transparent 100%)`;
  const anchor = "left-1/2 top-[26%] lg:left-[72%] lg:top-[58%]";
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(80% 60% at 50% 45%, #16305A 0%, ${MINDGUARD.bg} 55%, #070F22 100%)` }}
      />
      {/* Background geometry: dot grid + a large dashed orbit + a second hairline. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(125,222,210,.55)_1px,transparent_1.5px)] [background-size:34px_34px]"
        aria-hidden
      />
      <ParallaxLayer t={t} depth={0.18} scale={0.1} className="pointer-events-none">
        <div className={cn("absolute aspect-square w-[min(1200px,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#7DDED2]/15", anchor)} />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.25} className="pointer-events-none">
        <div className="absolute inset-x-0 top-[28%] h-px bg-gradient-to-r from-transparent via-[#7DDED2]/25 to-transparent" />
      </ParallaxLayer>
      {/* Ghosted Mindguard mark, big, floating along the bottom of the stage. */}
      <ParallaxLayer t={t} depth={0.45} dx={-0.1} className="pointer-events-none">
        <div className="animate-float absolute left-[-8vw] bottom-[-4vh] w-[110vw] opacity-[0.08] lg:left-[1vw] lg:bottom-[-6vh] lg:w-[64vw]">
          <Image src={MINDGUARD_MARK} alt="" width={926} height={316} sizes="(max-width: 1024px) 110vw, 64vw" className="h-auto w-full" aria-hidden />
        </div>
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.12} className="pointer-events-none">
        <motion.div
          className={cn("absolute aspect-square w-[min(900px,60vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7DDED2]/20", anchor)}
          style={{ opacity: ringK, scale: ringScale }}
        />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.12} scale={0.1} className="pointer-events-none">
        <div
          className={cn("animate-showcase-breathe absolute aspect-square w-[min(920px,62vw)] -translate-x-1/2 -translate-y-1/2 rounded-full [animation-duration:6s]", anchor)}
          style={{ background: tealGlow }}
        />
        <div
          className={cn("absolute aspect-[16/10.4] w-[min(880px,55vw)] -translate-x-1/2 -translate-y-1/2", anchor)}
          style={{ background: tealSlab }}
        />
      </ParallaxLayer>
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[42%] h-px origin-left lg:top-[86%]"
        style={{ backgroundColor: "rgba(125,222,210,.5)", opacity: waveVisible, scaleX: waveK }}
        aria-hidden
      />
      <motion.span
        className="pointer-events-none absolute top-[42%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full lg:top-[86%]"
        style={{ backgroundColor: MINDGUARD.teal, boxShadow: "0 0 10px rgba(125,222,210,.9)", left: dotLeft, opacity: dotOpacity }}
        aria-hidden
      />
      <Sparks colors={["#F4F7FB", MINDGUARD.teal]} count={26} region={{ left: [8, 92], top: [30, 95] }} size={1.5} />
      {/* Right column (60%): the Mindguard mark above the tablet frame, both pinned bottom-right on desktop. */}
      <ParallaxLayer t={t} depth={-0.12} rotate={-2} className="pointer-events-none">
        <motion.div
          className="absolute left-1/2 top-[max(6.5rem,11vh)] flex w-[min(84vw,calc((100svh-34rem)*1.5))] -translate-x-1/2 flex-col items-center gap-4 sm:w-[min(64vw,calc((100svh-36rem)*1.5))] lg:left-auto lg:right-[max(3vw,6rem)] lg:top-auto lg:bottom-[6vh] lg:w-[52vw] lg:translate-x-0 lg:items-end lg:gap-[2vw] 2xl:w-[54vw]"
          style={{ opacity: tabletK, y: tabletY, scale: tabletScale }}
        >
          <motion.div
            className="relative aspect-[16/10.4] w-full overflow-hidden rounded-[28px] border border-[#7DDED2]/25 p-[2.6%]"
            style={{ backgroundColor: "#0E1D3A", boxShadow: tabletShadow }}
          >
            <div className="absolute inset-[2.6%] overflow-hidden rounded-2xl" style={{ backgroundColor: "#070F22" }}>
              <ProjectThumbnail project={project} alt={dict.projects.items[project.id].name} sizes="(max-width: 1024px) 84vw, 680px" />
              {/* The stage's clip (MindGuard's UI/UX film on Bunny - `showcaseClip`). */}
              {shouldMount ? <ProjectEmbedCover project={project} boxAspect={16 / 10.4} /> : null}
            </div>
            <span className="absolute left-1/2 top-[1.1%] size-1.5 -translate-x-1/2 rounded-full" style={{ backgroundColor: "#1B2E52" }} />
          </motion.div>
        </motion.div>
      </ParallaxLayer>
    </>
  );
}

/* ---------------------------------------------------------------- Plasico */

/** The client's logo (green "plasico · IT superstore", 497 × 128) - the giant mark of the scene. */
const PLASICO_LOGO = "/company_icons/plasico_logo_light.png";
const PLASICO = { green: "#1FA22A", lime: "#5FBF2F", soft: "#D3ECC7" };
// "Plasico - Back to Work 4K" on Bunny Stream - parked for now; the frame plays the YouTube clip like every other scene.
// import { bunnyBackgroundEmbedSrc, type BunnyVideo } from "@/lib/bunny-stream";
// const PLASICO_WIDE_VIDEO: BunnyVideo | null = { library: "750681", id: "481d2093-0dc0-44db-bda4-4d562c20d8fe" };

/** Desktop: copy (left, drawn by the showcase) · the wide film filling the rest of the row out to the right edge. */
function PlasicoVisual({ t, project, shouldMount }: SceneVisualProps) {
  return (
    <>
      <div className="absolute inset-0 bg-white" />
      {/* Background geometry: faint diagonal pinstripes + a big thin ring bottom-right. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(-32deg,#1FA22A_0_1px,transparent_1px_26px)]"
        aria-hidden
      />
      <ParallaxLayer t={t} depth={0.16} scale={0.1} className="pointer-events-none">
        <div className="absolute right-[-14vw] bottom-[-18vh] aspect-square w-[min(900px,72vw)] rounded-full border border-[#1FA22A]/20" />
        <div className="absolute right-[-6vw] bottom-[-8vh] aspect-square w-[min(640px,50vw)] rounded-full border border-dashed border-[#5FBF2F]/25" />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.15} className="pointer-events-none">
        <div
          className="absolute left-[62%] top-[40%] aspect-square w-[min(720px,60vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(95,191,47,.38) 0%, rgba(95,191,47,.16) 45%, rgba(95,191,47,.04) 80%, transparent 100%)" }}
        />
      </ParallaxLayer>
      <Sparks colors={[PLASICO.green, PLASICO.lime]} count={28} region={{ left: [4, 96], top: [10, 90] }} glow={8} />
      {/* Wide film ("Back to Work") - right of the copy, vertically centred and reaching the right margin on desktop
          (clear of the giant name along the bottom); under the copy on mobile. */}
      <ParallaxLayer t={t} depth={-0.12} rotate={-1.5} className="pointer-events-none">
        <div
          className="absolute left-[6vw] top-[calc(var(--pl-top)_+_var(--pl-name)_+_var(--pl-block)_+_2.5rem)] aspect-video w-[88vw] overflow-hidden rounded-2xl sm:left-[10vw] sm:w-[80vw] lg:left-auto lg:right-[max(3vw,6rem)] lg:top-[47vh] lg:w-[54vw] lg:-translate-y-1/2 xl:w-[56vw] 2xl:w-[52vw]"
          style={{ backgroundColor: "#EAF6E6", boxShadow: "0 40px 100px rgba(31,162,42,.25)" }}
        >
          <ProjectThumbnail project={project} alt="" sizes="(max-width: 1024px) 88vw, 56vw" />
          {shouldMount ? <ProjectEmbedCover project={project} boxAspect={16 / 9} /> : null}
        </div>
      </ParallaxLayer>
    </>
  );
}

/**
 * The client's logo, big - bottom-left on desktop, drawn *above* the morph bar so the bar runs behind it; below lg
 * it leads the stack (logo, copy, video - `--pl-top`, its height `--pl-name`), the bar behind it there too
 * (`--pl-name-cy`).
 */
function PlasicoOverlay({ t }: SceneVisualProps) {
  return (
    <ParallaxLayer t={t} depth={0.3} dx={-0.12} className="pointer-events-none">
      <Image
        src={PLASICO_LOGO}
        alt="Plasico"
        width={497}
        height={128}
        sizes="(max-width: 1024px) 60vw, 36vw"
        loading="eager"
        // From lg the logo is sized by its height - 9.5vh, never over 6.5rem nor wider than the screen allows (7vw
        // of height ≈ 27vw of width) - so it always stays under the copy block's CTA, whose bottom sits at about
        // 83vh (36vw of width used to run up into it on a short, wide screen).
        className="absolute left-[2vw] top-[var(--pl-top)] h-auto w-[60vw] drop-shadow-[0_22px_38px_rgba(31,162,42,0.28)] sm:w-[48vw] lg:left-[max(2rem,3vw)] lg:top-auto lg:bottom-[3vh] lg:h-[clamp(3rem,min(9.5vh,7vw),6.5rem)] lg:w-auto"
      />
    </ParallaxLayer>
  );
}

/* ------------------------------------------------------------------- OSMO */

const OSMO = { green: OSMO_GREEN, deep: "#166F36", light: "#3FBF6C" };
const OSMO_MARK = "/company_icons/osmo_logo_light.png";
const OSMO_MARK_WHITE = "/company_icons/osmo_logo_dark.png";

/**
 * White world. One green circle carries the copy, the wordmark and the 4:5
 * frame stand on its left, a 2vw gap between - one group centred on the
 * screen (the geometry: the `--osmo-*` variables on the scene root,
 * `osmoCircleDesktop` in showcase-timeline.ts in px). Through the
 * final hold the copy fades and the home journey's canvas takes the circle
 * itself over (`journeyMorph`, the same spot and size), then the white world
 * dissolves under it and the circle slides on into the stats' ring.
 */
function OsmoVisual({ t, project, shouldMount }: SceneVisualProps) {
  const { t: dict } = useLanguage();
  return (
    <>
      <div className="absolute inset-0 bg-white" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] [background-size:56px_56px]"
        aria-hidden
      />
      <Sparks colors={[OSMO.deep, OSMO.green]} count={18} region={{ left: [34, 92], top: [10, 92] }} />
      {/* The copy circle: layered radial highlight, a fine dot pattern, a concentric hairline and a deep soft shadow.
          Below lg: centred, its top edge just under the header, 88vw / 52vh - the same numbers as
          `osmoCircleMobile` (showcase-timeline.ts), which the journey's morph takes it over with. Drawn before the
          frame, so the frame can overlap its bottom cap on phones. */}
      <ParallaxLayer t={t} depth={0.2} scale={0.04} className="pointer-events-none">
        <div
          className="absolute left-1/2 top-[calc(max(5.75rem,10vh)+min(44vw,26vh))] aspect-square w-[min(88vw,52vh)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full lg:left-[var(--osmo-cx)] lg:top-[56vh] lg:w-[var(--osmo-d)]"
          style={{
            background: `radial-gradient(120% 120% at 28% 22%, ${OSMO.light} 0%, ${OSMO.green} 46%, ${OSMO.deep} 100%)`,
            boxShadow: "0 50px 120px rgba(22,111,54,.38), inset 0 -30px 80px rgba(0,0,0,.18), inset 0 20px 60px rgba(255,255,255,.14)",
          }}
        >
          <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,.9)_1px,transparent_1.4px)] [background-size:22px_22px]" />
          <div className="absolute inset-[6%] rounded-full border border-white/15" />
          <div className="absolute inset-[13%] rounded-full border border-dashed border-white/10" />
        </div>
      </ParallaxLayer>
      {/* 4:5 frame (the clip cover-fits it) - on desktop at the group's left edge (`--osmo-left`), sized by its
          height (`--osmo-frame-h`: 62vh, never wider than 36vw), a 2vw gap to the circle, the wordmark
          riding the same layer right above it (the gap is fixed: frame bottom 6vh + the frame's height + 1.5rem)
          and sized to the room left under the floating header - 6rem on a short laptop screen, up to 11rem on a
          big one. Below lg it is centred, its top 4% of the disc's diameter up into the disc (under the copy
          block's CTA), as tall as the room down to the mobile dock allows and never wider than 92vw. */}
      <ParallaxLayer t={t} depth={0.08} dx={0.1} className="pointer-events-none">
        <div
          className="absolute left-1/2 top-[calc(max(5.75rem,10vh)+min(88vw,52vh)*0.96)] aspect-[4/5] h-[calc(100svh-max(5.75rem,10vh)-min(88vw,52vh)*0.96-6rem)] max-h-[115vw] -translate-x-1/2 overflow-hidden rounded-3xl lg:left-[var(--osmo-left)] lg:top-auto lg:bottom-[6vh] lg:h-[var(--osmo-frame-h)] lg:max-h-none lg:translate-x-0"
          style={{ backgroundColor: "#111111", boxShadow: "0 50px 120px rgba(17,17,17,.3)" }}
        >
          <ProjectThumbnail project={project} alt={dict.projects.items[project.id].name} sizes="(max-width: 1024px) 92vw, 40vw" />
          {shouldMount ? <ProjectEmbedCover project={project} boxAspect={4 / 5} /> : null}
        </div>
        <Reveal t={t} delay={0.02} className="absolute left-[var(--osmo-left)] bottom-[calc(6vh+var(--osmo-frame-h)+1.5rem)] hidden lg:block">
          <Image src={OSMO_MARK} alt="OSMO" width={1064} height={505} sizes="480px" className="h-[clamp(6rem,calc(94vh-var(--osmo-frame-h)-8rem),11rem)] w-auto" />
        </Reveal>
      </ParallaxLayer>
      {/* Wordmark below lg: small, centred inside the top of the green disc (white-ink file); the copy block sits
          under it (layout `in-circle`). */}
      <ParallaxLayer t={t} depth={0.35} className="pointer-events-none lg:hidden">
        <Reveal t={t} delay={0.02} className="absolute left-1/2 top-[calc(max(5.75rem,10vh)+1.25rem)] -translate-x-1/2">
          <Image src={OSMO_MARK_WHITE} alt="OSMO" width={2400} height={1340} sizes="240px" className="h-20 w-auto sm:h-24" />
        </Reveal>
      </ParallaxLayer>
    </>
  );
}

/* --------------------------------------------------------------- Fallback */

/** Generic world for a project without a bespoke scene: accent gradient + the clip, cover-fit. */
function FallbackVisual({ t, project, shouldMount }: SceneVisualProps) {
  const [a, b] = project.accent;
  return (
    <ParallaxLayer t={t} depth={-0.08} scale={0.08} className="pointer-events-none -inset-[6%]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `radial-gradient(120% 90% at 88% 12%, color-mix(in srgb, ${b} 58%, ${DEEP}) 0%, transparent 58%)`,
            `radial-gradient(110% 100% at 8% 92%, color-mix(in srgb, ${a} 62%, ${DEEP}) 0%, transparent 60%)`,
            `linear-gradient(160deg, color-mix(in srgb, ${a} 30%, ${DEEP}) 0%, ${DEEP} 52%, color-mix(in srgb, ${b} 24%, ${DEEP}) 100%)`,
          ].join(", "),
        }}
      >
        {shouldMount ? <ProjectEmbedCover project={project} boxAspect={16 / 9} className="scale-[1.15]" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/20" />
      </div>
    </ParallaxLayer>
  );
}

const NO_SHAPE: Omit<MorphTarget, "color"> = { w: [0, 0], h: [0, 0], x: 0.5, y: 0.5, alpha: 0 };

const SCENES: Partial<Record<ProjectKey, SceneVisual>> = {
  boleron: {
    headline: PROJECT_DISPLAY_FONT.boleron,
    tone: "dark",
    background: BOLERON.blue,
    layout: "boleron",
    morph: { ...NO_SHAPE, color: BOLERON.violet },
    mark: "none",
    // Below lg: the word (22vw tall), the copy block (about 11.5rem, 13.5rem from sm) a rem under it and Roni two
    // rem under that - a stack centred on the screen; the word never higher than 8rem (its parallax layer, depth
    // 0.55, lifts it about 5vh by the time the scene is framed, and it must stay under the header), and Roni as
    // tall as 36vh (44vh from sm) or whatever room is left down to the dock.
    className:
      "[--bol-word:22vw] [--bol-block:11.5rem] [--bol-roni:min(36vh,calc(100svh_-_8rem_-_var(--bol-word)_-_var(--bol-block)_-_5rem))] [--bol-top:max(8rem,calc((100svh_-_var(--bol-word)_-_var(--bol-block)_-_var(--bol-roni)_-_2rem)/2))] sm:[--bol-block:13.5rem] sm:[--bol-roni:min(44vh,calc(100svh_-_8rem_-_var(--bol-word)_-_var(--bol-block)_-_5rem))]",
    Visual: BoleronVisual,
  },
  emblema: {
    // The reference animation's Emblema face: Playfair Display, italic - a size under the layout's ramp, and no line
    // under it: the logo leads, the headline follows. The cap breaks „Емоцията на дома, разказана кинематографично"
    // into two balanced lines.
    headline: cn(PROJECT_DISPLAY_FONT.emblema, "max-w-[28ch] text-xl sm:text-2xl lg:text-2xl xl:text-3xl 2xl:text-4xl"),
    highlight: false,
    tone: "light",
    background: EMBLEMA.bg,
    layout: "center-bottom",
    morph: { ...NO_SHAPE, color: EMBLEMA.gold },
    // Below lg: the copy block (about 14rem, 16.5rem from sm) and the full-width towers (1284:716 - 55.76vw tall,
    // 44.61vw at 80vw from sm) stack 1.5rem apart, the stack centred on the screen but never up into the header.
    className:
      "[--emb-block:14rem] [--emb-towers:55.76vw] [--emb-top:max(6rem,calc((100svh_-_var(--emb-block)_-_var(--emb-towers)_-_1.5rem)/2))] sm:[--emb-block:16.5rem] sm:[--emb-towers:44.61vw]",
    Visual: EmblemaVisual,
  },
  mindguard: {
    headline: PROJECT_DISPLAY_FONT.mindguard,
    tone: "dark",
    background: MINDGUARD.bg,
    layout: "left-column",
    mark: "logo",
    // Full-width hairline at mid-height - the scene animates its own copy of it while framed.
    // y values are the scene's own line (86% / 72%) scaled by the 1.04 hold push-in about the stage centre, so the
    // travelling hairline lands exactly on it at hand-off.
    morph: { w: [1, 0], h: [0, 0], px: 1, x: 0.5, y: 0.8744, yMobile: 0.4168, color: MINDGUARD.teal, alpha: 0.5, ownsShape: true },
    Detail: MindguardShownTo,
    Visual: MindguardVisual,
  },
  plasico: {
    headline: PROJECT_DISPLAY_FONT.plasico,
    tone: "light",
    background: "#FFFFFF",
    layout: "top-left-wide",
    // Full-width bar along the bottom in the soft secondary green; below lg it rides the giant name (the stack's
    // variables, `--pl-name-cy`).
    morph: { w: [1, 0], h: [0, 0.09], x: 0.5, y: 0.93, yMobile: "var(--pl-name-cy)", hMobile: "calc(var(--pl-name) * 1.2)", color: PLASICO.soft, alpha: 0.9 },
    mark: "none",
    // Below lg: the logo (60vw wide - 15.45vw tall at its 497:128; 48vw / 12.36vw from sm), the copy block (about
    // 12rem, 13.5rem from sm) 1.5rem under it and the 16:9 frame (88vw wide, 80vw from sm) a rem under that - a
    // stack centred on the screen but never up into the header. The bar behind the logo is only 1.2 × the logo's
    // height there (`hMobile`), so it never reaches the headline; its centre (`--pl-name-cy`) sits 2.8vh above the
    // logo's resting centre: the logo rides a parallax layer (depth 0.3, −35vh × depth × t) and has drifted that
    // far up by the time the scene is framed (t 0.27), the bar has not.
    className:
      "[--pl-name:15.45vw] [--pl-block:12rem] [--pl-video:49.5vw] [--pl-top:max(6rem,calc((100svh_-_var(--pl-name)_-_var(--pl-block)_-_var(--pl-video)_-_2.5rem)/2))] [--pl-name-cy:calc(var(--pl-top)_+_var(--pl-name)/2_-_2.8vh)] sm:[--pl-name:12.36vw] sm:[--pl-block:13.5rem] sm:[--pl-video:45vw]",
    Visual: PlasicoVisual,
    Overlay: PlasicoOverlay,
  },
  osmo: {
    headline: PROJECT_DISPLAY_FONT.osmo,
    // Copy sits inside the solid green circle, so the overlay is white-on-green.
    tone: "dark",
    background: "#FFFFFF",
    layout: "in-circle",
    // The morph shape arrives on the scene's copy circle and fades out there (the circle beneath takes over -
    // the overlay must not sit on the copy); the home journey's canvas takes the circle over at the outro.
    morph: { w: [OSMO_CIRCLE.d, 0], h: [OSMO_CIRCLE.d, 0], x: OSMO_CIRCLE.x, y: OSMO_CIRCLE.y, xMobile: 0.5, yMobile: 0.3, color: OSMO.green, alpha: 0 },
    mark: "none",
    // The desktop geometry (see `osmoCircleDesktop`): the frame's height, the circle's diameter, the group's left
    // edge (the frame's) and the circle's centre - frame, a 2vw gap, circle, the pair centred.
    className:
      "[--osmo-frame-h:min(62vh,45vw)] [--osmo-d:min(46vw,88vh)] [--osmo-frame-w:calc(var(--osmo-frame-h)*0.8)] [--osmo-left:calc((100vw_-_var(--osmo-frame-w)_-_var(--osmo-d)_-_2vw)/2)] [--osmo-cx:calc(var(--osmo-left)_+_var(--osmo-frame-w)_+_2vw_+_var(--osmo-d)/2)]",
    Visual: OsmoVisual,
  },
};

export function sceneVisualFor(project: Project): SceneVisual {
  return (
    SCENES[project.id] ?? {
      tone: "dark",
      background: DEEP,
      layout: "bottom-left",
      morph: { ...NO_SHAPE, color: project.accent[1] },
      Visual: FallbackVisual,
    }
  );
}
