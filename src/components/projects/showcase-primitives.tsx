"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { backgroundEmbedSrc } from "@/components/projects-section";
import { bunnyBackgroundEmbedSrc } from "@/lib/bunny-stream";
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
 * frame is still on its way the nearest ready neighbour is drawn instead.
 * On a **coarse pointer** (phones, tablets) every frame is loaded and kept
 * as a decoded `ImageBitmap` at the size it shows at (1.5 × the CSS size, at
 * most `COARSE_BITMAP_MAX` wide - about 50–130 MB a sequence): a phone
 * drops decoded images from its cache between frames and re-decodes one per
 * drawn frame, which is what made the scrub stutter; retained bitmaps scrub
 * for free. All 72 of them - every other one was tried and the page tween
 * skipped source frames at its peak, which read as steps. A fine pointer
 * keeps the plain decoded `<img>`s (all 72 - the desktop cache holds them). `split` draws the same frame onto
 * two canvases showing the left / right halves, pulled apart by
 * `--split-gap` (a percentage, set by the caller's class so it can differ
 * per breakpoint; 15% if unset - the Emblema buildings). `still`: the
 * sequence stands at `progress` for good (the phones' stacked worlds) - the
 * one frame it shows is downloaded and drawn, nothing else.
 */
const COARSE_BITMAP_MAX = 560;
export function FrameSequence({
  progress,
  base,
  count,
  width,
  height,
  enabled,
  split = false,
  still = false,
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
  still?: boolean;
  className?: string;
}) {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  /** Frames ready to draw: the decoded `<img>` (fine pointer) or the display-sized bitmap (coarse). */
  const ready = useRef<Map<number, CanvasImageSource>>(new Map());
  const wanted = useRef(0);
  /** The frame index last requested (`drawn`) and the frame actually painted for it (`painted`, may be a stand-in). */
  const drawn = useRef(-1);
  const painted = useRef(-1);

  const draw = useCallback(
    (index: number, force = false) => {
      if (!force && index === drawn.current) return;
      const has = (idx: number) => ready.current.has(idx);
      let source = has(index) ? index : -1;
      if (source < 0) {
        // Nearest ready neighbour as a stand-in.
        for (let d = 1; d < count && source < 0; d++) {
          if (has(index - d)) source = index - d;
          else if (has(index + d)) source = index + d;
        }
        if (source < 0) return;
      }
      const pixels = ready.current.get(source);
      if (!pixels) return;
      for (const canvas of canvases.current) {
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) continue;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(pixels, 0, 0, canvas.width, canvas.height);
      }
      drawn.current = index;
      painted.current = source;
    },
    [count]
  );

  const index = useTransform(progress, (v) => Math.min(count - 1, Math.floor(clamp01(v) * count)));

  useEffect(() => {
    if (!enabled || ready.current.size > 0) return;
    // The frame wanted now - a `change` only fires once `progress` moves, and a still sequence's never does.
    wanted.current = index.get();
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // Coarse: every frame, as a bitmap at 1.5 × the CSS size (never above the canvas or the cap).
    const stride = 1;
    const shown = canvases.current[0]?.clientWidth || 0;
    const bitmapW = Math.min(width, COARSE_BITMAP_MAX, shown > 0 ? Math.round(shown * Math.min(window.devicePixelRatio || 1, 1.5)) : width);
    const bitmapH = Math.round((bitmapW * height) / width);
    // Coarse-to-fine: the held pose (last frame) and every 8th frame first, so
    // scrubbing has stand-ins almost immediately, then the gaps - six requests
    // in flight at a time rather than all `count` at once.
    const order: number[] = still ? [wanted.current] : [count - 1];
    for (const step of still ? [] : [8, 4, 2, 1]) {
      if (step < stride) break;
      for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
    }
    let next = 0;
    let cancelled = false;
    const bitmaps: ImageBitmap[] = [];
    const startOne = () => {
      if (cancelled || next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = "async";
      const landed = (pixels: CanvasImageSource) => {
        if (cancelled) {
          if (pixels instanceof ImageBitmap) pixels.close();
          return;
        }
        ready.current.set(i, pixels);
        // Repaint when this frame is closer to what we want than the stand-in on screen.
        const want = wanted.current;
        if (drawn.current < 0 || Math.abs(i - want) < Math.abs(painted.current - want)) draw(want, true);
        startOne();
      };
      img.onload = () => {
        if (cancelled) return;
        if (coarse) {
          // The resize options first (Chrome, Firefox, Safari 15.4+); a plain bitmap where they are not supported.
          createImageBitmap(img, { resizeWidth: bitmapW, resizeHeight: bitmapH, resizeQuality: "medium" })
            .catch(() => createImageBitmap(img))
            .then(
              (bitmap) => {
                bitmaps.push(bitmap);
                landed(bitmap);
              },
              () => startOne()
            );
        } else {
          img.decode().then(() => landed(img), () => startOne());
        }
      };
      img.onerror = () => startOne();
      img.src = `${base}/f${String(i).padStart(3, "0")}.webp`;
    };
    for (let k = 0; k < 6; k++) startOne();
    return () => {
      // A cancelled run leaves nothing behind, so a re-run (StrictMode, deps) restarts cleanly from the browser cache.
      cancelled = true;
      for (const bitmap of bitmaps) bitmap.close();
      ready.current.clear();
      drawn.current = -1;
      painted.current = -1;
    };
  }, [enabled, still, base, count, width, height, draw, index]);

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
            className={cn(canvasClass, "[clip-path:inset(0_52%_0_0)]")}
            style={{ marginLeft: "calc(-1 * var(--split-gap, 15%))" }}
          />
          <canvas
            ref={(el) => {
              canvases.current[1] = el;
            }}
            width={width}
            height={height}
            className={cn(canvasClass, "[clip-path:inset(0_0_0_52%)]")}
            style={{ marginLeft: "var(--split-gap, 15%)" }}
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

/**
 * `EmbedCover` for a project's clip on the stage - the stage-only footage first (`showcaseClip` on Bunny, then
 * the YouTube `showcaseVideoId`), else the project's own (`videoId`, then the Bunny `clip`); renders nothing
 * while nothing is published.
 */
export function ProjectEmbedCover({
  project,
  boxAspect,
  className,
}: {
  project: Pick<Project, "videoId" | "orientation" | "clip" | "showcaseClip" | "showcaseVideoId">;
  boxAspect: number;
  className?: string;
}) {
  const src = project.showcaseClip
    ? bunnyBackgroundEmbedSrc(project.showcaseClip)
    : project.showcaseVideoId
      ? backgroundEmbedSrc(project.showcaseVideoId)
      : project.videoId
        ? backgroundEmbedSrc(project.videoId)
        : project.clip
          ? bunnyBackgroundEmbedSrc(project.clip)
          : null;
  if (!src) return null;
  return <EmbedCover src={src} orientation={project.orientation} boxAspect={boxAspect} className={className} />;
}
