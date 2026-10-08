import type { BunnyVideo } from "@/lib/bunny-stream";
import { PACKAGE_FILMS } from "@/lib/package-films";
import { embedsForCategory, youtubeIdFromEmbed } from "@/lib/portfolio-highlights";

/**
 * The portfolio's categories - the same kinds of video as the home page's package cards (`packages.items`), in the same
 * order, so a card's "See examples" and the header's links land on the matching filter (`?category=<key>`).
 */
export const PORTFOLIO_KEYS = [
  "socialAds",
  "corporate",
  "tvAds",
  "productVideos",
  "brandMascots",
  "motionGraphics",
  "launchVideos",
  "explainerVideos",
  "ugcAds",
  "realEstate",
  "musicVideos",
] as const;

export type PortfolioKey = (typeof PORTFOLIO_KEYS)[number];
export type PortfolioFilter = PortfolioKey | "all";

export function isPortfolioKey(value: string): value is PortfolioKey {
  return (PORTFOLIO_KEYS as readonly string[]).includes(value);
}

/** Earlier links used the old category names; they land on the closest of the new ones. */
const LEGACY: Record<string, PortfolioFilter> = {
  all: "all",
  construction: "realEstate",
  mascots: "brandMascots",
  tv: "tvAds",
  cars: "productVideos",
  product: "productVideos",
  services: "corporate",
  animated: "motionGraphics",
};

/** The filter a `?category=` value stands for (anything unknown shows everything). */
export function resolvePortfolioFilter(value: string | null | undefined): PortfolioFilter {
  if (!value) return "all";
  if (isPortfolioKey(value)) return value;
  return LEGACY[value] ?? "all";
}

export type PortfolioItem = {
  id: string;
  category: PortfolioKey;
  orientation: "wide" | "tall";
  /** A film on Bunny Stream (plays on hover from its MP4) ... */
  film?: BunnyVideo;
  /** ... or a YouTube clip (its poster until opened). */
  youtubeId?: string;
};

/**
 * Where the existing YouTube clips go: each old category's wide (16:9) and short (9:16) lists, and the new category each
 * belongs to. Cars count as product videos, the "Mascots" tab (AI avatars) splits into mascots (wide) and UGC (short).
 * Change the mapping here, nothing else.
 */
const SOURCES: { from: string; wide: PortfolioKey; short: PortfolioKey }[] = [
  { from: "construction", wide: "realEstate", short: "realEstate" },
  { from: "mascots", wide: "brandMascots", short: "ugcAds" },
  { from: "tv", wide: "tvAds", short: "tvAds" },
  { from: "cars", wide: "productVideos", short: "productVideos" },
  { from: "product", wide: "productVideos", short: "productVideos" },
  { from: "services", wide: "corporate", short: "corporate" },
  { from: "animated", wide: "motionGraphics", short: "motionGraphics" },
];

function buildItems(): PortfolioItem[] {
  const seen = new Set<string>();
  const clips: PortfolioItem[] = [];
  const films: PortfolioItem[] = [];

  // The package films (one per kind of video that has one), 16:9.
  for (const key of PORTFOLIO_KEYS) {
    const film = PACKAGE_FILMS[key];
    if (film && !seen.has(film.id)) {
      seen.add(film.id);
      films.push({ id: `film-${film.id}`, category: key, orientation: "wide", film });
    }
  }

  // The YouTube clips, dealt out round-robin across the old categories so "All" is a real mix (newest first in each).
  const lists = SOURCES.map((source) => ({ source, ...embedsForCategory(source.from) }));
  const longest = Math.max(...lists.flatMap((l) => [l.wide.length, l.short.length]));
  for (let i = 0; i < longest; i++) {
    for (const { source, wide, short } of lists) {
      for (const [embed, orientation, category] of [
        [wide[i], "wide", source.wide],
        [short[i], "tall", source.short],
      ] as const) {
        if (!embed) continue;
        // A film hosted on Bunny sitting in a category's list (`iframe.mediadelivery.net/embed/<library>/<id>`).
        const bunnyMatch = embed.src.match(/mediadelivery\.net\/embed\/(\d+)\/([0-9a-f-]{36})/);
        if (bunnyMatch) {
          if (seen.has(bunnyMatch[2])) continue;
          seen.add(bunnyMatch[2]);
          clips.push({ id: `film-${bunnyMatch[2]}`, category, orientation, film: { library: bunnyMatch[1], id: bunnyMatch[2] } });
          continue;
        }
        const youtubeId = youtubeIdFromEmbed(embed.src);
        if (!youtubeId || seen.has(youtubeId)) continue;
        seen.add(youtubeId);
        clips.push({ id: `yt-${youtubeId}`, category, orientation, youtubeId });
      }
    }
  }

  // A film every seventh tile, so the new films are spread through the grid rather than piled in a corner.
  const merged: PortfolioItem[] = [];
  let c = 0;
  let f = 0;
  for (let n = 0; c < clips.length || f < films.length; n++) {
    if ((n % 7 === 2 && f < films.length) || c >= clips.length) merged.push(films[f++]);
    else merged.push(clips[c++]);
  }
  return merged;
}

const ITEMS = buildItems();

/** The tiles of a filter. "Social media ads" also shows every vertical clip (that is what social ads are). */
export function portfolioItems(filter: PortfolioFilter): PortfolioItem[] {
  if (filter === "all") return ITEMS;
  if (filter === "socialAds") return ITEMS.filter((item) => item.category === "socialAds" || item.orientation === "tall");
  return ITEMS.filter((item) => item.category === filter);
}
