"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A side-menu row in the main CTA's dress (the portfolio's categories, the
 * FAQ's topics): the active row is the `auto` pill - dark in the light
 * theme, white in the dark one - with its icon in the brand-gradient disc at
 * its left end, the others plain rows nudging right on hover.
 */
export function sideTabClass(active: boolean) {
  return cn(
    "group relative inline-flex h-12 w-full cursor-pointer items-center justify-start gap-3 rounded-full border-0 ps-1.5 pe-5 text-sm font-semibold whitespace-normal text-left shadow-none",
    "transition-[background-color,color,transform,box-shadow] duration-200 ease-out will-change-transform focus-visible:ring-2 focus-visible:ring-ring/50",
    active
      ? "translate-x-0 bg-neutral-900 text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)] hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900 dark:shadow-[0_12px_32px_rgba(255,255,255,0.14)] dark:hover:bg-white dark:hover:text-neutral-900"
      : "bg-transparent text-foreground hover:translate-x-0.5 hover:bg-muted/60 hover:text-foreground"
  );
}
/** The icon disc of a side-menu row: the brand gradient on the active row, a muted disc otherwise. */
export function sideTabDiscClass(active: boolean) {
  return cn(
    "flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 ease-out",
    active
      ? "bg-gradient-to-br from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-white shadow-[0_6px_16px_var(--primary-elevated-shadow)]"
      : "bg-muted/70 text-foreground/75 group-hover:scale-[1.06]"
  );
}

/**
 * The site's main CTA - the projects' pill with a sliding arrow disc: the
 * label sits left with the disc on the right; on hover the disc glides to the
 * left edge (rotating 45°) while the padding swaps sides so the label slides
 * right. With `href` it renders as a `next/link` through the shadcn `Button`
 * (`render`), so it stays a real anchor; with `onClick` it is a plain button
 * (the service cards' "request a quote").
 *
 * `surface` picks the colour pair - `dark` = near-black pill with white type
 * (light backgrounds), `light` = white pill with dark type (dark backgrounds /
 * footage), `auto` = dark pill in the light theme, white pill in the dark
 * theme (the header, the hero, anything on the page ground). The arrow disc
 * always carries the brand gradient. `size="sm"` is the slim header bar's,
 * `"lg"` the service pages' hero CTA. `glow` lays a faint red → violet halo
 * behind the pill (the header's), a little stronger while it is hovered.
 */
export function ButtonWithIcon({
  href,
  onClick,
  children,
  surface = "dark",
  size = "md",
  glow = false,
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  surface?: "dark" | "light" | "auto";
  size?: "md" | "sm" | "lg";
  glow?: boolean;
  className?: string;
}) {
  const pill = {
    dark: "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]",
    light: "bg-white text-neutral-900 hover:bg-white hover:text-neutral-900 shadow-[0_12px_32px_rgba(255,255,255,0.2)]",
    auto: "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:bg-white dark:text-neutral-900 dark:hover:bg-white dark:hover:text-neutral-900 dark:shadow-[0_12px_32px_rgba(255,255,255,0.14)]",
  }[surface];
  // Geometry per size: pill height and label padding (the disc's side = disc + 4px gap + the label's own gap);
  // the disc glides to the far edge on hover (4px in).
  const geometry = {
    sm: "h-9 ps-4 pe-11 text-sm hover:ps-11 hover:pe-4",
    md: "h-12 ps-6 pe-[3.25rem] text-sm lg:text-base hover:ps-[3.25rem] hover:pe-6",
    lg: "h-14 ps-7 pe-16 text-base lg:text-lg hover:ps-16 hover:pe-7",
  }[size];
  // A named group, so only the pill's own hover moves the disc - not a hovered card around it.
  const discSize = {
    sm: "right-1 size-7 group-hover/cta:right-[calc(100%-32px)]",
    // A touch smaller than the pill's inner height, concentric in it (6px from every edge).
    md: "right-1.5 size-9 group-hover/cta:right-[calc(100%-42px)]",
    lg: "right-1 size-12 group-hover/cta:right-[calc(100%-52px)]",
  }[size];
  // The arrow disc always carries the brand gradient (red → violet), on either surface.
  const disc = cn(
    "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-white shadow-[0_6px_16px_var(--primary-elevated-shadow)] transition-all duration-500 group-hover/cta:rotate-45",
    discSize
  );
  const shared = cn(
    "group/cta relative w-fit cursor-pointer overflow-hidden rounded-full p-1 font-semibold transition-all duration-500 ease-out hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
    geometry,
    pill,
    className
  );
  const content = (
    <>
      <span className="relative z-10 transition-all duration-500">{children}</span>
      <span className={disc} aria-hidden>
        <ArrowUpRight size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      </span>
    </>
  );
  const button = href ? (
    <Button render={<Link href={href} />} nativeButton={false} onClick={onClick} variant="ghost" size="lg" className={shared}>
      {content}
    </Button>
  ) : (
    <Button type="button" onClick={onClick} variant="ghost" size="lg" className={shared}>
      {content}
    </Button>
  );
  if (!glow) return button;
  // The halo sits outside the pill (which clips its own overflow for the sliding disc), so it wraps it.
  return (
    <span className="group/glow relative inline-flex shrink-0">
      <span
        className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] opacity-30 blur-md transition-opacity duration-500 group-hover/glow:opacity-55 dark:opacity-35"
        aria-hidden
      />
      {button}
    </span>
  );
}
