import { useEffect, useRef, type RefObject } from "react";
import { useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import type Lenis from "lenis";

/*
 * Programmatic scrolling that goes through the site's smooth scroller when it
 * is running (`SmoothScroll` mounts Lenis on `window.__lenis`) and falls back
 * to the browser otherwise (reduced motion, tests). Lenis ignores
 * `scroll-margin`, so callers pass the header clearance as `offset`.
 * `useScrollEased` is for scroll-linked motion: one easing only.
 * `useFlowProgress` is scroll progress of an in-flow element without a DOM
 * read per frame.
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
  // A target inside a home-journey scene: the scene's box is sticky, so its own rect is wherever it is pinned right
  // now (from below the section that is a few px away - the scroll stopped short). The scene is fully in when its
  // box top is at the viewport top, i.e. at its flow marker's position less the overlap the box is pulled up by.
  const scene = target.closest<HTMLElement>("[data-journey-scene]");
  const marker = scene?.previousElementSibling;
  if (scene && marker instanceof HTMLElement) {
    const overlap = parseFloat(scene.dataset.journeyOverlap ?? "0") || 0;
    scrollToY(marker.getBoundingClientRect().top + window.scrollY - overlap * window.innerHeight);
    return;
  }
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
 * 1 while the page's own scrolling is already smooth - Lenis mounted and gliding a fine pointer's wheel (no
 * reduced-motion preference), or a coarse pointer (touch, which scrolls natively and continuously - a spring on
 * top of it only trails the finger and doubles the frames worked) - else 0 (a fine pointer scrolling natively:
 * wheel steps, which the caller's spring turns into motion).
 */
function useSmoothScrollDriven(): MotionValue<number> {
  const driven = useMotionValue(0);
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => driven.set(coarse.matches || (window.__lenis && fine.matches && !reduce.matches) ? 1 : 0);
    update();
    // Lenis mounts in the root layout's own effect - settle once more after it.
    const raf = requestAnimationFrame(update);
    fine.addEventListener("change", update);
    coarse.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(raf);
      fine.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, [driven]);
  return driven;
}

/**
 * The scroll progress (0 → 1) of an element in flow between two scroll positions, without a DOM read per frame.
 * motion's `useScroll({ target })` measures its target on every scroll event - a forced style + layout flush each
 * time, and the home page had two dozen of them, which on a phone was most of the frame. Here the element's
 * document position is measured once and again whenever the layout can have changed - a resize, or the body's
 * height changing (a ResizeObserver: a step of the wizard, an image landing, the journey's overlaps applying after
 * mount) - and the progress is derived from the shared window scroll value. `range(top, height, vh)` returns the
 * two scroll positions (px) the progress runs between; motion's `["start end", "start 0.7"]` reads
 * `[top - vh, top - 0.7 * vh]`, `["start start", "end end"]` `[top, top + height - vh]`. `deps` re-measure when the
 * range's inputs change. Only for elements in flow: a pinned box's own position moves with the pin - read its flow
 * markers instead.
 */
export function useFlowProgress(
  ref: RefObject<HTMLElement | null>,
  range: (top: number, height: number, vh: number) => [number, number],
  deps: readonly unknown[] = []
): MotionValue<number> {
  const { scrollY } = useScroll();
  const ends = useRef<[number, number]>([0, 0]);
  const tick = useMotionValue(0);
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  });
  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      ends.current = rangeRef.current(r.top + window.scrollY, r.height, window.innerHeight);
      tick.set(tick.get() + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` are the range's inputs, re-measured on change.
  }, [ref, tick, ...deps]);
  return useTransform([scrollY, tick], ([y]: number[]) => {
    const [a, b] = ends.current;
    if (a === b) return 0;
    return Math.min(1, Math.max(0, (y - a) / (b - a)));
  });
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
