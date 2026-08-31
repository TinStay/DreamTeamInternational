"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InfiniteSliderProps = {
  children: React.ReactNode;
  /** Seconds for one full loop (half-track travel). */
  duration?: number;
  reverse?: boolean;
  className?: string;
  /** Class applied to each half of the track (spacing between items lives here). */
  trackClassName?: string;
};

/**
 * CSS-keyframe vertical marquee (see `marquee-y` in globals.css). The content
 * is rendered twice in identical halves so `translateY(-50%)` loops perfectly;
 * hovering pauses the scroll so the content can be read.
 */
export function InfiniteSlider({
  children,
  duration = 45,
  reverse = false,
  className,
  trackClassName,
}: InfiniteSliderProps) {
  const half = <div className={cn("flex flex-col", trackClassName)}>{children}</div>;

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="animate-marquee-y will-change-transform hover:[animation-play-state:paused]"
        style={
          {
            "--marquee-duration": `${duration}s`,
            animationDirection: reverse ? "reverse" : undefined,
          } as React.CSSProperties
        }
      >
        {half}
        <div aria-hidden>{half}</div>
      </div>
    </div>
  );
}
