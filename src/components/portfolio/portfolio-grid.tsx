"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconPlayerPlayFilled, IconX } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyMp4Url, bunnyPlayerEmbedSrc, bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { PORTFOLIO_KEYS, portfolioItems, resolvePortfolioFilter, type PortfolioFilter, type PortfolioItem } from "@/lib/portfolio-grid";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import { YOUTUBE_EMBED_BASE } from "@/lib/youtube-embeds";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

/** Height of a tile relative to its width (16:9 and 9:16), for dealing the tiles into columns. */
const HEIGHT = { wide: 9 / 16, tall: 16 / 9 } as const;

/** The number of columns the grid uses at the current width (2 on a phone, up to 5 on a big screen). */
function useColumns() {
  const sm = useMediaQuery("(min-width: 640px)");
  const lg = useMediaQuery("(min-width: 1024px)");
  const xl = useMediaQuery("(min-width: 1536px)");
  return xl ? 5 : lg ? 4 : sm ? 3 : 2;
}

/** Deal the tiles into columns, each to the currently shortest one - a masonry that keeps the reading order. */
function dealIntoColumns(items: PortfolioItem[], count: number) {
  const columns: PortfolioItem[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);
  for (const item of items) {
    let target = 0;
    for (let i = 1; i < count; i++) if (heights[i] < heights[target] - 0.001) target = i;
    columns[target].push(item);
    heights[target] += HEIGHT[item.orientation];
  }
  return columns;
}

/** Reads `?category=` (wrapped in Suspense by the caller, which keeps the page static) and reports the filter. */
function FilterFromUrl({ onFilter }: { onFilter: (filter: PortfolioFilter) => void }) {
  const params = useSearchParams();
  const category = params.get("category");
  useEffect(() => {
    onFilter(resolvePortfolioFilter(category));
  }, [category, onFilter]);
  return null;
}

/**
 * One tile of the grid: the film's poster in its own 16:9 or 9:16 frame. A Bunny film plays muted on hover - or, on a
 * touch screen, while the tile is mostly on screen; a YouTube clip shows its preview after the pointer rests on it for a
 * moment. A click opens the full player.
 */
function Tile({ item, label, playLabel, onOpen }: { item: PortfolioItem; label: string; playLabel: string; onOpen: () => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [preview, setPreview] = useState(false);
  const [inView, setInView] = useState(false);
  const [filmPlaying, setFilmPlaying] = useState(false);
  const coarse = useMediaQuery("(hover: none)");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !coarse) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.6 });
    io.observe(frame);
    return () => io.disconnect();
  }, [coarse]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const enter = () => {
    setHovered(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPreview(true), 350);
  };
  const leave = () => {
    setHovered(false);
    setPreview(false);
    if (timer.current) window.clearTimeout(timer.current);
  };

  const playFilm = Boolean(item.film) && (coarse ? inView : preview);
  const showYoutube = Boolean(item.youtubeId) && !coarse && preview;
  const poster = item.film ? bunnyThumbnailUrl(item.film) : youtubeThumbnailUrl(item.youtubeId as string);

  return (
    <div
      ref={frameRef}
      onPointerEnter={(event) => event.pointerType === "mouse" && enter()}
      onPointerLeave={(event) => event.pointerType === "mouse" && leave()}
      onFocus={enter}
      onBlur={leave}
      className={cn(
        "group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#141518] transition-[border-color] duration-300 ease-out hover:border-white/30",
        item.orientation === "tall" ? "aspect-[9/16]" : "aspect-video"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- video posters (Bunny's is referer-gated, YouTube's is a still) */}
      <img src={poster} alt="" loading="lazy" referrerPolicy="origin" className="absolute inset-0 size-full object-cover" />

      {item.film && playFilm ? (
        <video
          src={bunnyMp4Url(item.film, coarse ? 480 : 720)}
          muted
          loop
          playsInline
          autoPlay
          aria-hidden
          onPlaying={() => setFilmPlaying(true)}
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-500", filmPlaying ? "opacity-100" : "opacity-0")}
        />
      ) : null}

      {showYoutube ? (
        <iframe
          src={`${YOUTUBE_EMBED_BASE}/${item.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.youtubeId}&playsinline=1&modestbranding=1&rel=0`}
          title=""
          aria-hidden
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2 border-0 data-[tall=false]:w-full"
          data-tall={item.orientation === "tall"}
        />
      ) : null}

      {/* A soft shade along the foot, and the label + a play mark that come up on hover / focus. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100" />
      <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        {label}
      </span>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white text-black opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100",
          hovered && "scale-100"
        )}
      >
        <IconPlayerPlayFilled className="ml-0.5 size-4" />
      </span>

      <button type="button" onClick={onOpen} aria-label={`${playLabel}: ${label}`} className="absolute inset-0 z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a1f]" />
    </div>
  );
}

/** The full player over the page (Escape / the backdrop / the X close it). */
function Lightbox({ item, label, closeLabel, onClose }: { item: PortfolioItem | null; label: string; closeLabel: string; onClose: () => void }) {
  const tall = item?.orientation === "tall";
  return (
    <Dialog open={item !== null} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-none gap-0 rounded-2xl border-0 bg-black p-0 ring-white/15 sm:max-w-none",
          tall ? "w-[min(92vw,calc(88vh*9/16))]" : "w-[min(96vw,72rem)]"
        )}
      >
        {item ? (
          <>
            <DialogTitle className="sr-only">{label}</DialogTitle>
            {/* First in the DOM, so initial focus lands here and Escape reaches the page (a focused player would swallow it). */}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="absolute -top-3 -right-3 z-[1] grid size-11 cursor-pointer place-items-center rounded-full bg-white text-neutral-900 shadow-lg transition-transform duration-200 ease-out hover:scale-105 sm:-top-4 sm:-right-4"
            >
              <IconX className="size-5" aria-hidden />
            </button>
            <div className={cn("relative w-full overflow-hidden rounded-2xl bg-black", tall ? "aspect-[9/16]" : "aspect-video")}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={item.film ? bunnyPlayerEmbedSrc(item.film, { autoplay: true }) : `${YOUTUBE_EMBED_BASE}/${item.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={label}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The portfolio page's body: the heading, a row of category chips (the same kinds of video as the home page's package
 * cards - `?category=<key>` picks one) and the films in a masonry grid of 16:9 and 9:16 tiles that play on hover.
 */
export function PortfolioGrid() {
  const { t } = useLanguage();
  const p = t.portfolio;
  const names = t.packages.items as Record<string, { title: string }>;
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [open, setOpen] = useState<PortfolioItem | null>(null);
  const columnCount = useColumns();

  const items = useMemo(() => portfolioItems(filter), [filter]);
  const columns = useMemo(() => dealIntoColumns(items, columnCount), [items, columnCount]);
  const labelOf = (item: PortfolioItem) => names[item.category]?.title ?? p.categories.all;

  const choose = (next: PortfolioFilter) => {
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(null, "", url);
  };

  const chips: { key: PortfolioFilter; label: string }[] = [
    { key: "all", label: p.categories.all },
    ...PORTFOLIO_KEYS.map((key) => ({ key: key as PortfolioFilter, label: names[key].title })),
  ];

  return (
    <section className="relative px-[max(1.25rem,3vw)] text-white">
      <Suspense fallback={null}>
        <FilterFromUrl onFilter={setFilter} />
      </Suspense>

      <header className="max-w-3xl">
        <h1 className="font-heading text-[clamp(32px,4.6vw,72px)] leading-[0.95] font-black uppercase tracking-[-0.01em] text-balance">
          {p.title1} <span className="text-section-accent">{p.title2}</span>
        </h1>
        <p className="mt-4 max-w-[62ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/65">{p.subtitle}</p>
      </header>

      {/* On a phone the chips are one swipeable line (bleeding to the screen edges); from sm they wrap. */}
      <nav
        aria-label={p.eyebrow}
        className="-mx-[max(1.25rem,3vw)] mt-8 flex gap-2 overflow-x-auto px-[max(1.25rem,3vw)] pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:mt-10 [&::-webkit-scrollbar]:hidden"
      >
        {chips.map((chip) => {
          const active = chip.key === filter;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => choose(chip.key)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a1f]",
                active
                  ? "border-transparent bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_50%,#ffb066_100%)] text-white shadow-[0_8px_24px_-10px_rgba(255,106,20,0.8)]"
                  : "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white"
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <p className="mt-16 text-white/60">{p.empty}</p>
      ) : (
        <div className="mt-8 flex items-start gap-3 lg:mt-10">
          {columns.map((column, index) => (
            <div key={index} className="flex min-w-0 flex-1 flex-col gap-3">
              {column.map((item) => (
                <Tile key={item.id} item={item} label={labelOf(item)} playLabel={p.play} onOpen={() => setOpen(item)} />
              ))}
            </div>
          ))}
        </div>
      )}

      <Lightbox item={open} label={open ? labelOf(open) : ""} closeLabel={p.close} onClose={() => setOpen(null)} />
    </section>
  );
}
