"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The tiger hero's CTA ("Let's talk"): a white pill that floods with tiger-eye amber from wherever the pointer enters,
 * its letters rolling up one after another, the pill and its label pulled a little toward the pointer (fine pointers
 * only, never under reduced motion). The look lives in `globals.css` (`.tiger-cta*`).
 */
export function TigerCta({ href, label, className }: { href: string; label: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  // Where the amber circle starts from, and how big it must be to cover the pill from any entry point.
  const setFill = (e: PointerEvent<HTMLAnchorElement>) => {
    const b = ref.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty("--fx", `${e.clientX - r.left}px`);
    b.style.setProperty("--fy", `${e.clientY - r.top}px`);
    b.style.setProperty("--d", `${(Math.hypot(r.width, r.height) * 2.05).toFixed(0)}px`);
  };

  const magnetic = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const b = ref.current;
    if (!b || !magnetic()) return;
    const r = b.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    b.style.setProperty("--mx", `${(x * 0.18).toFixed(1)}px`);
    b.style.setProperty("--my", `${(y * 0.28).toFixed(1)}px`);
    b.style.setProperty("--lx", `${(x * 0.06).toFixed(1)}px`);
    b.style.setProperty("--ly", `${(y * 0.08).toFixed(1)}px`);
  };

  const onLeave = (e: PointerEvent<HTMLAnchorElement>) => {
    setFill(e);
    const b = ref.current;
    if (!b) return;
    for (const p of ["--mx", "--my", "--lx", "--ly"]) b.style.removeProperty(p);
  };

  const onFocus = () => {
    const b = ref.current;
    if (!b) return;
    b.style.removeProperty("--fx");
    b.style.removeProperty("--fy");
    b.style.setProperty("--d", `${(Math.hypot(b.offsetWidth, b.offsetHeight) * 2.05).toFixed(0)}px`);
  };

  return (
    <Link
      ref={ref}
      href={href}
      aria-label={label}
      className={cn("tiger-cta", className)}
      onPointerEnter={setFill}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onFocus={onFocus}
    >
      <span className="tiger-cta__fill" aria-hidden />
      <span className="tiger-cta__label" aria-hidden>
        {[...label].map((c, i) => {
          const ch = c === " " ? "\u00a0" : c;
          return (
            <span key={i} className="tiger-cta__ch" style={{ "--i": i } as CSSProperties}>
              <span>{ch}</span>
              <span>{ch}</span>
            </span>
          );
        })}
      </span>
    </Link>
  );
}
