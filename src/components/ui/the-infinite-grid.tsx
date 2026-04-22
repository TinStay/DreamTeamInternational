"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
} from "framer-motion";
import { cn } from "@/lib/utils";

type GridPatternProps = {
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  patternId: string;
};

function GridPattern({ offsetX, offsetY, patternId }: GridPatternProps) {
  const fillUrl = `url(#${patternId})`;

  return (
    <svg className="h-full w-full" aria-hidden>
      <defs>
        <motion.pattern
          id={patternId}
          width={40}
          height={40}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className="text-muted-foreground"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={fillUrl} />
    </svg>
  );
}

export type InfiniteGridBackgroundProps = {
  className?: string;
};

/**
 * Animated line grid + cursor spotlight + soft color orbs.
 * Safe behind `pointer-events-none`: uses `document` mousemove mapped to this layer’s box.
 */
export function InfiniteGridBackground({ className }: InfiniteGridBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const patternIdA = `${safeId}-grid-a`;
  const patternIdB = `${safeId}-grid-b`;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const { left, top } = el.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.5;
  const speedY = 0.5;

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speedX) % 40);
    gridOffsetY.set((currentY + speedY) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={rootRef}
      className={cn("pointer-events-none overflow-hidden bg-background", className)}
      aria-hidden
    >
      <div className="absolute inset-0 z-0 opacity-[0.06]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} patternId={patternIdA} />
      </div>
      <motion.div
        className="absolute inset-0 z-0 opacity-[0.22] dark:opacity-[0.28]"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} patternId={patternIdB} />
      </motion.div>

      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-20%] h-[40%] w-[40%] rounded-full bg-indigo-500/32 blur-[120px] dark:bg-violet-600/22" />
        <div className="absolute top-[-10%] right-[10%] h-[20%] w-[20%] rounded-full bg-primary/25 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/35 blur-[120px] dark:bg-blue-600/18" />
      </div>

      {/* Soft vignette so long pages stay readable over the grid */}
      <div className="absolute inset-0 z-[1] bg-background/0 [mask-image:radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,black_72%)]" />
    </div>
  );
}

export type InfiniteGridProps = {
  className?: string;
};

/**
 * Full-viewport demo: grid backdrop + sample hero copy.
 */
export function InfiniteGrid({ className }: InfiniteGridProps) {
  const [count, setCount] = useState(0);

  return (
    <div
      className={cn(
        "relative flex h-screen min-h-[32rem] w-full flex-col items-center justify-center overflow-hidden bg-background",
        className
      )}
    >
      <div className="absolute inset-0">
        <InfiniteGridBackground className="h-full w-full" />
      </div>

      <div className="pointer-events-none relative z-10 mx-auto flex max-w-3xl flex-col items-center space-y-6 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm md:text-6xl">
            The Infinite Grid
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Move your cursor to reveal the active grid layer. <br />
            The pattern scrolls infinitely in the background.
          </p>
        </div>

        <div className="pointer-events-auto flex gap-4">
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="rounded-md bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95"
          >
            Interact ({count})
          </button>
          <button
            type="button"
            className="rounded-md bg-secondary px-8 py-3 font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-95"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

/** Alias for snippet compatibility */
export const Component = InfiniteGrid;
