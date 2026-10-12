"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import Image from "next/image";
import { ClipLightbox, MOTION_PAGE_BAR } from "@/components/projects/story/primitives";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { HOME_VSL } from "@/lib/video-pack";
import { useHydrated } from "@/lib/use-media-query";

/** The localStorage key under which an animated page (a Claude Design motion export) keeps its playhead. */
const MOTION_PAGE_TIME_KEY = "animstage-v3:t";

/**
 * The video sales letter (`HOME_VSL`, `lib/video-pack.ts`) as a bare 16:9 frame - **no overlay**: no caption, no play
 * disc, nothing over the picture. An animated page plays live in it (`VslPagePreview`); a Bunny film shows its poster. The
 * whole frame is the button (it lifts on hover) and a click opens it full size in `ClipLightbox` - a page with its own
 * play bar, from the start. `null` shows a quiet "video coming soon" frame. Used in "How it works".
 */
export function VslPlayer({ className }: { className?: string }) {
  const { t } = useLanguage();
  const copy = t.videoPack.vsl;
  const [open, setOpen] = useState(false);
  const source = HOME_VSL;
  const frame =
    "relative block aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0b] shadow-[0_30px_80px_-30px_rgba(255,106,20,0.4),0_24px_60px_-30px_rgba(0,0,0,0.9)]";

  if (!source) {
    return (
      <div role="img" aria-label={`${copy.title} - ${copy.soon}`} className={cn(frame, "grid place-items-center", className)}>
        <span className="text-sm text-white/50">{copy.soon}</span>
      </div>
    );
  }

  const panel = source.kind === "page" ? { page: source.src, title: copy.title } : { clip: source.clip, title: copy.title };
  const play = () => {
    // An animated page remembers where it was (its own localStorage key); the full-size one starts from the top.
    try {
      localStorage.removeItem(MOTION_PAGE_TIME_KEY);
    } catch {}
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={play}
        aria-label={`${copy.play}: ${copy.title}`}
        className={cn(
          frame,
          "cursor-pointer transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[#ff8a1f]/50 hover:shadow-[0_36px_90px_-30px_rgba(255,106,20,0.55),0_24px_60px_-30px_rgba(0,0,0,0.9)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff8a1f]",
          className,
        )}
      >
        {source.kind === "page" ? (
          <VslPagePreview src={source.src} poster={source.poster} paused={open} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- the Bunny poster's pull zone is referer-gated, never optimised
          <img src={bunnyThumbnailUrl(source.clip)} alt="" referrerPolicy="origin" className="absolute inset-0 size-full object-cover" />
        )}
      </button>
      <ClipLightbox panel={open ? panel : null} closeLabel={t.videoPack.close} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * An animated page (a Claude Design motion export, same-origin under `public/`) playing live and muted in the frame:
 * - **the poster first** - the iframe is mounted only once the page has finished loading and the frame is near the screen
 *   (the piece is a 7 MB page that unpacks itself), and unmounted while the frame is off screen or the lightbox shows it
 *   full size; the poster fades out once the piece's picture is in the document;
 * - **its play bar clipped away**: the page draws a 16:9 picture over a 44px bar (MOTION_PAGE_BAR), so the iframe runs
 *   that much taller than the frame, which clips it - the picture fills the frame exactly;
 * - it never takes a click or focus (`pointer-events-none`, `tabIndex -1`, hidden from screen readers): the frame is the
 *   button. Reduced motion keeps the poster alone.
 */
function VslPagePreview({ src, poster, paused }: { src: string; poster: string; paused?: boolean }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const inView = useInView(boxRef, { margin: "300px" });
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const mount = hydrated && loaded && inView && !paused && !reduce;

  // Wait for the page's own load, so the piece never competes with the first screen.
  useEffect(() => {
    if (document.readyState === "complete") {
      const t = window.setTimeout(() => setLoaded(true), 300);
      return () => window.clearTimeout(t);
    }
    const onLoad = () => setLoaded(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // The poster stays until the piece has drawn its picture (it unpacks itself after its document loads).
  useEffect(() => {
    if (!mount) return;
    const id = window.setInterval(() => {
      const doc = frameRef.current?.contentDocument;
      if (doc?.querySelector("svg[data-om-exportable-video-with-duration-secs]")) {
        window.clearInterval(id);
        window.setTimeout(() => setReady(true), 250);
      }
    }, 200);
    return () => {
      window.clearInterval(id);
      setReady(false);
    };
  }, [mount]);

  return (
    <span ref={boxRef} aria-hidden className="absolute inset-0 overflow-hidden bg-[#0a0a0b]">
      {mount ? (
        <iframe
          ref={frameRef}
          src={src}
          title=""
          tabIndex={-1}
          className="pointer-events-none absolute inset-x-0 top-0 w-full border-0"
          style={{ height: `calc(100% + ${MOTION_PAGE_BAR}px)` }}
        />
      ) : null}
      <Image
        src={poster}
        alt=""
        fill
        sizes="(min-width: 1024px) 55vw, 100vw"
        className={cn("object-cover transition-opacity duration-500", ready && mount ? "opacity-0" : "opacity-100")}
      />
    </span>
  );
}
