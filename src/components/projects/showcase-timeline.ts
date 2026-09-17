/*
 * The projects showcase's timeline numbers, shared with whoever has to line up
 * with it (the home journey's backdrop takes the OSMO disc over at the end).
 * Plain module - no "use client" - so the server-rendered home page can read
 * the hand-off length too.
 */

import { SHOWCASE_PROJECT_KEYS } from "@/lib/projects";

/**
 * Timeline units: the intro, one span per project, and the last project's hold. A scene sits framed for
 * `HOLD` of its span (about half a viewport of scroll - a long, calm stay) and hands over in the rest (a fifth of a
 * viewport - quick).
 */
export const SHOWCASE_INTRO = 0.55;
export const SHOWCASE_SPAN = 0.9;
export const SHOWCASE_HOLD = 0.72;
/**
 * On phones (coarse pointer, below lg) a scene starts handing over this early instead, so the hand-over spans most
 * of the swipe between two snap stops and the next scene moves with the finger, reels-style; the last scene's
 * outro still runs on `SHOWCASE_HOLD`.
 */
export const SHOWCASE_HOLD_MOBILE = 0.3;
export const SHOWCASE_UNITS = SHOWCASE_INTRO + (SHOWCASE_PROJECT_KEYS.length - 1) * SHOWCASE_SPAN + SHOWCASE_HOLD * SHOWCASE_SPAN;
/**
 * Scroll (viewports) per timeline unit: the section is UNITS × 100svh tall with a 100svh sticky stage, so its scroll
 * length is (UNITS - 1) viewports for UNITS units.
 */
export const SHOWCASE_UNIT_VH = (SHOWCASE_UNITS - 1) / SHOWCASE_UNITS;

/**
 * Scene-local time at which a scene has fully framed: the hand-over is done at 0 and the copy's staggered reveal
 * (`Reveal`, the CTA last) by 0.24 - where the rail jumps to and where phones snap to (`SnapStop`).
 */
export const SCENE_FRAMED = 0.27;
/** Scene-local time at which the OSMO copy starts fading - 0.2 before the hold ends (well past `SCENE_FRAMED`). */
export const OSMO_OUTRO_START = SHOWCASE_HOLD - 0.2;
/** How long the copy takes to fade; the disc only appears once it is gone (`OSMO_HANDOFF_START`). */
export const OSMO_COPY_FADE = 0.08;
/**
 * The OSMO copy circle on desktop (`lg`): its nominal centre + diameter as stage fractions (the morph target; the
 * real centre depends on the frame beside it - `osmoCircleDesktop`); below `lg` see `osmoCircleMobile`.
 */
export const OSMO_CIRCLE = { x: 0.65, y: 0.56, d: 0.46 };
/**
 * Desktop: the 4:5 frame and the circle stand as one group centred on the screen - the frame (its height
 * `min(62vh, 45vw)`) on the left, a 2vw gap, then the circle (`min(46vw, 88vh)` wide); a gap, not an overlap,
 * because the journey's canvas draws the circle *over* the stage at the hand-off and would cover a frame under
 * it. Px for a viewport; `showcase-scenes.tsx` spells the same numbers as CSS variables on the scene
 * (`--osmo-frame-h`, `--osmo-d`, `--osmo-left`, `--osmo-cx`), so keep the two in step.
 */
export function osmoCircleDesktop(vw: number, vh: number) {
  const d = Math.min(0.46 * vw, 0.88 * vh);
  const frameW = 0.8 * Math.min(0.62 * vh, 0.45 * vw);
  const gap = 0.02 * vw;
  const frameLeft = (vw - frameW - d - gap) / 2;
  return { x: frameLeft + frameW + gap + d / 2, y: OSMO_CIRCLE.y * vh, d, frameLeft };
}
/**
 * Below `lg` the disc is centred, its top edge just under the floating header (5.75rem, or 10vh on tall phones) and
 * no wider than 88vw / 52vh - px for a viewport; `showcase-scenes.tsx` spells the same numbers as CSS
 * (`top-[calc(max(5.75rem,10vh)+min(44vw,26vh))]`, `w-[min(88vw,52vh)]`), so keep the two in step.
 */
export function osmoCircleMobile(vw: number, vh: number) {
  const d = Math.min(0.88 * vw, 0.52 * vh);
  return { x: 0.5 * vw, y: Math.max(5.75 * 16, 0.1 * vh) + d / 2, d };
}
export const OSMO_GREEN = "#1E9E4A";

/**
 * Scene-local time from which the journey's canvas draws the copy circle itself (same spot, same size, on top), so
 * the showcase can dissolve underneath and the circle keeps going into the stats' ring - 0.12 before the hold
 * ends, once the copy has faded (`OSMO_OUTRO_START` + `OSMO_COPY_FADE`). The showcase's own fade starts 0.08
 * before the hold ends.
 */
export const OSMO_HANDOFF_START = SHOWCASE_HOLD - 0.12;
/** The circle's layer while it is handed over: the hold push-in (about the stage centre) and its own parallax. */
export function osmoCircleLayer(t: number) {
  return {
    push: 1 + 0.04 * Math.min(t / SHOWCASE_HOLD, 1),
    scale: 1 + 0.04 * Math.abs(t),
    /** Viewports the layer has drifted up by. */
    lift: 0.07 * t,
  };
}
/** Scroll (viewports) between the hand-off start and the stage letting go (the last scene ends at `SHOWCASE_HOLD`). */
export const OSMO_HANDOFF_VH = (SHOWCASE_HOLD - OSMO_HANDOFF_START) * SHOWCASE_SPAN * SHOWCASE_UNIT_VH;

