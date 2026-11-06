"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconLoader2, IconPlayerPlayFilled, IconX } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyMp4Url, bunnyPlayerEmbedSrc, type BunnyVideo } from "@/lib/bunny-stream";
import { PORTFOLIO_KEYS, filterPortfolio, resolvePortfolioFilter, type PortfolioFilter, type PortfolioItem } from "@/lib/portfolio-grid";
import { posterOf } from "@/lib/portfolio-videos";
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

/** The MP4 sizes to try, best first: not every film has them all (the music film stops at 480p). */
const FILM_HEIGHTS = [720, 480, 360] as const;

/** A Bunny film playing muted over its poster. It comes in once it really plays, and drops a size if a file is missing. */
function FilmPreview({ film, start }: { film: BunnyVideo; start: number }) {
  const [rung, setRung] = useState(start);
  const [playing, setPlaying] = useState(false);
  return (
    <video
      src={bunnyMp4Url(film, FILM_HEIGHTS[rung])}
      muted
      loop
      playsInline
      autoPlay
      aria-hidden
      onPlaying={() => setPlaying(true)}
      onError={() => setRung((current) => Math.min(current + 1, FILM_HEIGHTS.length - 1))}
      className={cn("absolute inset-0 size-full object-cover transition-opacity duration-500", playing ? "opacity-100" : "opacity-0")}
    />
  );
}

/** A YouTube clip playing muted over its poster, which stays until the player has loaded (a loading player is black). */
function YoutubePreview({ id, tall }: { id: string; tall: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <iframe
      src={`${YOUTUBE_EMBED_BASE}/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`}
      title=""
      aria-hidden
      tabIndex={-1}
      allow="autoplay; encrypted-media"
      onLoad={() => setLoaded(true)}
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 h-full -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-500",
        tall ? "w-[177.78%]" : "w-full",
        loaded ? "opacity-100" : "opacity-0"
      )}
    />
  );
}

/**
 * One tile of the grid: the film's poster in its own 16:9 or 9:16 frame. Every film plays muted in place - under the
 * pointer, or on a touch screen while it is the tile in the middle of the screen (`active`: one at a time, whichever its
 * source). A click opens the full player.
 */
function Tile({ item, active, label, playLabel, onOpen }: { item: PortfolioItem; active: boolean; label: string; playLabel: string; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [preview, setPreview] = useState(false);
  const coarse = useMediaQuery("(hover: none)");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const enter = () => {
    setHovered(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPreview(true), 200);
  };
  const leave = () => {
    setHovered(false);
    setPreview(false);
    if (timer.current) window.clearTimeout(timer.current);
  };

  const playing = coarse ? active : preview;

  return (
    <div
      data-tile={item.id}
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
      <img src={posterOf(item)} alt="" loading="lazy" referrerPolicy="origin" className="absolute inset-0 size-full object-cover" />

      {playing && item.film ? <FilmPreview film={item.film} start={coarse ? 1 : 0} /> : null}
      {playing && item.youtubeId ? <YoutubePreview id={item.youtubeId} tall={item.orientation === "tall"} /> : null}

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
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loaded = item !== null && loadedId === item.id;
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
              {/* The still and a spinner while the player loads: a bare black box reads as a film that will not play. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- video posters (Bunny's is referer-gated, YouTube's is a still) */}
              <img src={posterOf(item)} alt="" referrerPolicy="origin" className="absolute inset-0 size-full object-cover" />
              <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/35">
                <IconLoader2 className="size-10 animate-spin text-white" />
              </span>
              <iframe
                className={cn("absolute inset-0 h-full w-full transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
                onLoad={() => setLoadedId(item.id)}
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
 * On a touch screen: the tile nearest the middle of the screen once the page has stopped moving, the one that plays.
 * A wait after the last scroll event, so a fling through the grid starts no players on its way.
 */
function useCentreTile(enabled: boolean, tiles: unknown) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let timer = 0;
    const pick = () => {
      const middle = window.innerHeight / 2;
      let best: string | null = null;
      let distance = Infinity;
      document.querySelectorAll<HTMLElement>("[data-tile]").forEach((tile) => {
        const box = tile.getBoundingClientRect();
        const shown = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
        if (shown < box.height * 0.6) return;
        const away = Math.abs((box.top + box.bottom) / 2 - middle);
        if (away < distance) {
          distance = away;
          best = tile.dataset.tile ?? null;
        }
      });
      setActive(best);
    };
    const settle = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(pick, 250);
    };
    settle();
    window.addEventListener("scroll", settle, { passive: true });
    window.addEventListener("resize", settle);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", settle);
      window.removeEventListener("resize", settle);
    };
  }, [enabled, tiles]);
  return active;
}

/**
 * The portfolio page's body: the heading, a row of category chips (the same kinds of video as the home page's package
 * cards - `?category=<key>` picks one) and the films, in the order the team set in the admin dashboard, in a masonry grid
 * of 16:9 and 9:16 tiles that play in place.
 */
export function PortfolioGrid({ items: all }: { items: PortfolioItem[] }) {
  const { t } = useLanguage();
  const p = t.portfolio;
  const names = t.packages.items as Record<string, { title: string }>;
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [open, setOpen] = useState<PortfolioItem | null>(null);
  const columnCount = useColumns();
  const coarse = useMediaQuery("(hover: none)");

  const items = useMemo(() => filterPortfolio(all, filter), [all, filter]);
  const columns = useMemo(() => dealIntoColumns(items, columnCount), [items, columnCount]);
  const activeTile = useCentreTile(coarse, columns);
  // Named after the category on screen, so a film in several reads right in each.
  const labelOf = (item: PortfolioItem) => names[filter !== "all" && item.categories.includes(filter) ? filter : item.categories[0]]?.title ?? p.categories.all;

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
                <Tile key={item.id} item={item} active={item.id === activeTile} label={labelOf(item)} playLabel={p.play} onOpen={() => setOpen(item)} />
              ))}
            </div>
          ))}
        </div>
      )}

      <Lightbox item={open} label={open ? labelOf(open) : ""} closeLabel={p.close} onClose={() => setOpen(null)} />
    </section>
  );
}
