"use client";

import { useEffect } from "react";

/*
 * The phone pager for the projects stage: one swipe is one scene, and the
 * change is an animation, not a scroll. On a coarse pointer below `lg` a
 * touch gesture inside the stage is taken over (the browser's own scrolling
 * for that gesture is cancelled on its first move - a scroll it has already
 * begun cannot be cancelled later), and once the finger has travelled
 * `THRESHOLD` px the page is tweened to the next stop in that direction
 * (`PAGE_MS`, ease in / out) - the stage is scroll-driven, so the whole
 * hand-over plays at the tween's pace, whatever the finger did. While the
 * tween runs every touch is swallowed, and a gesture pages at most once, so
 * the next scene has settled before the next swipe counts (TikTok-style).
 * Only inside the stage: from the first stop a backward swipe, and from the
 * last a forward one, are left to the browser, so the page scrolls on
 * naturally; a forward swipe from up to `LEAD` of a viewport above the first
 * stop already pages onto it. The root's CSS snapping (globals.css) stays
 * for what a gesture cannot cover - a fling that began outside the stage
 * ending inside it - and is switched off for the duration of a tween, or the
 * browser would re-snap every frame of it. Tablets only in practice: below
 * `md` the showcase stacks its worlds as plain sections and mounts no pager.
 */

/** How long a page takes. */
export const PAGE_MS = 1000;
/** Finger travel (px) that commits a swipe. */
const THRESHOLD = 16;
/** Viewports above the first stop from where a forward swipe already pages onto it. */
const LEAD = 0.15;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Gesture = { startY: number; startX: number; captured: boolean | null; consumed: boolean };

/**
 * `stops` returns the stage's stop positions (scroll px, ascending: the intro,
 * then each scene framed), measured when a gesture starts.
 */
export function useScenePager(enabled: boolean, stops: () => number[]) {
  useEffect(() => {
    if (!enabled) return;
    let animating = false;
    let raf = 0;
    let gesture: Gesture | null = null;
    const html = document.documentElement;

    const animateTo = (target: number) => {
      const from = window.scrollY;
      if (Math.abs(target - from) < 1) return;
      // The browser must not re-snap on every frame of the tween; the tween ends exactly on a stop anyway.
      html.style.scrollSnapType = "none";
      animating = true;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / PAGE_MS);
        // An instant step: the root's CSS `scroll-behavior` must never turn a frame of the tween into an animation.
        window.scrollTo({ top: from + (target - from) * easeInOutCubic(p), behavior: "instant" });
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          animating = false;
          html.style.scrollSnapType = "";
        }
      };
      raf = requestAnimationFrame(step);
    };

    const onStart = (e: TouchEvent) => {
      gesture = e.touches.length === 1 ? { startY: e.touches[0].clientY, startX: e.touches[0].clientX, captured: null, consumed: false } : null;
    };
    const onMove = (e: TouchEvent) => {
      if (!gesture || e.touches.length !== 1) return;
      if (animating) {
        // Locked until the scene has settled: the page must not move, and this gesture will not page either - nor
        // scroll natively once the tween has landed (a gesture begun during the lock is swallowed to its end; left
        // undecided, its next move after the landing was handed to the browser, which flung the page on).
        if (e.cancelable) e.preventDefault();
        gesture.captured = true;
        gesture.consumed = true;
        return;
      }
      const dy = gesture.startY - e.touches[0].clientY; // > 0: the finger moves up, the page forward
      const dx = gesture.startX - e.touches[0].clientX;
      if (gesture.captured === null) {
        // The first move decides for the whole gesture.
        const y = window.scrollY;
        const list = stops();
        const first = list[0];
        const forward = dy >= 0;
        const inside = list.length > 0 && y >= first - LEAD * window.innerHeight - 1 && y <= list[list.length - 1] + 1;
        const has = forward ? list.some((s) => s > y + 1) : list.some((s) => s < y - 1);
        gesture.captured = inside && has && Math.abs(dy) >= Math.abs(dx);
      }
      if (!gesture.captured) return;
      if (e.cancelable) e.preventDefault();
      if (gesture.consumed || Math.abs(dy) < THRESHOLD) return;
      gesture.consumed = true;
      const y = window.scrollY;
      const list = stops();
      const target = dy > 0 ? list.find((s) => s > y + 1) : [...list].reverse().find((s) => s < y - 1);
      if (target !== undefined) animateTo(target);
    };
    const onEnd = () => {
      gesture = null;
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
      cancelAnimationFrame(raf);
      html.style.scrollSnapType = "";
    };
  }, [enabled, stops]);
}
