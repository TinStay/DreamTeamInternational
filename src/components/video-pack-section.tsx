"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconPlayerPlayFilled } from "@tabler/icons-react";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyMp4Url, bunnyThumbnailUrl, type BunnyVideo } from "@/lib/bunny-stream";
import { VIDEO_PACK } from "@/lib/video-pack";
import { pricingPath } from "@/lib/routes";

/** The orange pearl, as ink (the headline). */
const PEARL_INK =
  "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent";

/**
 * The English home page's first screen, above the tiger hero and one screen tall: the "Get your AI video pack now"
 * headline in the orange pearl (Archivo, like the hero's) and its line, then a rail of wide 16:9 windows - one per kind of
 * video (`lib/video-pack.ts`) - that scrolls sideways, by swipe / trackpad or the round arrows at its ends (after the
 * client's Higgsfield reference). Each window's film plays muted and looping only while the window is mostly on
 * screen (`PackWindow`) and pauses as soon as it leaves, so one or two play at a time. Under the rail, on the right,
 * the two ways in: "Start with one video" (the orange pill) or a subscription.
 */
export function VideoPackSection() {
  const { t, language } = useLanguage();
  const p = t.videoPack;
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  // Which arrows make sense: none at the start / the end of the rail.
  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const start = rail.scrollLeft <= 4;
    const end = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [measure]);

  // One arrow press moves the rail by about one window.
  const step = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-pack-window]");
    const by = card ? card.offsetWidth + 20 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: direction * by, behavior: "smooth" });
  };

  return (
    // `--pack-w` - one window's width - is sized by the screen's height as well as its width, so the heading, the rail
    // and the actions fit one screen without scrolling (the rest of the section is about 26rem tall).
    <section
      id="video-pack"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-x-clip pt-24 pb-10 text-white [--pack-w:min(86vw,64rem,calc((100svh-26rem)*16/9))] max-md:[--pack-w:88vw]"
    >
      <div className="mx-auto w-full max-w-7xl px-6 text-center">
        <h2
          className={cn(
            "mx-auto font-heading text-[clamp(30px,3.8vw,60px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance",
            PEARL_INK
          )}
        >
          {p.title}
        </h2>
        <p className="mx-auto mt-4 max-w-[62ch] text-[clamp(15px,1.15vw,18px)] leading-normal text-white/70">{p.subtitle}</p>
      </div>

      <div className="relative mt-8 lg:mt-10">
        <div
          ref={railRef}
          onScroll={measure}
          className="flex snap-x snap-mandatory scroll-px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] gap-5 overflow-x-auto scroll-smooth px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {VIDEO_PACK.map((item) => (
            <PackWindow
              key={item.key}
              clip={item.clip}
              title={p.items[item.key].title}
              line={p.items[item.key].line}
              playingLabel={p.preview}
            />
          ))}
        </div>

        {/* The arrows sit over the rail's ends, on the windows' middle (16:9 of the window's width). */}
        <RailArrow side="left" hidden={edges.start} label={p.previous} onClick={() => step(-1)} />
        <RailArrow side="right" hidden={edges.end} label={p.next} onClick={() => step(1)} />
      </div>

      {/* The two ways in, on the right under the rail: one video (the one-time Personal order), or a subscription. */}
      <div className="mx-auto mt-6 flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 sm:justify-end">
        <TigerCta href={`${pricingPath(language)}?for=individual`} label={p.startOne} className="tiger-cta--orange" />
        <Link
          href={`${pricingPath(language)}?for=business`}
          className="group text-[15px] text-white/65 transition-colors duration-200 hover:text-white"
        >
          {p.orSubscribe}
          <span className="text-white/40"> — {p.pauseAnytime}</span>
          <IconArrowRight
            className="ms-1.5 inline size-4 align-[-2px] text-[#ff8a1f] transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>

    </section>
  );
}

function RailArrow({
  side,
  hidden,
  label,
  onClick,
}: {
  side: "left" | "right";
  hidden: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? IconChevronLeft : IconChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      className={cn(
        "absolute top-[calc(var(--pack-w)*0.28125)] z-10 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition-[opacity,transform,background-color] duration-200 ease-out hover:scale-110 hover:bg-black/80 md:flex",
        side === "left" ? "left-4" : "right-4",
        hidden && "pointer-events-none opacity-0"
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/**
 * One window: the film in a rounded 16:9 frame (its poster until it plays) with a Netflix-style caption on it - a
 * "Preview" tag, the title in Archivo uppercase (orange on hover) and its line, on a black gradient along the bottom.
 * The film is only fetched and played while the frame is at least 60% on screen (the rail's own clipping counts, so a
 * window scrolled off to the side stops too); it pauses where it was when it leaves.
 */
function PackWindow({
  clip,
  title,
  line,
  playingLabel,
}: {
  clip: BunnyVideo | null;
  title: string;
  line: string;
  /** The small tag above the title ("Preview"). */
  playingLabel: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScreen = useRef(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !clip) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        onScreen.current = entry.isIntersecting && !reduceMotion;
        if (onScreen.current) {
          // First time on screen: attach the film (nothing is downloaded before).
          setSrc((current) => current ?? bunnyMp4Url(clip, 720));
          void video?.play().catch(() => {});
        } else {
          video?.pause();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(frame);
    // The browser pauses a video on a hidden page (another tab): pick it up again when the page comes back.
    const onVisible = () => {
      if (document.visibilityState === "visible" && onScreen.current) void videoRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [clip]);

  // The film was just attached (the window came on screen): start it - `play()` is what makes a `preload="none"` video
  // load at all.
  useEffect(() => {
    if (src && onScreen.current) void videoRef.current?.play().catch(() => {});
  }, [src]);

  return (
    <article data-pack-window className="group w-[var(--pack-w)] shrink-0 snap-start">
      <div
        ref={frameRef}
        className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#141518] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)] transition-[transform,border-color] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-[#ff7a1a]/50"
      >
        {clip ? (
          <video
            ref={videoRef}
            src={src ?? undefined}
            poster={bunnyThumbnailUrl(clip)}
            muted
            loop
            playsInline
            preload="none"
            // Whichever comes last - coming on screen or the film being ready - starts it (a play() fired while the
            // file was still attaching could be lost on the first load).
            onLoadedData={(event) => {
              if (onScreen.current) void event.currentTarget.play().catch(() => {});
            }}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_20%,rgba(255,110,20,0.22),transparent_60%)]" />
        )}

        {/* Netflix-style caption over the film: a black, half-transparent gradient rising from the bottom, the title
            and its line on it, bottom-left - the line slides up a touch and the title turns orange on hover. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.55)_45%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
            <IconPlayerPlayFilled className="size-2.5 text-[#ff8a1f]" aria-hidden />
            {playingLabel}
          </p>
          <h3 className="font-heading text-2xl font-black uppercase leading-none tracking-tight transition-colors duration-200 group-hover:text-[#ff8a1f] sm:text-3xl lg:text-[2.25rem]">
            {title}
          </h3>
          <p className="mt-2 max-w-[46ch] text-sm text-white/80 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 sm:text-[15px]">
            {line}
          </p>
        </div>
      </div>
    </article>
  );
}
