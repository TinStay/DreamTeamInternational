"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyMp4Url, bunnyThumbnailUrl, type BunnyVideo } from "@/lib/bunny-stream";
import { VIDEO_PACK } from "@/lib/video-pack";

/** The orange pearl, as ink (the headline). */
const PEARL_INK =
  "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent";

/**
 * The English home page's first screen, above the tiger hero and about as tall: a rail of wide 16:9 windows - one per kind of
 * video (`lib/video-pack.ts`) - that scrolls sideways, by swipe / trackpad or the round arrows at its ends (after the
 * client's Higgsfield reference). Each window's film plays muted and looping only while the window is mostly on
 * screen (`PackWindow`) and pauses as soon as it leaves, so one or two play at a time. Under the rail, the "Get your
 * AI video pack now" headline in the orange pearl (Archivo, like the hero's) and its line.
 */
export function VideoPackSection() {
  const { t } = useLanguage();
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
    <section id="video-pack" className="relative flex min-h-[100svh] flex-col justify-center overflow-x-clip pt-28 pb-16 text-white">
      <div className="relative">
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
            />
          ))}
        </div>

        {/* The arrows sit over the rail's ends, on the windows' middle (16:9 of the window's width). */}
        <RailArrow side="left" hidden={edges.start} label={p.previous} onClick={() => step(-1)} />
        <RailArrow side="right" hidden={edges.end} label={p.next} onClick={() => step(1)} />
      </div>

      <div className="mx-auto mt-14 w-full max-w-7xl px-6 text-center lg:mt-20">
        <h2
          className={cn(
            "mx-auto max-w-[18ch] font-heading text-[clamp(34px,5vw,84px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance",
            PEARL_INK
          )}
        >
          {p.title}
        </h2>
        <p className="mx-auto mt-6 max-w-[52ch] text-[clamp(16px,1.35vw,20px)] leading-normal text-white/70">{p.subtitle}</p>
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
        "absolute top-[calc(min(80vw,44rem)*0.28)] z-10 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition-[opacity,transform,background-color] duration-200 ease-out hover:scale-110 hover:bg-black/80 md:flex",
        side === "left" ? "left-4" : "right-4",
        hidden && "pointer-events-none opacity-0"
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/**
 * One window: the film in a rounded 16:9 frame (its poster until it plays), the title in Archivo uppercase - orange on
 * hover - and a line under it. The film is only fetched and played while the frame is at least 60% on screen (the
 * rail's own clipping counts, so a window scrolled off to the side stops too); it pauses where it was when it leaves.
 */
function PackWindow({ clip, title, line }: { clip: BunnyVideo | null; title: string; line: string }) {
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
    <article data-pack-window className="group w-[min(80vw,44rem)] shrink-0 snap-start">
      <div
        ref={frameRef}
        className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#141518] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)] transition-[transform,border-color] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-[#ff7a1a]/50"
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
      </div>
      <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight transition-colors duration-200 group-hover:text-[#ff8a1f] sm:text-xl">
        {title}
      </h3>
      <p className="mt-1 text-[15px] text-white/55">{line}</p>
    </article>
  );
}
