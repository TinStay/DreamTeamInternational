import type { BunnyVideo } from "@/lib/bunny-stream";

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
  /** Where the film shows: one category or several, the first one naming it under "All". */
  categories: PortfolioKey[];
  orientation: "wide" | "tall";
  /** A film on Bunny Stream (plays on hover from its MP4) ... */
  film?: BunnyVideo;
  /** ... or a YouTube clip (its poster until opened). */
  youtubeId?: string;
};

/** The tiles of a filter, in the list's order. */
export function filterPortfolio(items: PortfolioItem[], filter: PortfolioFilter): PortfolioItem[] {
  return filter === "all" ? items : items.filter((item) => item.categories.includes(filter));
}
