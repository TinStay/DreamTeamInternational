"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── the curved row ──────────────────────────────────────────────
 * "Tilted Grid" turned on its side, with the tilt drawn as a curve: one row of cards round the inside of a cylinder.
 * The centre faces you flat, the ends bend toward you so each end card curves along its length, and the ends fade into
 * the page. A CSS box can't bend, so every card is cut into SLICES vertical strips, each a flat facet of the cylinder
 * showing its share of the card; the strips sit still inside their card (preserve-3d), and the card is what moves - one
 * rotateY about the cylinder's axis carries it along the arc.
 *
 * Adapted from the original (a CSS-only loop) so people can drive it: the row's position is one number - how far it
 * has turned, in degrees - that drifts on its own (`speed`), follows a mouse or finger drag 1:1 with a fling that eases
 * out, and takes horizontal wheel / trackpad scrolling (vertical wheel and vertical swipes stay the page's). Each frame
 * writes one transform per card (a handful of style writes - no layout, no React render); a card picks up its next item
 * as it wraps round out of sight, in either direction. The loop runs only while the row is on screen and has something
 * to do (drift, a drag, a fling coming to rest), and reduced motion turns the drift off - the row still drags.
 * A click on a card (not the end of a drag) calls `onSelect` with the item's index.
 * ─────────────────────────────────────────────────────────────── */

// Strips per card: each a few degrees of arc - too little to read as a facet.
const SLICES = 16;

// Camera distance from the screen, as a multiple of the cylinder's radius: just past the axis, so the ends come right
// up to the lens and swell.
const CAMERA = 1.6;

/** Cylinder radius, as a share of the row's width, that puts the frame's edge `bend` radians round the arc. */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

/**
 * Lays the loop on the cylinder (angles in degrees): `unit` is the arc one card-height spans, `pitch` one card plus its
 * gap, `limit` how far round a card's centre can go before the whole card is off-screen, `sweep` half the loop. The
 * loop reaches past `limit` (so a card only ever wraps out of sight) and is a whole number of cards.
 */
function measure(width: number, height: number, tile: number, aspect: number, gap: number, bend: number, maxWidth: number) {
  const h = Math.min((tile / 100) * height, ((maxWidth / 100) * width) / aspect);
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0, pitch: 0, radiusPx: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  const columns = Math.min(40, Math.max(3, Math.ceil((2 * limit) / pitch) + 1));
  const sweep = (columns * pitch) / 2;
  return { columns, sweep, unit, limit: Math.min(sweep, limit), pitch, radiusPx: radius };
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export type TiltedGridItem = {
  /** The card's picture. */
  src: string;
  alt?: string;
  /** Drawn over the picture, across the curve (e.g. a title on a gradient). */
  caption?: React.ReactNode;
};

export type TiltedGridHeroProps = {
  /** The cards, in order along the row; a short list simply repeats. */
  items: TiltedGridItem[];
  /** Seconds for the row to drift by one card. @default 5 */
  speed?: number;
  /** Card height, as a percentage of the row's height. @default 26 */
  tileHeight?: number;
  /** Card width divided by card height. @default 16 / 9 */
  aspectRatio?: number;
  /** Space between cards, as a percentage of a card's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of its height. @default 50 */
  axis?: number;
  /** How far the row has bent round by the frame's edge, in degrees (5-85). @default 80 */
  curve?: number;
  /** Width of the fade at each end, as a percentage of the row's width. @default 12 */
  fade?: number;
  /** A card is never wider than this share of the row (so a phone still shows its neighbours). @default 55 */
  maxWidth?: number;
  /** Rounding of a card's ends (any CSS length). @default 1rem */
  radius?: string;
  /** A click on a card (not the end of a drag). */
  onSelect?: (index: number) => void;
  /** Content rendered above the row. */
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  items,
  speed = 5,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 50,
  curve = 80,
  fade = 12,
  maxWidth = 55,
  radius: cornerRadius = "1rem",
  onSelect,
  children,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"div">, "onSelect"> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const tiles = React.useRef<(HTMLDivElement | null)[]>([]);
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Null until measured: the row stays hidden until then, so a first paint at the wrong size never shows.
  const [layout, setLayout] = React.useState<ReturnType<typeof measure> | null>(null);
  // Which item each card shows - changes only as a card wraps round, out of sight.
  const [shown, setShown] = React.useState<number[]>([]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend, maxWidth);
      setLayout((prev) => (prev && prev.columns === next.columns && Math.abs(prev.pitch - next.pitch) < 1e-6 && Math.abs(prev.radiusPx - next.radiusPx) < 0.5 ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileHeight, aspectRatio, gap, bend, maxWidth]);

  // Fetch every picture up front: a card picks up its next one just before it comes back into view.
  React.useEffect(() => {
    for (const { src } of items) {
      const img = new Image();
      img.referrerPolicy = "origin";
      img.src = src;
    }
  }, [items]);

  // ── the motion: one number, `turned` (degrees), drives every card ──
  const turned = React.useRef(0);
  const velocity = React.useRef(0); // degrees per ms, from a fling
  const drag = React.useRef<{ x: number; lastX: number; lastT: number; moved: number; active: boolean } | null>(null);
  const suppressClick = React.useRef(false);
  /** Starts the frame loop if it is idle (set by the loop's effect). */
  const wake = React.useRef<() => void>(() => {});
  const hover = React.useRef(false);
  const driftFactor = React.useRef(1);
  const shownRef = React.useRef<number[]>([]);
  const layoutRef = React.useRef(layout);
  const itemsCount = React.useRef(items.length);
  React.useEffect(() => {
    layoutRef.current = layout;
    itemsCount.current = items.length;
  });

  /** Puts every card where `turned` says, and hands a card its next item when it has wrapped. */
  const place = React.useCallback(() => {
    const l = layoutRef.current;
    const n = itemsCount.current;
    if (!l || !l.pitch || !n) return;
    const L = l.columns * l.pitch;
    const r = `${+(100 * arc(bend)).toFixed(3)}cqw`;
    let changed = false;
    const next = shownRef.current.slice(0, l.columns);
    for (let t = 0; t < l.columns; t++) {
      const raw = t * l.pitch + turned.current;
      const x = mod(raw, L);
      const angle = -l.sweep + x;
      const el = tiles.current[t];
      if (el) {
        el.style.transform = `translateZ(${r}) rotateY(${angle.toFixed(4)}deg) translateZ(-${r})`;
        el.style.visibility = Math.abs(angle) <= l.limit ? "visible" : "hidden";
      }
      // The slot this card stands for on the endless strip; items run in order as cards come on.
      const slot = t - l.columns * Math.floor(raw / L);
      const item = mod(-slot, n);
      if (next[t] !== item) {
        next[t] = item;
        changed = true;
      }
    }
    if (changed) {
      shownRef.current = next;
      setShown(next);
    }
  }, [bend]);

  React.useLayoutEffect(() => {
    place();
  }, [layout, items.length, place]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;
    let raf = 0;
    let last = 0;

    const busy = () => !reduce.matches || drag.current?.active || Math.abs(velocity.current) > 1e-4;
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const l = layoutRef.current;
      if (l && l.pitch && !drag.current?.active) {
        // The drift slows to a crawl under the pointer, so a card can be read and clicked.
        driftFactor.current += ((hover.current ? 0.15 : 1) - driftFactor.current) * Math.min(1, dt / 250);
        const drift = reduce.matches ? 0 : (l.pitch / (speed * 1000)) * driftFactor.current;
        turned.current += (drift + velocity.current) * dt;
        velocity.current *= Math.exp(-dt / 420);
        if (Math.abs(velocity.current) < 1e-4) velocity.current = 0;
      }
      place();
      schedule();
    };
    const schedule = () => {
      if (!raf && onScreen && !document.hidden && busy()) {
        raf = requestAnimationFrame(frame);
      } else if (!raf) {
        last = 0;
      }
    };
    wake.current = schedule;

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      schedule();
    });
    io.observe(el);
    const onVisible = () => schedule();
    document.addEventListener("visibilitychange", onVisible);
    reduce.addEventListener("change", onVisible);

    // Horizontal wheel / trackpad turns the row; a vertical wheel is the page's (shift turns a vertical wheel sideways).
    const onWheel = (e: WheelEvent) => {
      const l = layoutRef.current;
      if (!l || !l.radiusPx) return;
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!sideways) return;
      e.preventDefault();
      turned.current += (sideways / l.radiusPx) * (180 / Math.PI);
      schedule();
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    schedule();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      reduce.removeEventListener("change", onVisible);
      el.removeEventListener("wheel", onWheel);
      wake.current = () => {};
    };
  }, [place, speed]);

  // Drag: the row follows the pointer 1:1 (degrees per pixel at the centre), then flings on.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, lastX: e.clientX, lastT: e.timeStamp, moved: 0, active: false };
    velocity.current = 0;
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      const l = layoutRef.current;
      if (!d || !l || !l.radiusPx) return;
      const dx = ev.clientX - d.lastX;
      d.moved = Math.max(d.moved, Math.abs(ev.clientX - d.x));
      if (!d.active && d.moved > 6) d.active = true;
      if (!d.active) return;
      const deg = (-dx / l.radiusPx) * (180 / Math.PI);
      turned.current += deg;
      const dt = Math.max(1, ev.timeStamp - d.lastT);
      velocity.current = velocity.current * 0.6 + (deg / dt) * 0.4;
      d.lastX = ev.clientX;
      d.lastT = ev.timeStamp;
      wake.current();
    };
    const up = (ev: PointerEvent) => {
      const d = drag.current;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (d?.active) {
        suppressClick.current = true;
        // A pause before letting go is no fling.
        if (ev.timeStamp - d.lastT > 80) velocity.current = 0;
      }
      drag.current = d ? { ...d, active: false } : null;
      wake.current();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const columns = layout?.columns ?? 0;
  const share = aspectRatio / SLICES;
  const unit = layout?.unit ?? 0;
  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  const turn = (deg: number) => `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;
  // Every length is a multiple of the card's height, which follows the row's height until `maxWidth` caps it.
  const u = (k: number) => `calc(${+k.toFixed(4)} * min(${tileHeight}cqh, ${+(maxWidth / aspectRatio).toFixed(4)}cqw))`;
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${100 - fade}%,transparent)`;

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} {...props} style={{ containerType: "size", ...style }}>
      <div
        aria-hidden
        onPointerDown={onPointerDown}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            hover.current = true;
            wake.current();
          }
        }}
        onPointerLeave={() => {
          hover.current = false;
          wake.current();
        }}
        onClickCapture={(e) => {
          // The end of a drag is not a click on the card under it.
          if (suppressClick.current) {
            suppressClick.current = false;
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className={cn("absolute inset-0 touch-pan-y select-none transition-opacity duration-500", onSelect ? "cursor-grab active:cursor-grabbing" : "cursor-grab")}
        style={{
          opacity: layout ? 1 : 0,
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          const index = shown[t] ?? 0;
          const item = items[index % Math.max(items.length, 1)];
          return (
            <div
              key={t}
              ref={(node) => {
                tiles.current[t] = node;
              }}
              onClick={onSelect && item ? () => onSelect(index % items.length) : undefined}
              className="group/tile absolute will-change-transform"
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                transformStyle: "preserve-3d",
                visibility: "hidden",
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <div
                  key={k}
                  className="absolute top-0 overflow-hidden bg-[#141518]"
                  style={{
                    left: u((aspectRatio - share) / 2),
                    // A pixel wider than its share, so neighbouring facets overlap and no hairline opens between them.
                    width: k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn((aspectRatio / 2 - (k + 0.5) * share) * unit),
                    borderTopLeftRadius: k === 0 ? cornerRadius : undefined,
                    borderBottomLeftRadius: k === 0 ? cornerRadius : undefined,
                    borderTopRightRadius: k === SLICES - 1 ? cornerRadius : undefined,
                    borderBottomRightRadius: k === SLICES - 1 ? cornerRadius : undefined,
                  }}
                >
                  {item ? (
                    <div className="absolute top-0" style={{ left: u(-k * share), width: u(aspectRatio), height: u(1) }}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- one strip of a picture cut across 16 facets; the optimizer cannot serve that, and the posters' pull zone is referer-gated. */}
                      <img
                        src={item.src}
                        alt=""
                        draggable={false}
                        referrerPolicy="origin"
                        className="absolute inset-0 size-full max-w-none object-cover transition-transform duration-700 ease-out group-hover/tile:scale-[1.04]"
                      />
                      {item.caption}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {children}
    </div>
  );
}

export default TiltedGridHero;
