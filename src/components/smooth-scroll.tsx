"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { scrollToElement } from "@/lib/smooth-scroll";

/*
 * Scrolling is the browser's own everywhere now (the client wanted the wheel to behave normally, not glide): Lenis is
 * no longer created, `window.__lenis` stays absent and every caller already falls back to native scrolling - the
 * scroll-driven choreography eases itself through `useScrollEased`'s spring. What this component still does: same-page
 * hash links land clear of the header, and a route change starts at the top. The note below is the history of the
 * Lenis version, kept for the day it comes back. Touch stays native - and on a touch device (`pointer: coarse`) Lenis
 * is not mounted at all: it would only add its rAF loop, a main-thread frame
 * every vsync, at rest too, in which every running animation on the page is
 * ticked - on a throttled phone profile the single biggest cost while nothing
 * moved (`journey-trace.js`). Without it `<html>` never gets `.lenis`, so the
 * CSS scroll-behavior fallback is restricted to fine pointers (globals.css)
 * and programmatic scrolls on phones say `behavior` themselves. Reduced
 * motion turns it off (Lenis honours the media query itself), nested
 * scrollers (dropdowns, sheets) keep their own wheel. Same-page hash links (`/bg#quote` from `/bg`, and plain `#…`) scroll
 * through it too, clear of the floating header; programmatic scrolls go
 * through `scrollToElement` / `scrollToY` in `lib/smooth-scroll.ts`. A route
 * change (a link to another page) lands at the top of the new page - both the
 * window and Lenis's own position are reset, so a case study opened from deep
 * in the home page never starts part-way down; back / forward keep the
 * browser's restored position.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const popped = useRef(false);
  const first = useRef(true);
  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    // The first run is the initial load (the browser owns that position - a reload restores it); back / forward
    // are the browser's too. A link to another page: to the top, and Lenis with it - mid-glide, it would carry its
    // old target over and scroll the new page down to it.
    if (first.current) {
      first.current = false;
      return;
    }
    if (popped.current) {
      popped.current = false;
      return;
    }
    if (location.hash) return;
    window.scrollTo(0, 0);
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  useEffect(() => {
    // Hash links to this very page: Lenis handles `#…` hrefs itself; ours mostly carry the locale path in front.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href, location.href);
      if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", url.hash);
      scrollToElement(target);
    };
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return null;
}
