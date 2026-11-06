import { describe, expect, it } from "vitest";
import { PORTFOLIO_KEYS, filterPortfolio, type PortfolioItem } from "@/lib/portfolio-grid";
import { itemFromRow, parseVideoLink, reorderWithin, rowFromItem, seedItems } from "@/lib/portfolio-videos";

const GUID = "1dd9d4d5-4459-48d5-9891-207b3bb9da5c";

describe("parseVideoLink", () => {
  it.each([
    ["https://www.youtube.com/watch?v=8dw7O71wawY", false],
    ["https://www.youtube.com/watch?list=PL1&v=8dw7O71wawY&t=3", false],
    ["https://youtu.be/8dw7O71wawY?si=abc", false],
    ["https://www.youtube-nocookie.com/embed/8dw7O71wawY?si=abc", false],
    ['<iframe src="https://www.youtube.com/embed/8dw7O71wawY" title="x"></iframe>', false],
    ["https://www.youtube.com/shorts/8dw7O71wawY", true],
  ])("reads the YouTube link %s", (link, tall) => {
    expect(parseVideoLink(link)).toEqual({ source: "youtube", id: "8dw7O71wawY", tall });
  });

  it.each([`https://player.mediadelivery.net/play/750681/${GUID}`, `https://iframe.mediadelivery.net/embed/750681/${GUID}?autoplay=true`])("reads the Bunny link %s", (link) => {
    expect(parseVideoLink(link)).toEqual({ source: "bunny", id: GUID, tall: false });
  });

  it.each(["", "hello", "https://vimeo.com/123456", `https://player.mediadelivery.net/play/111111/${GUID}`])("refuses %s", (link) => {
    expect(parseVideoLink(link)).toBeNull();
  });
});

describe("portfolio rows", () => {
  it("round-trips the seed: Bunny films only, no duplicates, every category filled", () => {
    const items = seedItems();
    expect(items.map((item) => itemFromRow(rowFromItem(item)))).toEqual(items);
    expect(items.every((item) => item.film)).toBe(true);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    for (const key of PORTFOLIO_KEYS) expect(filterPortfolio(items, key).length).toBeGreaterThan(0);
  });

  it("puts the iSupport film in all three of its categories", () => {
    const isupport = seedItems().find((item) => item.film?.id.startsWith("1dd9d4d5"));
    expect(isupport?.categories).toEqual(["productVideos", "launchVideos", "tvAds"]);
  });

  it("drops unknown categories, and a row left with none or with an unknown source", () => {
    expect(itemFromRow({ source: "youtube", video_id: "x", categories: ["tvAds", "nope"], orientation: "wide" })?.categories).toEqual(["tvAds"]);
    expect(itemFromRow({ source: "youtube", video_id: "x", categories: ["nope"], orientation: "wide" })).toBeNull();
    expect(itemFromRow({ source: "vimeo", video_id: "x", categories: ["tvAds"], orientation: "wide" })).toBeNull();
  });
});

describe("filterPortfolio", () => {
  const items: PortfolioItem[] = [
    { id: "a", categories: ["tvAds"], orientation: "wide", youtubeId: "a" },
    { id: "b", categories: ["tvAds", "socialAds"], orientation: "tall", youtubeId: "b" },
    { id: "c", categories: ["socialAds"], orientation: "wide", youtubeId: "c" },
  ];

  it("keeps the list's order and shows a film in each of its categories", () => {
    expect(filterPortfolio(items, "all").map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(filterPortfolio(items, "tvAds").map((i) => i.id)).toEqual(["a", "b"]);
    expect(filterPortfolio(items, "socialAds").map((i) => i.id)).toEqual(["b", "c"]);
  });
});

describe("reorderWithin", () => {
  const film = (id: string, category: PortfolioItem["categories"][number]): PortfolioItem => ({ id, categories: [category], orientation: "wide", youtubeId: id });
  const items = [film("a", "tvAds"), film("b", "corporate"), film("c", "tvAds"), film("d", "corporate"), film("e", "tvAds")];

  it("moves a category's films among their own places and leaves the rest alone", () => {
    const next = [items[4], items[0], items[2]];
    expect(reorderWithin(items, next).map((i) => i.id)).toEqual(["e", "b", "a", "d", "c"]);
  });

  it("takes the whole list as it is", () => {
    const next = [...items].reverse();
    expect(reorderWithin(items, next)).toEqual(next);
  });
});
