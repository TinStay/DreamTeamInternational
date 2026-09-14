/**
 * Case-study projects: home "Projects" section, `/projects` and
 * `/projects/[slug]`. Copy lives in the dictionaries under
 * `projects.items[id]`; this file holds identity data and numbers only.
 */
import type { BunnyVideo } from "@/lib/bunny-stream";

export const PROJECT_CATEGORY_KEYS = ["software", "products", "construction"] as const;
export type ProjectCategoryKey = (typeof PROJECT_CATEGORY_KEYS)[number];

export const PROJECT_STYLE_KEYS = ["animated", "realistic", "semi-realistic"] as const;
export type ProjectStyleKey = (typeof PROJECT_STYLE_KEYS)[number];

export const PROJECT_KEYS = [
  "boleron",
  "plasico",
  "mindguard",
  "emblema",
  "isupport",
  "osmo",
] as const;
export type ProjectKey = (typeof PROJECT_KEYS)[number];

export function isProjectKey(value: string): value is ProjectKey {
  return (PROJECT_KEYS as readonly string[]).includes(value);
}

export type ProjectPlatformKey = "youtube" | "instagram" | "tiktok" | "facebook";

export type ProjectPlatform = {
  key: ProjectPlatformKey;
  url: string;
  /** Campaign views on that platform; `null` = not tracked yet (renders "—"). */
  views: number | null;
};

/** A hosted clip a story can embed: a YouTube id or a Bunny Stream video. */
export type StoryClip = { youtube: string } | { bunny: BunnyVideo };

export type Project = {
  id: ProjectKey;
  category: ProjectCategoryKey;
  style: ProjectStyleKey;
  /** `PARTNERS` id when the client is also in the partners marquee (logo on the case study). */
  partnerId?: string;
  /**
   * YouTube id of the project video (card thumbnail, embed, "watch" link).
   * `null` renders a branded placeholder — fill in once the clip is published.
   */
  videoId: string | null;
  /**
   * Clip for the home showcase frame only - a stand-in that must NOT be
   * attributed to the client on the case study / cards. Falls back to `videoId`.
   */
  showcaseVideoId?: string;
  /** Aspect of the clip behind `videoId`; tall thumbnails get a centre crop. */
  orientation: "wide" | "tall";
  /** Start of the partnership, ISO `yyyy-mm-dd`; `null` hides the tile. */
  since: string | null;
  /** Where the campaign ran. */
  platforms: ProjectPlatform[];
  /**
   * Long-form case study ("story") data that is not copy (see `components/projects/story/`): `films` = one entry
   * per film in `projects.stories[id].films.items` (same order, Emblema) - the YouTube id (`null` = branded
   * placeholder until the clip is published) and its aspect; `clips` = the named clips a story embeds (Boleron,
   * Plasico) - YouTube or Bunny, `null` = placeholder.
   */
  story?: {
    films?: { videoId: string | null; orientation: "wide" | "tall" }[];
    clips?: Record<string, StoryClip | null>;
  };
  /** Brand accent pair — drives the scroll-showcase background for this project. */
  accent: [string, string];
};

const yt = (id: string, views: number | null = null): ProjectPlatform => ({
  key: "youtube",
  url: `https://www.youtube.com/watch?v=${id}`,
  views,
});

// TODO(content): `since` and every `views` are placeholders (null) until the
// real partnership dates / campaign numbers are confirmed with the clients.
export const PROJECTS: Project[] = [
  {
    id: "boleron",
    category: "software",
    style: "semi-realistic",
    partnerId: "boleron",
    videoId: "I6EmmL9u678", // "Boleron Гражданска Отговорност (Хоризонтално)"
    orientation: "wide",
    since: null,
    platforms: [yt("I6EmmL9u678")],
    // Story: the Shorts cut and the YouTube pre-roll are published; the Facebook / TikTok cuts show placeholders.
    story: { clips: { shorts: { youtube: "L4fGQjib0A8" }, youtube: { youtube: "j4cCnQ6rpq4" }, facebook: null, tiktok: null } },
    accent: ["#1d6fe0", "#22c1c3"],
  },
  {
    id: "plasico",
    category: "products",
    style: "realistic",
    partnerId: "plasico",
    videoId: "dvqlJZPQynw", // "Plasico 1"
    // Story: "Back to Work 4K" on Bunny Stream, the second film on YouTube.
    story: { clips: { film: { bunny: { library: "750681", id: "481d2093-0dc0-44db-bda4-4d562c20d8fe" } }, second: { youtube: "dvqlJZPQynw" } } },
    orientation: "wide",
    since: null,
    platforms: [yt("dvqlJZPQynw")],
    accent: ["#16a34a", "#a3e635"],
  },
  {
    id: "mindguard",
    category: "software",
    style: "animated",
    partnerId: "mindguard",
    videoId: null, // TODO(content): the Mindguard explainer is not on YouTube yet
    // Stand-in footage ("Map Animation") for the showcase tablet only - never shown as Mindguard's own video.
    showcaseVideoId: "kCNmslCsfkc",
    orientation: "wide",
    since: null,
    platforms: [],
    accent: ["#7c3aed", "#db2777"],
  },
  {
    id: "emblema",
    category: "construction",
    style: "realistic",
    partnerId: "emblema",
    videoId: "8dw7O71wawY", // "Aria Emblema 1"
    orientation: "wide",
    since: null,
    platforms: [yt("8dw7O71wawY")],
    accent: ["#b45309", "#f59e0b"],
    // Films 02 (vertical) and 03 get their ids once the clips are on YouTube.
    story: {
      films: [
        { videoId: "8dw7O71wawY", orientation: "wide" },
        { videoId: null, orientation: "tall" },
        { videoId: null, orientation: "wide" },
      ],
    },
  },
  {
    id: "isupport",
    category: "products",
    style: "semi-realistic",
    partnerId: "isupport",
    videoId: null, // TODO: not in the portfolio catalogue yet
    orientation: "wide",
    since: null,
    platforms: [],
    accent: ["#0e7490", "#22d3ee"],
  },
  {
    id: "osmo",
    category: "products",
    style: "realistic",
    partnerId: "osmo",
    videoId: "Ufr8ZBXw9hk", // "OSMO 1" (9:16)
    orientation: "tall",
    since: null,
    platforms: [yt("Ufr8ZBXw9hk")],
    accent: ["#e11d48", "#f97316"],
  },
];

/**
 * Home showcase line-up and order (the "case studies journey"): the five
 * brands with a bespoke scene in `components/projects/showcase-scenes.tsx`.
 * Everything in `PROJECTS` still lists on `/projects`.
 */
export const SHOWCASE_PROJECT_KEYS = ["boleron", "emblema", "mindguard", "plasico", "osmo"] as const satisfies readonly ProjectKey[];

export const SHOWCASE_PROJECTS: Project[] = SHOWCASE_PROJECT_KEYS.map(
  (key) => PROJECTS.find((project) => project.id === key)!
);

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.id === slug);
}

/** Sum of tracked platform views, or `null` when nothing is tracked yet. */
export function totalViews(project: Project): number | null {
  const tracked = project.platforms.filter((p) => p.views !== null);
  if (tracked.length === 0) return null;
  return tracked.reduce((sum, p) => sum + (p.views ?? 0), 0);
}

/** Whole months between `since` and today (display boundary only). */
export function partnershipMonths(since: string, now = new Date()): number {
  const start = new Date(since);
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}

/** Compact, locale-aware view count (e.g. "12.4K" / "12,4 хил."). */
export function formatViews(views: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    views
  );
}
