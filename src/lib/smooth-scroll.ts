import { useEffect } from "react";
import { useMotionValue, useTransform, type MotionValue } from "motion/react";
import type Lenis from "lenis";

/*
 * Programmatic scrolling that goes through the site's smooth scroller when it
 * is running (`SmoothScroll` mounts Lenis on `window.__lenis`) and falls back
 * to the browser otherwise (reduced motion, tests). Lenis ignores
 * `scroll-margin`, so callers pass the header clearance as `offset`.
 * `useScrollEased` is for scroll-linked motion: one easing only.
 */

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/** Header lane to keep clear of when scrolling an element to the top (the floating pill ends ~84px down). */
export const SCROLL_HEADER_OFFSET = -96;

/**
 * True while the root snaps to the home page's scene stops (mobile, see `SnapStop` / globals.css). Programmatic
 * scrolls go native then: the browser re-snaps after them anyway, and it would re-snap every frame of a scroll Lenis
 * animated itself.
 */
export function sectionSnapActive() {
  if (typeof window === "undefined") return false;
  const type = getComputedStyle(document.documentElement).scrollSnapType;
  return type !== "" && type !== "none";
}

export function scrollToElement(target: Element | null | undefined, options: { offset?: number; block?: "start" | "center" } = {}) {
  if (!target) return;
  const offset =
    options.block === "center" ? -(window.innerHeight - target.getBoundingClientRect().height) / 2 : (options.offset ?? SCROLL_HEADER_OFFSET);
  if (sectionSnapActive()) {
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
    return;
  }
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target as HTMLElement, { offset });
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: options.block ?? "start" });
}

export function scrollToY(top: number) {
  const lenis = window.__lenis;
  if (lenis && !sectionSnapActive()) lenis.scrollTo(top);
  else window.scrollTo({ top, behavior: "smooth" });
}

/**
 * 1 while the smooth scroller is the one moving the page - Lenis mounted, a fine pointer (wheel input, which it
 * glides) and no reduced-motion preference - else 0 (touch scrolls natively; Lenis leaves it alone).
 */
function useSmoothScrollDriven(): MotionValue<number> {
  const driven = useMotionValue(0);
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => driven.set(window.__lenis && fine.matches && !reduce.matches ? 1 : 0);
    update();
    // Lenis mounts in the root layout's own effect - settle once more after it.
    const raf = requestAnimationFrame(update);
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(raf);
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, [driven]);
  return driven;
}

/**
 * Scroll-linked motion with exactly one easing: the raw `source` while the smooth scroller glides the page (it is
 * already eased - a spring on top would only trail it), the `spring` (a `useSpring` of the source, the caller's)
 * while the page scrolls natively, so wheel steps and touch still read as motion.
 */
export function useScrollEased(source: MotionValue<number>, spring: MotionValue<number>): MotionValue<number> {
  const driven = useSmoothScrollDriven();
  return useTransform([source, spring, driven], ([raw, eased, on]: number[]) => (on ? raw : eased));
}
