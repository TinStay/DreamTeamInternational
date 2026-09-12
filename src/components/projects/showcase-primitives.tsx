"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { backgroundEmbedSrc } from "@/components/projects-section";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_REFERRER_POLICY } from "@/lib/youtube-embeds";

/*
 * Building blocks for the home "case studies journey" (`projects-showcase.tsx`
 * + `showcase-scenes.tsx`). Every piece is driven by the scene's local time
 * `t` (0 = framed, -1 = one span before, +1 = one span after).
 */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * A layer that drifts with the scene's local time: `depth` moves it
 * vertically (0.35 viewport per unit), `dx` horizontally, `rotate` in degrees
 * and `scale` grows it as the scene leaves. Depth > 0 trails the scene,
 * depth < 0 leads it - stack a few and the scene reads as 3D.
 */
export function ParallaxLayer({
  t,
  depth = 0,
  dx = 0,
  rotate = 0,
  scale = 0,
  className,
  children,
}: {
  t: MotionValue<number>;
  depth?: number;
  dx?: number;
  rotate?: number;
  scale?: number;
  className?: string;
  children?: ReactNode;
}) {
  const transform = useTransform(t, (v) => {
    const lt = clamp(v, -1, 1);
    const y = depth * lt * -35;
    const x = dx * lt * 30;
    const sc = 1 + scale * Math.abs(lt);
    return `translate3d(${x}vw, ${y}vh, 0) rotate(${rotate * lt}deg) scale(${sc})`;
  });
  return (
    <motion.div className={cn("absolute inset-0 will-change-transform", className)} style={{ transform }}>
      {children}
    </motion.div>
  );
}

/** Staggered reveal as the scene frames: 0 → 1 over t ∈ [-0.32 + delay, -0.02 + delay]. */
export const revealK = (t: number, delay: number) => easeOut(clamp01((t + 0.32 - delay) / 0.3));

/** Fades + rises into place as the scene frames; `delay` staggers siblings. */
export function Reveal({
  t,
  delay = 0,
  className,
  children,
}: {
  t: MotionValue<number>;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const opacity = useTransform(t, (v) => revealK(v, delay));
  const y = useTransform(t, (v) => (1 - revealK(v, delay)) * 22);
  return (
    <motion.div className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

/**
 * Deterministic rising particles (`animate-showcase-rise`). `region` is the
 * [min, max] % band they spawn in; every third one takes the second colour.
 */
export function Sparks({
  colors: [a, b],
  count = 24,
  region = { left: [44, 98], top: [12, 92] },
  size = 2,
  glow = 8,
  className,
}: {
  colors: [string, string];
  count?: number;
  region?: { left: [number, number]; top: [number, number] };
  size?: number;
  glow?: number;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = region.left[0] + ((i * 37) % (region.left[1] - region.left[0]));
        const top = region.top[0] + ((i * 53) % (region.top[1] - region.top[0]));
        const px = size + (i % 3);
        const duration = 6 + ((i * 1.7) % 6);
        const delay = -((i * 2.3) % 9);
        const color = i % 3 === 0 ? a : b;
        return (
          <span
            key={i}
            className="animate-showcase-rise absolute rounded-full will-change-transform"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: px,
              height: px,
              backgroundColor: color,
              boxShadow: `0 0 ${glow}px ${color}`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Scroll-scrubbed image sequence (`<base>/f000.webp` … `f{count-1}.webp`)
 * drawn onto a canvas: `progress` 0 → 1 picks the frame. Frames only start
 * downloading once `enabled` (the section is near the viewport); while a
 * frame is still loading the nearest loaded neighbour is drawn instead.
 * `split` draws the same frame onto two canvases showing the left / right
 * halves, pulled 15% apart (the Emblema buildings).
 */
export function FrameSequence({
  progress,
  base,
  count,
  width,
  height,
  enabled,
  split = false,
  className,
}: {
  progress: MotionValue<number>;
  base: string;
  count: number;
  /** Canvas backing-store size (the source frames are scaled into it). */
  width: number;
  height: number;
  enabled: boolean;
  split?: boolean;
  className?: string;
}) {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const frames = useRef<HTMLImageElement[]>([]);
  const wanted = useRef(0);
  const drawn = useRef(-1);

  const draw = useCallback(
    (index: number, force = false) => {
      if (!force && index === drawn.current) return;
      const ready = (img?: HTMLImageElement) => !!img && img.complete && img.naturalWidth > 0;
      let img: HTMLImageElement | undefined = frames.current[index];
      if (!ready(img)) {
        img = undefined;
        for (let d = 1; d < count && !img; d++) {
          const before = frames.current[index - d];
          const after = frames.current[index + d];
          if (ready(before)) img = before;
          else if (ready(after)) img = after;
        }
        if (!img) return;
      }
      for (const canvas of canvases.current) {
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) continue;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      drawn.current = index;
    },
    [count]
  );

  useEffect(() => {
    if (!enabled || frames.current.length > 0) return;
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `${base}/f${String(i).padStart(3, "0")}.webp`;
      // Repaint when the frame we are currently showing (or its stand-in) lands.
      img.onload = () => {
        if (drawn.current < 0 || wanted.current === i) draw(i, true);
      };
      frames.current[i] = img;
    }
  }, [enabled, base, count, draw]);

  const index = useTransform(progress, (v) => Math.min(count - 1, Math.floor(clamp01(v) * count)));
  useMotionValueEvent(index, "change", (i) => {
    wanted.current = i;
    draw(i);
  });

  const canvasClass = "absolute inset-0 block h-full w-full will-change-transform [transform:translateZ(0)]";
  return (
    <div className={cn("relative", className)} aria-hidden>
      {split ? (
        <>
          <canvas
            ref={(el) => {
              canvases.current[0] = el;
            }}
            width={width}
            height={height}
            className={cn(canvasClass, "-ml-[15%] [clip-path:inset(0_52%_0_0)]")}
          />
          <canvas
            ref={(el) => {
              canvases.current[1] = el;
            }}
            width={width}
            height={height}
            className={cn(canvasClass, "ml-[15%] [clip-path:inset(0_0_0_52%)]")}
          />
        </>
      ) : (
        <canvas
          ref={(el) => {
            canvases.current[0] = el;
          }}
          width={width}
          height={height}
          className={canvasClass}
        />
      )}
    </div>
  );
}

/**
 * Muted, looping background player (`src` = a YouTube `backgroundEmbedSrc`
 * or a Bunny `bunnyBackgroundEmbedSrc`) cover-fitting a box of aspect
 * `boxAspect` (width / height). Players are 16:9; a 9:16 clip is
 * pillar-boxed inside, so its visible column (9/16 of the player height) is
 * what has to cover the box - hence the 316%-wide player for tall clips in a
 * wide-ish box.
 */
export function EmbedCover({
  src,
  orientation = "wide",
  boxAspect,
  className,
}: {
  src: string;
  orientation?: Project["orientation"];
  boxAspect: number;
  className?: string;
}) {
  const tall = orientation === "tall";
  const contentAspect = tall ? 9 / 16 : 16 / 9;
  const fillWidth = boxAspect >= contentAspect;
  const style = fillWidth
    ? { width: tall ? `${(100 * (16 / 9)) / (9 / 16)}%` : "100%", aspectRatio: "16 / 9" }
    : { height: "100%", aspectRatio: "16 / 9" };
  return (
    <iframe
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 scale-[1.02]",
        className
      )}
      style={style}
      src={src}
      title=""
      tabIndex={-1}
      allow={YOUTUBE_IFRAME_ALLOW}
      allowFullScreen={false}
      referrerPolicy={YOUTUBE_REFERRER_POLICY}
    />
  );
}

/** `EmbedCover` for a project's YouTube clip; renders nothing while the clip isn't published. */
export function ProjectEmbedCover({
  project,
  boxAspect,
  className,
}: {
  project: Pick<Project, "videoId" | "orientation">;
  boxAspect: number;
  className?: string;
}) {
  if (!project.videoId) return null;
  return (
    <EmbedCover
      src={backgroundEmbedSrc(project.videoId)}
      orientation={project.orientation}
      boxAspect={boxAspect}
      className={className}
    />
  );
}
