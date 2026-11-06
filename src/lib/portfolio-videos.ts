import { bunny, bunnyPlayerEmbedSrc, bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { isPortfolioKey, type PortfolioItem, type PortfolioKey } from "@/lib/portfolio-grid";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import { PORTFOLIO_SEED } from "@/lib/portfolio-seed";

/** A row of `portfolio_videos` (`supabase/portfolio.sql`), in the order the page shows them. */
export type PortfolioRow = {
  source: "youtube" | "bunny";
  video_id: string;
  categories: PortfolioKey[];
  orientation: "wide" | "tall";
};

export function itemFromRow(row: { source: unknown; video_id: unknown; categories: unknown; orientation: unknown }): PortfolioItem | null {
  const id = String(row.video_id ?? "");
  const categories = (Array.isArray(row.categories) ? row.categories : []).filter((key): key is PortfolioKey => isPortfolioKey(String(key)));
  if (!id || categories.length === 0) return null;
  const orientation = row.orientation === "tall" ? "tall" : "wide";
  if (row.source === "bunny") return { id: `film-${id}`, categories, orientation, film: bunny(id) };
  if (row.source === "youtube") return { id: `yt-${id}`, categories, orientation, youtubeId: id };
  return null;
}

export function rowFromItem(item: PortfolioItem): PortfolioRow {
  return {
    source: item.film ? "bunny" : "youtube",
    video_id: item.film ? item.film.id : (item.youtubeId as string),
    categories: item.categories,
    orientation: item.orientation,
  };
}

export type ParsedVideoLink = { source: "youtube" | "bunny"; id: string; tall: boolean };

const GUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const YOUTUBE = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^\s"']*&)?v=|(shorts)\/|embed\/|live\/))([A-Za-z0-9_-]{11})/;
const BUNNY = new RegExp(`mediadelivery\\.net/(?:play|embed)/(\\d+)/(${GUID})`, "i");

/**
 * The film a pasted link stands for: any YouTube link (watch, youtu.be, Shorts, an embed) or a Bunny Stream share link -
 * an `<iframe>` code works too, the address is read out of it. `null` for anything else, and for a Bunny film from
 * another library, whose poster and MP4s the site's pull zone cannot serve. A Shorts link is known to be vertical.
 */
export function parseVideoLink(text: string): ParsedVideoLink | null {
  const youtube = text.match(YOUTUBE);
  if (youtube) return { source: "youtube", id: youtube[2], tall: youtube[1] === "shorts" };
  const film = text.match(BUNNY);
  if (film && film[1] === bunny(film[2]).library) return { source: "bunny", id: film[2].toLowerCase(), tall: false };
  return null;
}

/** The list as it stands in the code (`PORTFOLIO_SEED`). */
export function seedItems(): PortfolioItem[] {
  return PORTFOLIO_SEED.flatMap((row) => itemFromRow(row) ?? []);
}

/** The film's still. */
export function posterOf(item: PortfolioItem) {
  return item.film ? bunnyThumbnailUrl(item.film) : youtubeThumbnailUrl(item.youtubeId as string);
}

/** Where the film can be watched on its own. */
export function watchUrlOf(item: PortfolioItem) {
  return item.film ? bunnyPlayerEmbedSrc(item.film) : `https://www.youtube.com/watch?v=${item.youtubeId}`;
}

/** A new order of some of the films (a category's): they swap among the places they hold, the others do not move. */
export function reorderWithin(items: PortfolioItem[], next: PortfolioItem[]): PortfolioItem[] {
  const moved = new Set(next.map((item) => item.id));
  let index = 0;
  return items.map((item) => (moved.has(item.id) ? next[index++] : item));
}
