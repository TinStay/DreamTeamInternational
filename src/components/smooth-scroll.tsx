"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { scrollToElement } from "@/lib/smooth-scroll";

/*
 * Site-wide smooth scrolling (Lenis, mounted once in the root layout): wheel
 * input glides instead of stepping, so the scroll-driven choreography reads as
 * motion. Touch stays native, reduced motion turns it off (Lenis honours the
 * media query itself), nested scrollers (dropdowns, sheets) keep their own
 * wheel. Same-page hash links (`/bg#quote` from `/bg`, and plain `#…`) scroll
 * through it too, clear of the floating header; programmatic scrolls go
 * through `scrollToElement` / `scrollToY` in `lib/smooth-scroll.ts`.
 */
export function SmoothScroll() {
  useEffect(() => {
    // lerp 0.07: a longer glide than the default 0.1 (about a quarter second to settle) - the scroll-driven choreography
    // reads as motion even on a single wheel tick, without the page feeling like ice.
    const lenis = new Lenis({ lerp: 0.07, autoRaf: true, allowNestedScroll: true });
    window.__lenis = lenis;

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
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
  return null;
}
