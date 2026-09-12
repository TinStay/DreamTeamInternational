import {
  ANIMATED_SHORT,
  ANIMATED_WIDE,
  AVATARS_SHORT,
  AVATARS_WIDE,
  CARS_SHORT,
  CARS_WIDE,
  CONSTRUCTION_SHORT,
  CONSTRUCTION_WIDE,
  PRODUCT_SHORT,
  PRODUCT_WIDE,
  SERVICES_SHORT,
  SERVICES_WIDE,
  TV_SHORT,
  TV_WIDE,
  type YouTubeEmbed,
} from "@/lib/youtube-embeds";

/** Portfolio category keys — must match `portfolio.categories` in the dictionaries. */
export const PORTFOLIO_CATEGORY_KEYS = [
  "construction",
  "mascots",
  "tv",
  "cars",
  "product",
  "services",
  "animated",
] as const;

export type PortfolioCategoryKey = (typeof PORTFOLIO_CATEGORY_KEYS)[number];

export function isPortfolioCategory(value: string): value is PortfolioCategoryKey {
  return (PORTFOLIO_CATEGORY_KEYS as readonly string[]).includes(value);
}

export type CategoryEmbeds = { wide: YouTubeEmbed[]; short: YouTubeEmbed[] };

const EMPTY: CategoryEmbeds = { wide: [], short: [] };

/** Full catalogue for a category tab (each list is newest first). */
export function embedsForCategory(category: string): CategoryEmbeds {
  switch (category) {
    case "construction":
      return { wide: CONSTRUCTION_WIDE, short: CONSTRUCTION_SHORT };
    case "mascots": // avatars
      return { wide: AVATARS_WIDE, short: AVATARS_SHORT };
    case "cars":
      return { wide: CARS_WIDE, short: CARS_SHORT };
    case "tv":
      return { wide: TV_WIDE, short: TV_SHORT };
    case "product":
      return { wide: PRODUCT_WIDE, short: PRODUCT_SHORT };
    case "services":
      return { wide: SERVICES_WIDE, short: SERVICES_SHORT };
    case "animated":
      return { wide: ANIMATED_WIDE, short: ANIMATED_SHORT };
    default:
      return EMPTY;
  }
}

/** Video id from an `/embed/ID?…` src, or null when the src is not a YouTube embed. */
export function youtubeIdFromEmbed(src: string): string | null {
  const match = src.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
  return match?.[1] ?? null;
}

/**
 * `hqdefault` exists for every video (unlike `maxresdefault`). It is 4:3 with
 * black bars, so render it with `object-cover` in the clip's real aspect ratio
 * (16:9 or 9:16) and the bars crop away exactly.
 */
export function youtubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export type PortfolioHighlight = {
  videoId: string;
  category: PortfolioCategoryKey;
  orientation: "wide" | "tall";
  thumbnail: string;
};

export const HIGHLIGHTS_PER_CATEGORY = 5;

/**
 * Top clips per category for the home-page teaser marquee. Category lists are
 * newest first, so the "top" clips are the leading entries; wide and short
 * formats are interleaved so the strip alternates 16:9 and 9:16 cards.
 */
export function portfolioHighlights(perCategory = HIGHLIGHTS_PER_CATEGORY): PortfolioHighlight[] {
  const seen = new Set<string>();

  return PORTFOLIO_CATEGORY_KEYS.flatMap((category) => {
    const { wide, short } = embedsForCategory(category);
    const picks: PortfolioHighlight[] = [];
    const longest = Math.max(wide.length, short.length);

    for (let i = 0; i < longest && picks.length < perCategory; i++) {
      const candidates: Array<[YouTubeEmbed | undefined, PortfolioHighlight["orientation"]]> = [
        [wide[i], "wide"],
        [short[i], "tall"],
      ];
      for (const [embed, orientation] of candidates) {
        if (!embed || picks.length >= perCategory) continue;
        const videoId = youtubeIdFromEmbed(embed.src);
        if (!videoId || seen.has(videoId)) continue;
        seen.add(videoId);
        picks.push({ videoId, category, orientation, thumbnail: youtubeThumbnailUrl(videoId) });
      }
    }

    return picks;
  });
}
