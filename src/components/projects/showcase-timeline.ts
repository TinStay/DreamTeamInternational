/*
 * The projects showcase's timeline numbers, shared with whoever has to line up
 * with it (the home journey's backdrop takes the OSMO disc over at the end).
 * Plain module - no "use client" - so the server-rendered home page can read
 * the hand-off length too.
 */

import { SHOWCASE_PROJECT_KEYS } from "@/lib/projects";

/** Timeline units: the intro, one span per project, and the last project's hold. */
export const SHOWCASE_INTRO = 0.55;
export const SHOWCASE_SPAN = 0.7;
export const SHOWCASE_HOLD = 0.5;
export const SHOWCASE_UNITS = SHOWCASE_INTRO + (SHOWCASE_PROJECT_KEYS.length - 1) * SHOWCASE_SPAN + SHOWCASE_HOLD * SHOWCASE_SPAN;
/**
 * Scroll (viewports) per timeline unit: the section is UNITS × 100svh tall with a 100svh sticky stage, so its scroll
 * length is (UNITS - 1) viewports for UNITS units.
 */
export const SHOWCASE_UNIT_VH = (SHOWCASE_UNITS - 1) / SHOWCASE_UNITS;

/** Scene-local time at which the OSMO copy starts fading (after its stagger + a beat of hold). */
export const OSMO_OUTRO_START = 0.26;
/** How long the copy takes to fade; the disc only appears once it is gone. */
export const OSMO_COPY_FADE = 0.08;
/** The OSMO copy circle: centre + diameter (stage fractions) on desktop (`lg`); phones centre it higher (see `OSMO_CIRCLE_MOBILE`). */
export const OSMO_CIRCLE = { x: 0.75, y: 0.56, d: 0.46 };
export const OSMO_CIRCLE_MOBILE = { x: 0.5, y: 0.32 };
export const OSMO_GREEN = "#1E9E4A";

/**
 * Scene-local time from which the journey's canvas draws the copy circle itself (same spot, same size, on top), so
 * the showcase can dissolve underneath and the circle keeps going into the stats' ring. The showcase's own fade
 * starts at 0.42.
 */
export const OSMO_HANDOFF_START = 0.38;
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

