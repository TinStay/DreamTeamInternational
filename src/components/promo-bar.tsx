"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";
import { openSignup } from "@/lib/signup-dialog";

/**
 * The English site's announcement bar, on every page above the header (after the ElevenLabs one the client pointed at):
 * the animated green "-20%" (a line of light sweeping through it, `.discount-badge`), the US launch line and a pill
 * that opens sign-up. It is fixed to the top of the screen and stays there while the page scrolls; an invisible
 * spacer of the same height keeps the page's content clear of it, and `--promo-h` (its height, set on `<html>`) is
 * what the fixed headers add to their `top` (0 where there is no bar). Not in the admin area (`/admin`), which has an
 * interface of its own.
 */
export function PromoBar() {
  const { t } = useLanguage();
  const p = t.promo;
  const ref = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const hidden = /^\/[a-z]{2}\/admin(\/|$)/.test(usePathname() ?? "");

  useEffect(() => {
    const bar = ref.current;
    const spacer = spacerRef.current;
    if (!bar || !spacer) return;
    const root = document.documentElement;
    const update = () => {
      const h = bar.offsetHeight;
      spacer.style.height = `${h}px`;
      root.style.setProperty("--promo-h", `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--promo-h");
    };
  }, [hidden]);

  if (hidden) return null;
  return (
    <>
    <div ref={spacerRef} aria-hidden className="h-11" />
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[60] flex min-h-11 items-center justify-center gap-x-3 gap-y-1 border-b border-[#22c55e]/25 bg-[linear-gradient(90deg,#08150d_0%,#0e1c14_50%,#08150d_100%)] px-3 py-1.5 text-white sm:gap-x-4"
    >
      <span className="discount-badge rounded-full border border-[#22c55e]/45 bg-[#22c55e]/10 px-2.5 py-0.5 text-sm leading-5 font-extrabold sm:text-base">
        <span className="discount-shine">{p.badge}</span>
      </span>
      <p className="min-w-0 text-[13px] leading-snug whitespace-nowrap text-white/85 sm:text-sm">
        <span className="hidden sm:inline">{p.text}</span>
        <span className="sm:hidden">{p.short}</span>
      </p>
      <button
        type="button"
        onClick={openSignup}
        className="inline-flex h-8 shrink-0 cursor-pointer whitespace-nowrap items-center rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-4 text-[13px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(255,106,20,0.9)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgba(255,106,20,1)]"
      >
        <span className="hidden sm:inline">{p.cta}</span>
        <span className="sm:hidden">{p.ctaShort}</span>
      </button>
    </div>
    </>
  );
}
