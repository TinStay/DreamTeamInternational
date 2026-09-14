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
import { OSMO_CIRCLE, OSMO_GREEN } from "@/components/projects/showcase-timeline";
import { useLanguage } from "@/lib/i18n/language-context";
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
  /** `x` / `y` below the lg breakpoint (where scenes lay out differently); default to `x` / `y`. */
  xMobile?: number;
  yMobile?: number;
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
   * left ~56%, right-aligned against a frame on the right.
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
  Visual: ComponentType<SceneVisualProps>;
  /** Optional layer the showcase draws *above* the morph shape (same scene transform). */
  Overlay?: ComponentType<SceneVisualProps>;
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
  const roniSink = useTransform(t, (v) => `${70 * easeInOut(clamp01((v - 0.25) / 0.75))}vh`);
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
        <div className={cn(blob, "right-[10%] top-[48%] h-[22vh] w-[18vw] rotate-[-28deg] rounded-full")} />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={0.32} dx={0.05} scale={0.14} className="pointer-events-none">
        <div className={cn(blob, "left-[-10%] bottom-[-16%] h-[44vh] w-[46vw] rotate-[-12deg] rounded-[50%]")} />
        <div className={cn(blob, "right-[-8%] bottom-[-20%] h-[40vh] w-[40vw] rotate-[18deg] rounded-[48%]")} />
        <div className={cn(blob, "left-[46%] bottom-[8%] h-[16vh] w-[22vw] rotate-[-38deg] rounded-full")} />
      </ParallaxLayer>
      {/* The brand word as live text behind Roni - Montserrat ExtraBold like the reference animation
          (`--font-montserrat` from layout.tsx). Centred up top on phones; on desktop it sits flush left right above
          the copy block (which is bottom-anchored at 8vh - see TEXT_LAYOUT.boleron), 14-16vw by breakpoint and
          bottom-anchored so it stays clear of the floating header on short laptop screens. */}
      <ParallaxLayer t={t} depth={0.55} className="pointer-events-none">
        <span
          className="absolute left-1/2 top-[max(6.5rem,12vh)] -translate-x-1/2 select-none whitespace-nowrap text-[22vw] font-extrabold leading-none tracking-[-0.05em] text-white lg:left-[max(2rem,4vw)] lg:top-auto lg:bottom-[calc(8vh+18rem)] lg:translate-x-0 lg:text-[14vw] xl:text-[15vw] 2xl:bottom-[calc(8vh+20rem)] 2xl:text-[16vw]"
          style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
          aria-hidden
        >
          Boleron
        </span>
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.05} className="pointer-events-none">
        <div
          className="absolute left-[72%] top-[62%] size-[min(64vh,600px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[36px]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 66%)" }}
        />
      </ParallaxLayer>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[28vh]"
        style={{ background: `linear-gradient(180deg, transparent, rgba(30,63,181,.45))` }}
      />
      <ParallaxLayer t={t} depth={-0.1} className="pointer-events-none">
        <motion.div
          className="absolute left-1/2 top-[39vh] aspect-[1206/1054] h-[34vh] -translate-x-1/2 -translate-y-1/2 [mask-image:linear-gradient(180deg,#000_0%,#000_72%,transparent_97%)] sm:top-[42vh] sm:h-[40vh] lg:left-[72%] lg:top-auto lg:bottom-[3vh] lg:h-[min(76vh,880px)] lg:translate-y-0"
          style={{ y: roniSink }}
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
  // Buildings rise from the ground once the scene is framed and finish during the hold.
  const buildProgress = useTransform(t, (v) => clamp01((v + 0.3) / 0.75));
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
      {/* Buildings sequence - oversized so the split towers sit well out to the sides of the centred copy. */}
      <ParallaxLayer t={t} depth={0.12} className="pointer-events-none">
        <div className="absolute left-1/2 top-[max(6.5rem,12vh)] aspect-[1284/716] w-[min(94vw,84vh)] -translate-x-1/2 sm:w-[min(84vw,90vh)] lg:top-auto lg:bottom-[12vh] lg:w-[min(80vw,140vh,1720px)]">
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
              className="absolute inset-0 drop-shadow-[0_12px_22px_rgba(30,27,23,0.18)] [--split-gap:5%] lg:[--split-gap:18%]"
            />
            {buildings.map((building, i) => (
              <motion.div
                key={building.name}
                className={cn(
                  "absolute top-[94%] flex -translate-x-1/2 flex-col items-center gap-1.5 text-center",
                  // Under each tower: the halves sit close on phones, well apart on desktop.
                  i === 0 ? "left-[24%] lg:left-[5%]" : "left-[76%] lg:left-[91%]"
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
 * Navy world. Copy lives in the left half (right-aligned against the frame),
 * the tablet frame fills the right half; the white Mindguard mark floats,
 * ghosted, above the copy.
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
  const tealGlow = `radial-gradient(closest-side, rgba(125,222,210,.85) 0%, rgba(125,222,210,.45) 35%, rgba(125,222,210,.12) 65%, transparent 100%)`;
  const anchor = "left-1/2 top-[72%] lg:left-[72%] lg:top-[58%]";
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
          className={cn("animate-showcase-breathe absolute aspect-square w-[min(920px,62vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[18px] [animation-duration:6s]", anchor)}
          style={{ background: tealGlow }}
        />
        <div
          className={cn("absolute aspect-[16/10.4] w-[min(800px,50vw)] -translate-x-1/2 -translate-y-1/2 rounded-[40px] blur-[40px]", anchor)}
          style={{ backgroundColor: "rgba(125,222,210,.35)" }}
        />
      </ParallaxLayer>
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[72%] h-px origin-left lg:top-[86%]"
        style={{ backgroundColor: "rgba(125,222,210,.5)", opacity: waveVisible, scaleX: waveK }}
        aria-hidden
      />
      <motion.span
        className="pointer-events-none absolute top-[72%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full lg:top-[86%]"
        style={{ backgroundColor: MINDGUARD.teal, boxShadow: "0 0 10px rgba(125,222,210,.9)", left: dotLeft, opacity: dotOpacity }}
        aria-hidden
      />
      <Sparks colors={["#F4F7FB", MINDGUARD.teal]} count={26} region={{ left: [8, 92], top: [30, 95] }} size={1.5} />
      {/* Right column (60%): the Mindguard mark above the tablet frame, both pinned bottom-right on desktop. */}
      <ParallaxLayer t={t} depth={-0.12} rotate={-2} className="pointer-events-none">
        <motion.div
          className="absolute left-1/2 bottom-[9.5rem] flex w-[min(72vw,calc((100svh-36rem)*1.5))] -translate-x-1/2 flex-col items-center gap-4 sm:bottom-[8rem] sm:w-[min(62vw,calc((100svh-38rem)*1.5))] lg:left-auto lg:right-[max(3vw,6rem)] lg:bottom-[6vh] lg:w-[52vw] lg:translate-x-0 lg:items-end lg:gap-[2vw] 2xl:w-[54vw]"
          style={{ opacity: tabletK, y: tabletY, scale: tabletScale }}
        >
          <motion.div
            className="relative aspect-[16/10.4] w-full overflow-hidden rounded-[28px] border border-[#7DDED2]/25 p-[2.6%]"
            style={{ backgroundColor: "#0E1D3A", boxShadow: tabletShadow }}
          >
            <div className="absolute inset-[2.6%] overflow-hidden rounded-2xl" style={{ backgroundColor: "#070F22" }}>
              <ProjectThumbnail project={project} alt={dict.projects.items[project.id].name} sizes="(max-width: 1024px) 84vw, 680px" />
              {shouldMount ? (
                <ProjectEmbedCover
                  project={{ videoId: project.showcaseVideoId ?? project.videoId, orientation: project.orientation }}
                  boxAspect={16 / 10.4}
                />
              ) : null}
            </div>
            <span className="absolute left-1/2 top-[1.1%] size-1.5 -translate-x-1/2 rounded-full" style={{ backgroundColor: "#1B2E52" }} />
          </motion.div>
        </motion.div>
      </ParallaxLayer>
    </>
  );
}

/* ---------------------------------------------------------------- Plasico */

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
          className="absolute left-[62%] top-[40%] aspect-square w-[min(720px,60vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[20px]"
          style={{ background: "radial-gradient(closest-side, rgba(95,191,47,.4) 0%, rgba(95,191,47,.16) 45%, transparent 100%)" }}
        />
      </ParallaxLayer>
      <Sparks colors={[PLASICO.green, PLASICO.lime]} count={28} region={{ left: [4, 96], top: [10, 90] }} glow={8} />
      {/* Wide film ("Back to Work") - right of the copy, vertically centred and reaching the right margin on desktop
          (clear of the giant name along the bottom); under the copy on mobile. */}
      <ParallaxLayer t={t} depth={-0.12} rotate={-1.5} className="pointer-events-none">
        <div
          className="absolute left-[6vw] top-[55vh] aspect-video w-[88vw] overflow-hidden rounded-2xl sm:left-[10vw] sm:top-[48vh] sm:w-[80vw] lg:left-auto lg:right-[max(3vw,6rem)] lg:top-[47vh] lg:w-[54vw] lg:-translate-y-1/2 xl:w-[56vw] 2xl:w-[52vw]"
          style={{ backgroundColor: "#EAF6E6", boxShadow: "0 40px 100px rgba(31,162,42,.25)" }}
        >
          <ProjectThumbnail project={project} alt="" sizes="(max-width: 1024px) 88vw, 56vw" />
          {shouldMount ? <ProjectEmbedCover project={project} boxAspect={16 / 9} /> : null}
        </div>
      </ParallaxLayer>
    </>
  );
}

/** Giant green name, bottom-left, drawn *above* the morph bar so the bar runs behind the letters. */
function PlasicoOverlay({ t }: SceneVisualProps) {
  return (
    <ParallaxLayer t={t} depth={0.3} dx={-0.12} className="pointer-events-none">
      <span
        className="absolute left-[2vw] bottom-[5.5rem] select-none whitespace-nowrap font-heading text-[12vw] font-black uppercase leading-none tracking-[-0.02em] drop-shadow-[0_22px_38px_rgba(31,162,42,0.28)] sm:text-[15vw] lg:-bottom-[0.18em] lg:text-[15vw] 2xl:text-[19vw]"
        style={{ color: PLASICO.green }}
        aria-hidden
      >
        Plasico
      </span>
    </ParallaxLayer>
  );
}

/* ------------------------------------------------------------------- OSMO */

const OSMO = { green: OSMO_GREEN, deep: "#166F36", light: "#3FBF6C" };
const OSMO_MARK = "/company_icons/osmo_logo_light.png";
const OSMO_MARK_WHITE = "/company_icons/osmo_logo_dark.png";

/**
 * White world. One green circle on the right carries the copy; the left
 * column has the wordmark up top and the 4:3 frame at the bottom. Through the
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
      <Sparks colors={[OSMO.deep, OSMO.green]} count={18} region={{ left: [46, 98], top: [10, 92] }} />
      {/* 4:3 frame (the clip cover-fits it) - bottom-left on desktop, sized so the wordmark riding the same layer
          right above it (the gap is fixed: frame bottom 6vh + its 4:3 height + 1.5rem) clears the floating header
          even on short laptop screens. Under the disc on mobile. */}
      <ParallaxLayer t={t} depth={0.08} dx={0.1} className="pointer-events-none">
        <div
          className="absolute left-[5vw] right-[5vw] top-[58vh] aspect-[4/3] overflow-hidden rounded-3xl sm:left-[30vw] sm:top-auto sm:bottom-[6.5rem] lg:left-[max(3vw,6rem)] lg:right-auto lg:bottom-[6vh] lg:w-[36vw] xl:w-[38vw] 2xl:w-[36vw]"
          style={{ backgroundColor: "#111111", boxShadow: "0 50px 120px rgba(17,17,17,.3)" }}
        >
          <ProjectThumbnail project={project} alt={dict.projects.items[project.id].name} sizes="(max-width: 1024px) 90vw, 60vw" />
          {shouldMount ? <ProjectEmbedCover project={project} boxAspect={4 / 3} /> : null}
        </div>
        <Reveal
          t={t}
          delay={0.02}
          className="absolute left-[max(3vw,6rem)] bottom-[calc(6vh+27vw+1.5rem)] hidden lg:block xl:bottom-[calc(6vh+28.5vw+1.5rem)] 2xl:bottom-[calc(6vh+27vw+1.5rem)]"
        >
          <Image src={OSMO_MARK} alt="OSMO" width={1064} height={505} sizes="480px" className="h-24 w-auto xl:h-28" />
        </Reveal>
      </ParallaxLayer>
      {/* The copy circle: layered radial highlight, a fine dot pattern, a concentric hairline and a deep soft shadow. */}
      <ParallaxLayer t={t} depth={0.2} scale={0.04} className="pointer-events-none">
        <div
          className="absolute left-1/2 top-[38vh] aspect-square w-[116vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full sm:top-[32vh] sm:w-[min(116vw,84vh)] lg:left-[75vw] lg:top-[56vh] lg:w-[min(46vw,88vh)]"
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
      {/* Wordmark below lg: centred on top of the green disc (white-ink file). */}
      <ParallaxLayer t={t} depth={0.35} className="pointer-events-none lg:hidden">
        <Reveal t={t} delay={0.02} className="absolute left-1/2 top-[max(7rem,11vh)] -translate-x-1/2 sm:left-8 sm:top-[max(8rem,12vh)] sm:translate-x-0">
          <Image src={OSMO_MARK_WHITE} alt="OSMO" width={2400} height={1340} sizes="50vw" className="h-20 w-auto sm:h-24" />
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
    tone: "dark",
    background: BOLERON.blue,
    layout: "boleron",
    morph: { ...NO_SHAPE, color: BOLERON.violet },
    mark: "none",
    Visual: BoleronVisual,
  },
  emblema: {
    tone: "light",
    background: EMBLEMA.bg,
    layout: "center-bottom",
    morph: { ...NO_SHAPE, color: EMBLEMA.gold },
    Visual: EmblemaVisual,
  },
  mindguard: {
    tone: "dark",
    background: MINDGUARD.bg,
    layout: "left-column",
    mark: "logo",
    // Full-width hairline at mid-height - the scene animates its own copy of it while framed.
    // y values are the scene's own line (86% / 72%) scaled by the 1.04 hold push-in about the stage centre, so the
    // travelling hairline lands exactly on it at hand-off.
    morph: { w: [1, 0], h: [0, 0], px: 1, x: 0.5, y: 0.8744, yMobile: 0.7288, color: MINDGUARD.teal, alpha: 0.5, ownsShape: true },
    Visual: MindguardVisual,
  },
  plasico: {
    tone: "light",
    background: "#FFFFFF",
    layout: "top-left-wide",
    // Full-width green bar along the bottom.
    // Full-width bar along the bottom in the soft secondary green.
    morph: { w: [1, 0], h: [0, 0.09], x: 0.5, y: 0.93, yMobile: 0.87, color: PLASICO.soft, alpha: 0.9 },
    mark: "none",
    Visual: PlasicoVisual,
    Overlay: PlasicoOverlay,
  },
  osmo: {
    // Copy sits inside the solid green circle, so the overlay is white-on-green.
    tone: "dark",
    background: "#FFFFFF",
    layout: "in-circle",
    // The morph shape arrives on the scene's copy circle and fades out there (the circle beneath takes over -
    // the overlay must not sit on the copy); the home journey's canvas takes the circle over at the outro.
    morph: { w: [OSMO_CIRCLE.d, 0], h: [OSMO_CIRCLE.d, 0], x: OSMO_CIRCLE.x, y: OSMO_CIRCLE.y, xMobile: 0.5, yMobile: 0.38, color: OSMO.green, alpha: 0 },
    mark: "none",
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
