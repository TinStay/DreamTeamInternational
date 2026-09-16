import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * A stop for the mobile scene snapping. On coarse-pointer screens below `lg`
 * the home page (`<main data-snap-sections>`) snaps the viewport to these
 * zero-height markers - `scroll-snap-type: y proximity` on the root, with
 * `scroll-snap-stop: always` on every stop, so one swipe lands exactly on the
 * next one, TikTok-style; only the projects stage places them, so the rest of
 * the page scrolls free (the rule lives in globals.css; it is off under
 * reduced motion and while a field has focus). `margin` puts the stop that
 * far above the marker.
 */
export function SnapStop({ margin, className, style }: { margin?: string; className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={cn("h-0 snap-start snap-always", className)} style={{ scrollMarginTop: margin, ...style }} />;
}
