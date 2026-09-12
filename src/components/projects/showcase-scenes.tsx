"use client";

import { type ComponentType } from "react";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";
import { IconSparklesFilled } from "@tabler/icons-react";
import { ProjectThumbnail } from "@/components/projects-section";
import {
  clamp01,
  easeInOut,
  easeOut,
  EmbedCover,
  FrameSequence,
  ParallaxLayer,
  ProjectEmbedCover,
  Reveal,
  Sparks,
} from "@/components/projects/showcase-primitives";
import { bunnyBackgroundEmbedSrc, type BunnyVideo } from "@/lib/bunny-stream";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS, PARTNER_ICON_BASE } from "@/lib/partners";
import type { Project, ProjectKey } from "@/lib/projects";
import { cn } from "@/lib/utils";

/*
 * Per-brand worlds for the home "case studies journey", ported from the
 * "Smooth scroll case studies section" design (one bespoke scene per client:
 * background, glows, particles, hero visual, morph-overlay target). The shared
 * text overlay (name / headline / highlight / tags / CTA per `layout`) is
 * drawn by `projects-showcase.tsx` on top of these. A scene may also ship an
 * `Overlay` - rendered *above* the travelling morph shape (e.g. the Plasico
 * logo the green bar passes behind).
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
  /** Where the name / headline / highlight / tags / CTA block sits. */
  layout: "bottom-left" | "center" | "top-left";
  morph: MorphTarget;
  Visual: ComponentType<SceneVisualProps>;
  /** Optional layer drawn above the morph overlay (same scene transform). */
  Overlay?: ComponentType<SceneVisualProps>;
};

/** Partner logo file for a scene (the light-background variant, as these worlds are light or carry a white pill). */
function partnerLogo(id: string) {
  const partner = PARTNERS.find((candidate) => candidate.id === id);
  const file = partner?.light ?? partner?.dark ?? null;
  return partner && file ? { src: `${PARTNER_ICON_BASE}${file}`, alt: partner.ariaLabel } : null;
}

const DEEP = "#070b1a";

/* ---------------------------------------------------------------- Boleron */

const BOLERON = { bg: "#2A1552", deep: "#1A0C36", glow: "#B48CFF" };
const RONI_FRAMES = 72;

function BoleronVisual({ t, framesEnabled }: SceneVisualProps) {
  // Roni raises the phone while the scene frames; then sinks away as the wipe passes.
  const roniProgress = useTransform(t, (v) => (v + 0.6) / 1.3);
  const roniSink = useTransform(t, (v) => `${70 * easeInOut(clamp01((v - 0.25) / 0.75))}vh`);
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(90% 70% at 50% 40%, #4A2A8A 0%, ${BOLERON.bg} 60%, ${BOLERON.deep} 100%)`,
        }}
      />
      <ParallaxLayer t={t} depth={0.2} scale={0.15} className="pointer-events-none">
        <div className="absolute left-1/2 top-[44%] size-[min(78vh,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B48CFF]/35" />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={0.35} scale={0.25} className="pointer-events-none">
        <div className="absolute left-1/2 top-[44%] size-[min(104vh,960px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#B48CFF]/20" />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.05} className="pointer-events-none">
        <div
          className="absolute left-1/2 top-[44%] size-[min(60vh,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[30px]"
          style={{ background: `radial-gradient(circle, rgba(180,140,255,.5) 0%, rgba(180,140,255,0) 65%)` }}
        />
      </ParallaxLayer>
      {/* Two satellites orbiting the inner ring. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[44%] size-[min(78vh,720px)] -translate-x-1/2 -translate-y-1/2 animate-spin [animation-duration:40s]"
        aria-hidden
      >
        <span
          className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: BOLERON.glow, boxShadow: "0 0 24px 6px rgba(180,140,255,.6)" }}
        />
        <span className="absolute left-0 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      </div>
      {/* Giant brand name behind Roni. */}
      <ParallaxLayer t={t} depth={0.55} className="pointer-events-none">
        <span
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-heading text-[clamp(96px,24vw,400px)] font-black leading-none tracking-[-0.05em] text-white"
          aria-hidden
        >
          Boleron
        </span>
      </ParallaxLayer>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh]"
        style={{ background: `linear-gradient(180deg, transparent, ${BOLERON.deep})` }}
      />
      <ParallaxLayer t={t} depth={-0.1} className="pointer-events-none">
        <motion.div
          className="absolute left-[64%] bottom-[30vh] aspect-[1206/1054] h-[34vh] -translate-x-1/2 [mask-image:linear-gradient(180deg,#000_0%,#000_72%,transparent_97%)] sm:h-[44vh] lg:left-[66%] lg:bottom-[6vh] lg:h-[min(64vh,720px)]"
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

const EMBLEMA_LOGO = partnerLogo("emblema");

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
      {/* Emblema wordmark, top-centre (clear of the floating header). */}
      {EMBLEMA_LOGO ? (
        <ParallaxLayer t={t} depth={0.3} className="pointer-events-none">
          <Reveal t={t} delay={0} className="absolute left-1/2 top-[max(5.5rem,10vh)] -translate-x-1/2">
            <Image
              src={EMBLEMA_LOGO.src}
              alt={EMBLEMA_LOGO.alt}
              width={739}
              height={370}
              sizes="(max-width: 1024px) 40vw, 300px"
              className="h-auto w-[min(40vw,300px)] max-h-[16vh] object-contain"
            />
          </Reveal>
        </ParallaxLayer>
      ) : null}
      <ParallaxLayer t={t} depth={0.12} className="pointer-events-none">
        <div className="absolute left-1/2 bottom-[26vh] aspect-[1284/716] h-[30vh] -translate-x-1/2 sm:h-[40vh] lg:bottom-[16vh] lg:h-[min(60vh,700px)]">
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
              className="absolute inset-0 drop-shadow-[0_12px_22px_rgba(30,27,23,0.18)]"
            />
            {buildings.map((building, i) => (
              <motion.div
                key={building.name}
                className={cn(
                  "absolute top-[94%] flex -translate-x-1/2 flex-col items-center gap-1.5 text-center",
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
  const anchor = "left-1/2 top-[38%] lg:left-[70%] lg:top-1/2";
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(80% 60% at 50% 45%, #16305A 0%, ${MINDGUARD.bg} 55%, #070F22 100%)` }}
      />
      <ParallaxLayer t={t} depth={-0.12} className="pointer-events-none">
        <motion.div
          className={cn("absolute aspect-square w-[min(700px,50vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7DDED2]/20", anchor)}
          style={{ opacity: ringK, scale: ringScale }}
        />
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.12} scale={0.1} className="pointer-events-none">
        <div
          className={cn("animate-showcase-breathe absolute aspect-square w-[min(720px,52vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[18px] [animation-duration:6s]", anchor)}
          style={{ background: tealGlow }}
        />
        <div
          className={cn("absolute aspect-[16/10.4] w-[min(600px,43vw)] -translate-x-1/2 -translate-y-1/2 rounded-[40px] blur-[40px]", anchor)}
          style={{ backgroundColor: "rgba(125,222,210,.35)" }}
        />
      </ParallaxLayer>
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[38%] h-px origin-left lg:top-1/2"
        style={{ backgroundColor: "rgba(125,222,210,.5)", opacity: waveVisible, scaleX: waveK }}
        aria-hidden
      />
      <motion.span
        className="pointer-events-none absolute top-[38%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full lg:top-1/2"
        style={{ backgroundColor: MINDGUARD.teal, boxShadow: "0 0 10px rgba(125,222,210,.9)", left: dotLeft, opacity: dotOpacity }}
        aria-hidden
      />
      <Sparks colors={["#F4F7FB", MINDGUARD.teal]} count={26} region={{ left: [8, 92], top: [30, 95] }} size={1.5} />
      {/* Tablet frame with the clip (or the branded placeholder until it's published). */}
      <ParallaxLayer t={t} depth={-0.12} rotate={-2} className="pointer-events-none">
        <motion.div
          className={cn("absolute aspect-[16/10.4] w-[78vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-[#7DDED2]/25 p-[2.6%] sm:w-[60vw] lg:w-[min(560px,40vw)]", anchor)}
          style={{ backgroundColor: "#0E1D3A", opacity: tabletK, y: tabletY, scale: tabletScale, boxShadow: tabletShadow }}
        >
          <div className="absolute inset-[2.6%] overflow-hidden rounded-2xl" style={{ backgroundColor: "#070F22" }}>
            <ProjectThumbnail project={project} alt={dict.projects.items[project.id].name} sizes="(max-width: 1024px) 78vw, 560px" />
            {shouldMount ? <ProjectEmbedCover project={project} boxAspect={16 / 10.4} /> : null}
          </div>
          <span className="absolute left-1/2 top-[1.1%] size-1.5 -translate-x-1/2 rounded-full" style={{ backgroundColor: "#1B2E52" }} />
        </motion.div>
      </ParallaxLayer>
    </>
  );
}

/* ---------------------------------------------------------------- Plasico */

const PLASICO = { green: "#1FA22A", lime: "#5FBF2F" };
const PLASICO_LOGO = partnerLogo("plasico");
/** "Plasico - Back to Work 4K" (16:9), hosted on Bunny Stream. `null` shows the branded placeholder. */
const PLASICO_WIDE_VIDEO: BunnyVideo | null = { library: "750681", id: "481d2093-0dc0-44db-bda4-4d562c20d8fe" };

function PlasicoVisual({ t, project, shouldMount }: SceneVisualProps) {
  return (
    <>
      <div className="absolute inset-0 bg-white" />
      {/* Giant green name bleeding off the bottom-left. */}
      <ParallaxLayer t={t} depth={0.3} dx={-0.25} className="pointer-events-none">
        <span
          className="absolute -left-[1vw] -bottom-[7vw] select-none whitespace-nowrap font-heading text-[34vw] font-black uppercase leading-none tracking-[-0.02em]"
          style={{ color: PLASICO.green }}
          aria-hidden
        >
          Plasico
        </span>
      </ParallaxLayer>
      <ParallaxLayer t={t} depth={-0.15} className="pointer-events-none">
        <div
          className="absolute right-[calc(clamp(16px,8vw,140px)+min(180px,15vw))] top-[calc(clamp(96px,14vh,140px)+35vh)] aspect-square w-[min(640px,54vw)] translate-x-1/2 -translate-y-1/2 rounded-full blur-[20px]"
          style={{ background: "radial-gradient(closest-side, rgba(95,191,47,.45) 0%, rgba(95,191,47,.18) 45%, transparent 100%)" }}
        />
      </ParallaxLayer>
      <Sparks colors={[PLASICO.green, PLASICO.lime]} count={24} region={{ left: [52, 96], top: [12, 90] }} glow={8} />
      {/* Tilted tall card with the brand film. */}
      <ParallaxLayer t={t} depth={-0.15} rotate={-4} className="pointer-events-none">
        <div
          className="absolute right-[6vw] top-[14vh] h-[46vh] w-[52vw] overflow-hidden rounded-[20px] sm:w-[40vw] lg:right-[clamp(16px,8vw,140px)] lg:top-[clamp(96px,14vh,140px)] lg:h-[60vh] lg:w-[min(360px,30vw)]"
          style={{ backgroundColor: "#EAF6E6", boxShadow: "0 40px 100px rgba(31,162,42,.25)" }}
        >
          <ProjectThumbnail project={project} alt="" sizes="(max-width: 1024px) 52vw, 360px" />
          {shouldMount ? <ProjectEmbedCover project={project} boxAspect={0.7} /> : null}
        </div>
      </ParallaxLayer>
      {/* Second frame, 16:9 - the wide film ("Back to Work"). */}
      <ParallaxLayer t={t} depth={0.05} dx={-0.08} rotate={2} className="pointer-events-none">
        <div
          className="absolute left-[5vw] top-[62vh] aspect-video w-[48vw] overflow-hidden rounded-2xl sm:w-[40vw] lg:left-auto lg:right-[calc(clamp(16px,8vw,140px)+min(360px,30vw)+3vw)] lg:top-[54vh] lg:w-[min(380px,30vw)]"
          style={{ backgroundColor: "#EAF6E6", boxShadow: "0 30px 70px rgba(31,162,42,.22)" }}
        >
          {PLASICO_WIDE_VIDEO ? (
            shouldMount ? (
              <EmbedCover src={bunnyBackgroundEmbedSrc(PLASICO_WIDE_VIDEO)} boxAspect={16 / 9} />
            ) : null
          ) : (
            <div className="absolute inset-0 bg-primary-gradient opacity-90" aria-hidden>
              <IconSparklesFilled className="absolute right-4 top-4 size-8 text-white/40" aria-hidden />
            </div>
          )}
        </div>
      </ParallaxLayer>
    </>
  );
}

/** Plasico wordmark on a white pill, seated on the green morph bar (which passes behind it). */
function PlasicoOverlay({ t }: SceneVisualProps) {
  if (!PLASICO_LOGO) return null;
  return (
    <Reveal
      t={t}
      delay={0.2}
      className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 lg:bottom-auto lg:top-[93%] lg:-translate-y-1/2"
    >
      <span className="inline-flex items-center rounded-full bg-white px-6 py-3 shadow-[0_12px_32px_rgba(31,162,42,0.25)] ring-1 ring-black/5">
        <Image
          src={PLASICO_LOGO.src}
          alt={PLASICO_LOGO.alt}
          width={497}
          height={128}
          sizes="180px"
          className="h-8 w-auto object-contain sm:h-10"
        />
      </span>
    </Reveal>
  );
}

/* ------------------------------------------------------------------- OSMO */

const OSMO = { green: "#1E9E4A", deep: "#166F36" };

function OsmoVisual({ t, project, shouldMount }: SceneVisualProps) {
  const { t: dict } = useLanguage();
  return (
    <>
      <div className="absolute inset-0 bg-white" />
      <ParallaxLayer t={t} depth={0.1} dx={0.1} className="pointer-events-none">
        <div
          className="absolute right-[calc(clamp(16px,6vw,96px)+min(200px,17vw))] top-[calc(clamp(96px,16vh,140px)+33vh)] aspect-square w-[min(900px,74vw)] translate-x-1/2 -translate-y-1/2 rounded-full blur-[30px]"
          style={{ background: "radial-gradient(closest-side, rgba(30,158,74,.7) 0%, rgba(30,158,74,.35) 40%, rgba(30,158,74,.1) 70%, transparent 100%)" }}
        />
      </ParallaxLayer>
      <Sparks colors={[OSMO.deep, OSMO.green]} count={24} region={{ left: [44, 98], top: [10, 92] }} />
      {/* Big portrait frame with the spot… */}
      <ParallaxLayer t={t} depth={0.1} dx={0.2} className="pointer-events-none">
        <div
          className="absolute right-[6vw] top-[14vh] h-[44vh] w-[62vw] overflow-hidden sm:w-[46vw] lg:right-[clamp(16px,6vw,96px)] lg:top-[clamp(96px,16vh,140px)] lg:h-[58vh] lg:w-[min(520px,44vw)]"
          style={{ backgroundColor: "#111111" }}
        >
          <ProjectThumbnail project={project} alt={dict.projects.items[project.id].name} sizes="(max-width: 1024px) 62vw, 520px" />
          {shouldMount ? <ProjectEmbedCover project={project} boxAspect={1.35} /> : null}
        </div>
      </ParallaxLayer>
      {/* …and a small detail square tucked into its bottom-left corner. */}
      <ParallaxLayer t={t} depth={0.6} dx={-0.1} className="pointer-events-none">
        <div
          className="absolute right-[calc(6vw+62vw-30vw)] top-[calc(14vh+44vh-30vw+6vh)] aspect-square w-[30vw] overflow-hidden sm:right-[calc(6vw+46vw-22vw)] sm:w-[22vw] lg:right-[calc(clamp(16px,6vw,96px)+min(520px,44vw)-min(240px,22vw))] lg:top-[calc(clamp(96px,16vh,140px)+58vh-min(240px,22vw)+8vh)] lg:w-[min(240px,22vw)]"
          style={{ backgroundColor: OSMO.green, boxShadow: "0 30px 60px rgba(17,17,17,.25)" }}
        >
          <ProjectThumbnail project={project} alt="" sizes="(max-width: 1024px) 30vw, 240px" />
        </div>
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
    background: BOLERON.bg,
    layout: "bottom-left",
    morph: { ...NO_SHAPE, color: BOLERON.glow },
    Visual: BoleronVisual,
  },
  emblema: {
    tone: "light",
    background: EMBLEMA.bg,
    layout: "center",
    morph: { ...NO_SHAPE, color: EMBLEMA.gold },
    Visual: EmblemaVisual,
  },
  mindguard: {
    tone: "dark",
    background: MINDGUARD.bg,
    layout: "bottom-left",
    // Full-width hairline at mid-height - the scene animates its own copy of it while framed.
    morph: { w: [1, 0], h: [0, 0], px: 1, x: 0.5, y: 0.5, color: MINDGUARD.teal, alpha: 0.5, ownsShape: true },
    Visual: MindguardVisual,
  },
  plasico: {
    tone: "light",
    background: "#FFFFFF",
    layout: "top-left",
    // Full-width green bar along the bottom.
    morph: { w: [1, 0], h: [0, 0.09], x: 0.5, y: 0.93, color: PLASICO.lime, alpha: 1 },
    Visual: PlasicoVisual,
    Overlay: PlasicoOverlay,
  },
  osmo: {
    tone: "light",
    background: "#FFFFFF",
    layout: "bottom-left",
    // Big multiply-blended circle bottom-left.
    morph: { w: [0, 0.7], h: [0, 0.7], x: 0.2, y: 0.62, color: OSMO.green, alpha: 0.92, blend: "multiply" },
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
