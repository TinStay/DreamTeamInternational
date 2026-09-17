"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { motion, useMotionTemplate, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import type { JourneyBackdrop, JourneyBackdropProps, JourneyMorph } from "@/components/ui/scroll-journey";
import { OSMO_HANDOFF_START, SHOWCASE_HOLD, osmoCircleDesktop, osmoCircleLayer, osmoCircleMobile } from "@/components/projects/showcase-timeline";

/*
 * Background furniture for the home journeys, drawn on the journey's fixed
 * canvas behind the transparent scenes. `journeyMorph` is ONE shape that
 * travels the whole journey after the projects - it takes the OSMO copy circle
 * over from the showcase (same spot, same size) and slides it into the ring
 * behind the stats, then the two lines beside the reviews, the frame behind the
 * trainings and the outer signal ring behind the contact details, station by
 * station as the journey position moves. The per-scene backdrops add what the
 * shape cannot be: the lines' particles, the atom fields, the inner waves, the
 * soft blobs. All decorative (`aria-hidden` comes from the canvas).
 */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 0 → 1 across [a, b]. */
const across = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ morph */

/** A station of the shape: centre, size and corner radius, in viewport px. */
type Geo = { x: number; y: number; w: number; h: number; r: number };
type Viewport = { w: number; h: number };

const circle = (x: number, y: number, d: number): Geo => ({ x, y, w: d, h: d, r: d / 2 });
const lerpGeo = (a: Geo, b: Geo, t: number): Geo => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  r: lerp(a.r, b.r, t),
});

/** OSMO's copy circle look, carried by the shape while it is green: the radial highlight and the deep soft shadow. */
const OSMO_LOOK = { light: "#3FBF6C", green: "#1E9E4A", deep: "#166F36" };

/**
 * Where the shape sits when each scene is fully in (index = journey position
 * - 1), for this viewport: the layouts differ below `lg` / `md`, as do the
 * sections' own layouts.
 */
function stations(vp: Viewport): Geo[] {
  const { w: vw, h: vh } = vp;
  const lg = vw >= 1024;
  const md = vw >= 768;
  const disc = lg ? osmoCircleDesktop(vw, vh) : osmoCircleMobile(vw, vh);
  return [
    // 0 · the OSMO copy circle (× its outro swell, applied by the caller) - where the showcase leaves it
    circle(disc.x, disc.y, disc.d),
    // 1 · the ring behind the stats
    circle(0.5 * vw, 0.58 * vh, Math.min(0.46 * vw, 0.72 * vh)),
    // 2 · the two lines beside the reviews: a rectangle taller than the viewport, so only its sides show (they sit
    //     exactly where `linesBackdrop` draws its lines - 8 / 92 %, 3 / 97 % on phones)
    { x: 0.5 * vw, y: 0.5 * vh, w: (md ? 0.84 : 0.94) * vw, h: 1.4 * vh, r: 0 },
    // 3 · the frame behind the training cards
    lg ? { x: 0.5 * vw, y: 0.55 * vh, w: 0.74 * vw, h: 0.62 * vh, r: 40 } : { x: 0.5 * vw, y: 0.52 * vh, w: 0.92 * vw, h: 0.7 * vh, r: 32 },
    // 4 · the outer signal ring behind the contact details (the inner ones come from `wavesBackdrop`)
    lg ? circle(0.82 * vw, 0.56 * vh, Math.min(0.46 * vw, 0.8 * vh)) : circle(0.5 * vw, 0.64 * vh, Math.min(1.2 * vw, 0.6 * vh)),
    // 5 · gone (the process draws its own wave)
    circle(0.5 * vw, 0.5 * vh, 0),
  ];
}

/**
 * The OSMO copy circle as the showcase actually draws it at scene time `t`: its layer's parallax (scale about the
 * stage centre, a drift upward) and the hold's push-in (again about the stage centre).
 */
function osmoCircleAt(t: number, vp: Viewport): Geo {
  const d = stations(vp)[0];
  const { push, scale, lift } = osmoCircleLayer(t);
  const cx = vp.w / 2;
  const cy = vp.h / 2;
  const x = cx + ((d.x - cx) * scale) * push;
  const y = cy + ((d.y - cy) * scale - lift * vp.h) * push;
  const size = d.w * scale * push;
  return { x, y, w: size, h: size, r: size / 2 };
}

/** The shape at journey position `m`: geometry plus the strengths of its looks (green fill, purple stroke, ring / frame extras). */
function shapeAt(m: number, vp: Viewport) {
  const S = stations(vp);
  if (m <= 0) {
    // Prelude: the copy circle exactly where the showcase has it, so the two are one while the scene dissolves.
    const q = clamp01(m + 1);
    const t = OSMO_HANDOFF_START + q * (SHOWCASE_HOLD - OSMO_HANDOFF_START);
    return { geo: osmoCircleAt(t, vp), fill: 1, stroke: 0, ring: 0, frame: 0, visible: q > 0 };
  }
  const k = Math.floor(m);
  const f = m - k;
  if (k >= 5) return { geo: S[5], fill: 0, stroke: 0, ring: 0, frame: 0, visible: false };
  const a = S[k];
  const b = S[k + 1];
  switch (k) {
    case 0:
      // The green circle → the ring: it slides to the middle and settles at the ring's size while the green drains
      // to the page ground and the purple outline comes up - a plain hand-over, nothing covers the screen.
      return {
        geo: lerpGeo(osmoCircleAt(SHOWCASE_HOLD, vp), b, easeInOut(across(f, 0, 0.8))),
        fill: 1 - across(f, 0.1, 0.55),
        stroke: 0.4 * across(f, 0.2, 0.7),
        ring: across(f, 0.5, 0.9),
        frame: 0,
        visible: true,
      };
    case 1:
      // Ring → the two lines: it stretches into a rectangle past the viewport's top and bottom; the last stretch hands
      // its sides to the lines' own gradient + particles (same place), so the stroke fades as they come up.
      return {
        geo: lerpGeo(a, b, easeInOut(f)),
        fill: 0,
        stroke: 0.4 * (1 - across(f, 0.6, 1)),
        ring: 1 - across(f, 0, 0.4),
        frame: 0,
        visible: true,
      };
    case 2:
      // Lines → the frame: takes its sides back from the lines first, then shrinks into the frame and tints.
      return {
        geo: lerpGeo(a, b, easeInOut(across(f, 0.2, 1))),
        fill: 0,
        stroke: lerp(0.4, 0.28, across(f, 0.2, 1)) * across(f, 0, 0.4),
        ring: 0,
        frame: across(f, 0.6, 1),
        visible: true,
      };
    case 3:
      // Frame → the outer signal ring.
      return {
        geo: lerpGeo(a, b, easeInOut(f)),
        fill: 0,
        stroke: lerp(0.28, 0.44, easeInOut(f)),
        ring: 0,
        frame: 1 - across(f, 0, 0.4),
        visible: true,
      };
    default:
      // Ring → gone.
      return {
        geo: lerpGeo(a, b, easeIn(f)),
        fill: 0,
        stroke: 0.44 * (1 - across(f, 0.5, 1)),
        ring: 0,
        frame: 0,
        visible: true,
      };
  }
}

/** The one continuous shape - see the file comment. */
export const journeyMorph: JourneyMorph = (position) => <Morph position={position} />;
function Morph({ position }: { position: MotionValue<number> }) {
  // Viewport box for the station maths; a resize re-runs the transform through `tick`.
  const viewport = useRef<Viewport>({ w: 0, h: 0 });
  const tick = useMotionValue(0);
  useEffect(() => {
    const measure = () => {
      viewport.current = { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight };
      tick.set(tick.get() + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [tick]);
  const shape = useTransform([position, tick], ([m]: number[]) => shapeAt(m, viewport.current));
  const left = useTransform(shape, (s) => s.geo.x - s.geo.w / 2);
  const top = useTransform(shape, (s) => s.geo.y - s.geo.h / 2);
  const width = useTransform(shape, (s) => s.geo.w);
  const height = useTransform(shape, (s) => s.geo.h);
  const borderRadius = useTransform(shape, (s) => s.geo.r);
  const opacity = useTransform(shape, (s) => (s.visible && viewport.current.w > 0 ? 1 : 0));
  // The looks: the stroke and the frame tint are colour-mixes of the brand tokens on the box itself (flat, cheap to
  // repaint); the OSMO radial + green shadow and the ring's radial + purple glow are full-strength children faded
  // with `opacity` - each its own compositor layer, so the shape moving across the screen never re-rasters those
  // big blurred shadows, only a change of size does.
  const usePercent = (get: (s: ReturnType<typeof shapeAt>) => number, max: number) =>
    useTransform(shape, (s) => (get(s) * max).toFixed(2));
  const strokePct = usePercent((s) => s.stroke, 100);
  const framePct = usePercent((s) => s.frame, 5);
  const fill = useTransform(shape, (s) => s.fill);
  const ring = useTransform(shape, (s) => s.ring);
  const borderColor = useMotionTemplate`color-mix(in srgb, var(--primary-gradient-end) ${strokePct}%, transparent)`;
  const backgroundColor = useMotionTemplate`color-mix(in srgb, var(--primary-gradient-end) ${framePct}%, transparent)`;
  return (
    <motion.div
      className="absolute border will-change-transform"
      style={{ left, top, width, height, borderRadius, opacity, borderColor, backgroundColor }}
    >
      {/* OSMO's copy circle look (the prelude). */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] shadow-[0_50px_120px_rgba(22,111,54,0.38)] will-change-[opacity]"
        style={{
          opacity: fill,
          backgroundImage: `radial-gradient(120% 120% at 28% 22%, ${OSMO_LOOK.light} 0%, ${OSMO_LOOK.green} 46%, ${OSMO_LOOK.deep} 100%)`,
        }}
      />
      {/* The ring behind the stats: soft radial + glow, and the dashed inner line. */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] shadow-[0_0_90px_10px_color-mix(in_srgb,var(--primary-gradient-end)_12%,transparent)] will-change-[opacity]"
        style={{
          opacity: ring,
          backgroundImage:
            "radial-gradient(closest-side, color-mix(in srgb, var(--primary-gradient-start) 7%, transparent) 0%, transparent 58%, color-mix(in srgb, var(--primary-gradient-end) 12%, transparent) 100%)",
        }}
      >
        <div className="absolute inset-[8%] rounded-[inherit] border border-dashed border-[color:color-mix(in_srgb,var(--primary-gradient-start)_30%,transparent)]" />
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- per scene */

/** Deterministic pseudo-random for the particle scatter (stable between renders and server/client). */
function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** A glowing dot that drifts slowly about its spot (all numbers rounded so the server string matches the browser's). */
function Particle({ seed, x, y, size, alpha }: { seed: number; x: string; y: string; size: number; alpha: number }) {
  return (
    <span
      className="animate-journey-drift absolute rounded-full bg-primary-gradient shadow-[0_0_12px_3px_var(--primary-soft-glow)]"
      style={
        {
          left: x,
          top: y,
          width: `${size.toFixed(1)}px`,
          height: `${size.toFixed(1)}px`,
          opacity: alpha.toFixed(2),
          "--dx": `${(-12 + noise(seed + 5) * 24).toFixed(1)}px`,
          "--dy": `${(-8 - noise(seed + 6) * 22).toFixed(1)}px`,
          "--drift-duration": `${(5 + noise(seed + 3) * 7).toFixed(1)}s`,
          animationDelay: `${(-noise(seed + 4) * 12).toFixed(1)}s`,
        } as CSSProperties
      }
    />
  );
}

/**
 * Two vertical lines (reviews), top to bottom of the viewport, near the edges
 * - the card conveyor fills the middle - with small glowing particles floating
 * around them and a sparser field of them across the background. The lines
 * take the morph's rectangle sides over at the end of the arrival and hand
 * them back at the start of the departure (the same x), so nothing jumps.
 */
export const linesBackdrop: JourneyBackdrop = (props) => <Lines {...props} />;
function Lines({ arrive, depart }: JourneyBackdropProps) {
  const opacity = useTransform([arrive, depart], ([a, d]: number[]) => across(a, 0.6, 1) * (1 - across(d, 0, 0.4)));
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      {/* The background field: sparse, small, dim. */}
      {Array.from({ length: 26 }, (_, i) => {
        const seed = 100 + i;
        return (
          <Particle
            key={i}
            seed={seed}
            x={`${(6 + noise(seed) * 88).toFixed(1)}%`}
            y={`${(4 + noise(seed + 1) * 92).toFixed(1)}%`}
            size={2 + noise(seed + 2) * 4}
            alpha={0.2 + noise(seed + 7) * 0.35}
          />
        );
      })}
      {[0, 1].map((side) => (
        <div
          key={side}
          // No mask on the wrapper: a mask clips to the element's 1px box and would eat the particles around it.
          className={cn("absolute inset-y-0 w-px", side ? "left-[97%] md:left-[92%]" : "left-[3%] md:left-[8%]")}
        >
          <div className="h-full w-full bg-[color:color-mix(in_srgb,var(--primary-gradient-end)_55%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]" />
          {/* Particles floating around the line. */}
          {Array.from({ length: 22 }, (_, i) => {
            const seed = side * 40 + i;
            return (
              <Particle
                key={i}
                seed={seed}
                x={`${(-44 + noise(seed) * 88).toFixed(1)}px`}
                y={`${(3 + noise(seed + 1) * 94).toFixed(1)}%`}
                size={3 + noise(seed + 2) * 6}
                alpha={0.45 + noise(seed + 7) * 0.5}
              />
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}

/**
 * Signal waves (contact): the inner arcs pulsing out of a glowing dot behind
 * the details column - the outer ring is the morph shape, which arrives there
 * first; these fade in inside it and go before it shrinks away.
 */
export const wavesBackdrop: JourneyBackdrop = (props) => <Waves {...props} />;
function Waves({ arrive, depart }: JourneyBackdropProps) {
  const opacity = useTransform([arrive, depart], ([a, d]: number[]) => easeOut(across(a, 0.55, 1)) * (1 - across(d, 0, 0.4)));
  const scale = useTransform(arrive, (a) => 0.85 + 0.15 * easeOut(across(a, 0.55, 1)));
  return (
    <motion.div
      className="absolute left-1/2 top-[64%] size-[min(120vw,60vh)] -translate-x-1/2 -translate-y-1/2 lg:left-[82%] lg:top-[56%] lg:size-[min(46vw,80vh)]"
      style={{ scale, opacity }}
    >
      {[0.3, 0.55, 0.8].map((r, i) => (
        <div
          key={r}
          className={cn(
            "animate-showcase-breathe absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border",
            i % 2 ? "border-dashed" : ""
          )}
          style={{
            width: `${r * 100}%`,
            borderColor: `color-mix(in srgb, var(--primary-gradient-end) ${44 - i * 9}%, transparent)`,
            animationDelay: `${i * 1.4}s`,
          }}
        />
      ))}
      <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-gradient shadow-[0_0_24px_8px_var(--primary-soft-glow)]" />
    </motion.div>
  );
}

/**
 * Small "atoms" drifting in the background: a nucleus with a thin orbit. Two
 * looks - `ring` (trainings: a round orbit, a touch bigger) and `orbit`
 * (FAQ: a tilted elliptical orbit, smaller) - fading in once the scene is
 * most of the way in and out as soon as the next one starts.
 */
function Atoms({ arrive, depart, look, count, seedBase }: JourneyBackdropProps & { look: "ring" | "orbit"; count: number; seedBase: number }) {
  const opacity = useTransform([arrive, depart], ([a, d]: number[]) => across(a, 0.5, 1) * (1 - across(d, 0, 0.5)));
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const seed = seedBase + i;
        const size = look === "ring" ? 12 + noise(seed + 2) * 12 : 9 + noise(seed + 2) * 8;
        const dot = look === "ring" ? 3 + noise(seed + 8) * 2.5 : 2.5 + noise(seed + 8) * 1.5;
        return (
          <span
            key={i}
            className="animate-journey-drift absolute"
            style={
              {
                left: `${(4 + noise(seed) * 92).toFixed(1)}%`,
                top: `${(6 + noise(seed + 1) * 88).toFixed(1)}%`,
                width: `${size.toFixed(1)}px`,
                height: `${size.toFixed(1)}px`,
                opacity: (0.5 + noise(seed + 7) * 0.45).toFixed(2),
                "--dx": `${(-14 + noise(seed + 5) * 28).toFixed(1)}px`,
                "--dy": `${(-8 - noise(seed + 6) * 24).toFixed(1)}px`,
                "--drift-duration": `${(6 + noise(seed + 3) * 8).toFixed(1)}s`,
                animationDelay: `${(-noise(seed + 4) * 12).toFixed(1)}s`,
              } as CSSProperties
            }
          >
            {/* The orbit: a hairline circle, or a tilted ellipse. */}
            <span
              className={cn(
                "absolute inset-0 border border-[color:color-mix(in_srgb,var(--primary-gradient-end)_75%,transparent)]",
                look === "ring" ? "rounded-full" : "rounded-[50%] scale-y-[0.42]"
              )}
              style={look === "orbit" ? { rotate: `${(-40 + noise(seed + 9) * 80).toFixed(0)}deg` } : undefined}
            />
            {/* The nucleus. */}
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-gradient shadow-[0_0_10px_3px_var(--primary-soft-glow)]"
              style={{ width: `${dot.toFixed(1)}px`, height: `${dot.toFixed(1)}px` }}
            />
          </span>
        );
      })}
    </motion.div>
  );
}
/** Trainings: round-orbit atoms behind the cards (the frame itself is the morph). */
export const atomsBackdrop: JourneyBackdrop = (props) => <Atoms {...props} look="ring" count={22} seedBase={300} />;

/** Soft brand blob (wizard, FAQ): a quiet tint where the layout leaves room. */
function Blob({ presence, position }: { presence: MotionValue<number>; position: "left" | "right" }) {
  const opacity = useTransform(presence, (p) => 0.7 * easeOut(p));
  const scale = useTransform(presence, (p) => 0.8 + 0.2 * easeOut(p));
  return (
    <motion.div
      className={cn(
        // A gradient that already fades out - no blur filter (the GPU would re-blur it every frame it scales).
        "absolute top-[36%] aspect-square w-[min(60vw,70vh)] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-[transform,opacity]",
        position === "left" ? "left-[8%]" : "left-[88%]"
      )}
      style={{
        opacity,
        scale,
        background:
          "radial-gradient(closest-side, color-mix(in srgb, var(--primary-gradient-start) 20%, transparent) 0%, color-mix(in srgb, var(--primary-gradient-end) 13%, transparent) 50%, color-mix(in srgb, var(--primary-gradient-end) 4%, transparent) 82%, transparent 100%)",
      }}
    />
  );
}
// Pre-built (the home page is a server component - it can hand these client references over, but not call them).
export const blobLeftBackdrop: JourneyBackdrop = ({ presence }) => <Blob presence={presence} position="left" />;

/**
 * Services (the wizard's first step): the left blob, a soft dotted field
 * behind the cards (a radial mask keeps it to the middle) and glowing
 * particles drifting across it.
 */
export const servicesBackdrop: JourneyBackdrop = (props) => <ServicesField {...props} />;
function ServicesField({ presence }: JourneyBackdropProps) {
  const opacity = useTransform(presence, (p) => easeOut(p));
  return (
    <>
      <Blob presence={presence} position="left" />
      <motion.div className="absolute inset-0" style={{ opacity }}>
        <div
          className="absolute inset-0 [background-image:radial-gradient(color-mix(in_srgb,var(--primary-gradient-end)_60%,transparent)_1px,transparent_1.6px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_62%_58%_at_50%_50%,black_18%,transparent_72%)]"
          style={{ opacity: 0.55 }}
        />
        {Array.from({ length: 28 }, (_, i) => {
          const seed = 500 + i;
          return (
            <Particle
              key={i}
              seed={seed}
              x={`${(4 + noise(seed) * 92).toFixed(1)}%`}
              y={`${(6 + noise(seed + 1) * 88).toFixed(1)}%`}
              size={2.5 + noise(seed + 2) * 5}
              alpha={0.3 + noise(seed + 7) * 0.5}
            />
          );
        })}
      </motion.div>
    </>
  );
}
/** FAQ: the right-hand blob plus smaller, tilted-orbit atoms. */
export const blobRightBackdrop: JourneyBackdrop = (props) => (
  <>
    <Blob presence={props.presence} position="right" />
    <Atoms {...props} look="orbit" count={18} seedBase={400} />
  </>
);
