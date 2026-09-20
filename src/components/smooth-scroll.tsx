"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { scrollToElement } from "@/lib/smooth-scroll";

/*
 * Site-wide smooth scrolling (Lenis, mounted once in the root layout): wheel
 * input glides instead of stepping, so the scroll-driven choreography reads as
 * motion. Touch stays native - and on a touch device (`pointer: coarse`) Lenis
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
    // lerp 0.07: a longer glide than the default 0.1 (about a quarter second to settle) - the scroll-driven choreography
    // reads as motion even on a single wheel tick, without the page feeling like ice.
    // wheelMultiplier 0.85: a wheel tick moves the page a little less, so the pages read at a calmer pace.
    // Fine pointers only (see the note above) - the hash-link interception below runs everywhere.
    const lenis = window.matchMedia("(pointer: coarse)").matches
      ? null
      : new Lenis({ lerp: 0.06, wheelMultiplier: 0.85, autoRaf: true, allowNestedScroll: true });
    if (lenis) window.__lenis = lenis;

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
      lenis?.destroy();
      if (lenis) delete window.__lenis;
    };
  }, []);
  return null;
}
