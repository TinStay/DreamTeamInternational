"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { PHONE_QUERY, useHydrated, useMediaQuery } from "@/lib/use-media-query";
import { useFlowProgress, useScrollEased } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";

/** Ease-out cubic: fast at first, settling softly - the section glides into place rather than stopping. */
const settle = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A home-page section that **rises into place with the scroll**: as its top travels from the bottom of the screen to a
 * little under the middle (`until`, a fraction of the viewport), it comes up from `rise` px below, grows from `from` to
 * full size and fades in - tied to the scroll position, so it moves at the reader's pace, reverses when they scroll
 * back, and is exactly in place (no transform at all) once revealed. With `leave`, it also eases back and dims a touch
 * as it scrolls off the top, so one section hands over to the next.
 *
 * Built on the site's scroll rules (see `lib/smooth-scroll.ts`): one shared window scroll value and a position measured
 * on layout changes only (`useFlowProgress` - no DOM read per frame), one easing (`useScrollEased` - raw under Lenis'
 * glide, a soft spring under native scrolling), transforms and opacity only on a `will-change` layer, so nothing
 * repaints. Phones and reduced motion get the section as it is (phones run no scroll-linked work - the plain-flow rule),
 * and so do the server and the hydrating render - nothing is hidden before the script runs.
 */
export function ScrollReveal({
  children,
  className,
  rise = 90,
  from = 0.94,
  until = 0.5,
  leave = false,
}: {
  children: ReactNode;
  className?: string;
  /** How far below (px) the section starts. */
  rise?: number;
  /** The scale it grows from. */
  from?: number;
  /** Where the reveal ends: the section's top at this fraction of the viewport height. */
  until?: number;
  /** Also ease back and dim a little while scrolling off the top. */
  leave?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const phone = useMediaQuery(PHONE_QUERY);
  const hydrated = useHydrated();
  const on = hydrated && !reduce && !phone;

  const enterRaw = useFlowProgress(ref, (top, _h, vh) => [top - vh, top - vh * until], [until], on);
  const leaveRaw = useFlowProgress(ref, (top, h, vh) => [top + h - vh * 0.9, top + h - vh * 0.1], [], on && leave);
  const spring = { stiffness: 140, damping: 28, mass: 0.6 };
  const enter = useScrollEased(enterRaw, useSpring(enterRaw, spring));
  const exit = useScrollEased(leaveRaw, useSpring(leaveRaw, spring));

  const y = useTransform([enter, exit], ([a, b]: number[]) => (1 - settle(a)) * rise - b * 40);
  const scale = useTransform([enter, exit], ([a, b]: number[]) => from + (1 - from) * settle(a) - b * 0.03);
  const opacity = useTransform([enter, exit], ([a, b]: number[]) => Math.min(1, settle(a) * 1.4) * (1 - b * 0.35));

  return (
    <div ref={ref} className={className}>
      {/* The same element in every mode - switching after hydration never remounts the section (its films keep playing). */}
      <motion.div style={on ? { y, scale, opacity } : undefined} className={cn(on && "origin-[50%_0%] will-change-transform")}>
        {children}
      </motion.div>
    </div>
  );
}

/* ── Staggered scroll reveals ─────────────────────────────────────
 * A section's items arriving one after another, tied to the scroll like `ScrollReveal`: `ScrollStagger` measures how
 * far the section has come in (one progress, 0 → 1), and each `ScrollItem` plays its own slice of it - item `index` of
 * `count` starts a little after the one before - in its `variant`'s movement. Same rules: one shared scroll value, one
 * easing, transforms and opacity only; phones, reduced motion, the server and the hydrating render get the items as
 * they are. An item that is fully in carries no transform at all.
 * ─────────────────────────────────────────────────────────────── */

type StaggerState = { progress: MotionValue<number>; on: boolean };
const StaggerContext = createContext<StaggerState | null>(null);

/** The section around the items: its top coming from `start` × the viewport (1 = the bottom edge) up to `until`. */
export function ScrollStagger({
  children,
  className,
  start = 1,
  until = 0.35,
}: {
  children: ReactNode;
  className?: string;
  start?: number;
  until?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const phone = useMediaQuery(PHONE_QUERY);
  const hydrated = useHydrated();
  const on = hydrated && !reduce && !phone;
  const raw = useFlowProgress(ref, (top, _h, vh) => [top - vh * start, top - vh * until], [start, until], on);
  const progress = useScrollEased(raw, useSpring(raw, { stiffness: 110, damping: 26, mass: 0.7 }));
  const value = useMemo(() => ({ progress, on }), [progress, on]);
  return (
    <StaggerContext.Provider value={value}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </StaggerContext.Provider>
  );
}

export type ScrollItemVariant = "rise" | "flip" | "fromLeft" | "fromRight" | "widen";

/**
 * One item of a `ScrollStagger`. Variants: `rise` (up from below, growing a touch), `flip` (tipping up out of the floor in
 * 3D, like a card standing up), `fromLeft` / `fromRight` (sliding in from that side), `widen` (opening out sideways from
 * its middle). `as` picks the element (an `li` in a list).
 */
export function ScrollItem({
  index = 0,
  count = 1,
  variant = "rise",
  as = "div",
  className,
  children,
  tabIndex,
}: {
  index?: number;
  count?: number;
  variant?: ScrollItemVariant;
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
  tabIndex?: number;
}) {
  const ctx = useContext(StaggerContext);
  const fallback = useMotionValue(1);
  const progress = ctx?.progress ?? fallback;
  const on = Boolean(ctx?.on);
  // Each item's slice: they start `gap` apart and each lasts what is left.
  const gap = count > 1 ? Math.min(0.12, 0.55 / (count - 1)) : 0;
  const span = 1 - gap * (count - 1);
  const t = useTransform(progress, (p) => settle(Math.min(1, Math.max(0, (p - index * gap) / span))));

  const y = useTransform(t, (v) => (variant === "rise" ? (1 - v) * 70 : variant === "flip" ? (1 - v) * 90 : 0));
  const x = useTransform(t, (v) => (variant === "fromLeft" ? (v - 1) * 140 : variant === "fromRight" ? (1 - v) * 140 : 0));
  const rotateX = useTransform(t, (v) => (variant === "flip" ? (1 - v) * 62 : 0));
  const scale = useTransform(t, (v) => (variant === "rise" ? 0.95 + 0.05 * v : variant === "flip" ? 0.9 + 0.1 * v : 1));
  const scaleX = useTransform(t, (v) => (variant === "widen" ? 0.82 + 0.18 * v : 1));
  const opacity = useTransform(t, (v) => (variant === "widen" ? 0.35 + 0.65 * v : Math.min(1, v * 1.5)));

  const style = on ? { y, x, rotateX, scale, scaleX, opacity, transformPerspective: variant === "flip" ? 1100 : undefined } : undefined;
  const classes = cn(on && "will-change-transform", variant === "flip" && on && "origin-[50%_100%]", className);
  if (as === "li") {
    return (
      <motion.li tabIndex={tabIndex} className={classes} style={style}>
        {children}
      </motion.li>
    );
  }
  return (
    <motion.div tabIndex={tabIndex} className={classes} style={style}>
      {children}
    </motion.div>
  );
}
