"use client";

import { useCallback, useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { useScenePager } from "@/components/projects/scene-pager";
import { useMediaQuery } from "@/lib/use-media-query";

/*
 * A hand-over played as a page: the stretch of scroll between two positions
 * (the hero pinned at the top of the page → the quote wizard fully in) is
 * never rested in. From the near end a wheel tick down plays the whole
 * stretch as one animation (Lenis, locked - further ticks are swallowed until
 * it has landed), from the far end a wheel tick up plays it back; on a coarse
 * pointer the projects stage's pager does the same for a swipe, with the two
 * ends as its stops (`useScenePager`). Whatever else moves the page (a key, a
 * scrollbar drag, a glide that ran out inside it), the moment the scroll
 * settles inside the stretch it is finished in the direction it was going.
 * Off under reduced motion (the parts move with the plain scroll then).
 */

/** How long the page takes (seconds - Lenis's unit). */
const PAGE_S = 1.1;
/** Viewports past the far end from where a wheel tick up still plays the page back (a tick or two into the wizard). */
const BACK_LEAD = 0.12;
/** How long the scroll must be still inside the stretch before it is finished (ms). */
const SETTLE_MS = 160;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * `zone` returns the two ends (scroll px, ascending), measured when they are
 * needed, or `null` while the page is not laid out.
 */
export function usePagedHandover(enabled: boolean, zone: () => [number, number] | null) {
  const reduceMotion = useReducedMotion();
  const coarse = useMediaQuery("(pointer: coarse)");
  const on = enabled && !reduceMotion;
  // Touch: the stage's pager, the two ends as its stops.
  const stops = useCallback(() => zone() ?? [], [zone]);
  useScenePager(on && coarse, stops);

  useEffect(() => {
    if (!on) return;
    const lenis = window.__lenis;
    if (!lenis) return;
    const page = (target: number, duration = PAGE_S) => {
      lenis.scrollTo(target, { lock: true, duration, easing: easeInOutCubic, force: true });
    };

    // The wheel: from the near end or inside the stretch a tick down plays it forward, a tick up (from inside it,
    // or from just past its far end) plays it back. Lenis hands every wheel event over before it acts on it.
    const onVirtual = ({ deltaY, event }: { deltaX: number; deltaY: number; event: WheelEvent | TouchEvent }) => {
      if (!event.type.includes("wheel") || (event as WheelEvent).ctrlKey || lenis.isLocked) return;
      const ends = zone();
      if (!ends) return;
      const [start, end] = ends;
      const y = lenis.targetScroll;
      const target =
        deltaY > 0 && y >= start - 1 && y < end - 1
          ? end
          : deltaY < 0 && y > start + 1 && y <= end + BACK_LEAD * window.innerHeight
            ? start
            : null;
      if (target === null) return;
      if (event.cancelable) event.preventDefault();
      // Lenis's own flag for an event it must not process further.
      (event as WheelEvent & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
      page(target);
    };
    const off = lenis.on("virtual-scroll", onVirtual);

    // Anything else: once the scroll has settled inside the stretch, finish it the way it was going.
    let lastY = window.scrollY;
    let direction = 0;
    let timer = 0;
    const settle = () => {
      if (lenis.isLocked) return;
      const ends = zone();
      if (!ends) return;
      const [start, end] = ends;
      const y = window.scrollY;
      if (y <= start + 1 || y >= end - 1) return;
      page(direction < 0 ? start : direction > 0 ? end : y - start < end - y ? start : end, PAGE_S * 0.8);
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) direction = Math.sign(y - lastY);
      lastY = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      off();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [on, zone]);
}
