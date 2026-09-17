/**
 * Case-study projects: home "Projects" section, `/projects` and
 * `/projects/[slug]`. Copy lives in the dictionaries under
 * `projects.items[id]`; this file holds identity data and numbers only.
 */
import { bunny, type BunnyVideo } from "@/lib/bunny-stream";

export const PROJECT_CATEGORY_KEYS = ["software", "products", "construction"] as const;
export type ProjectCategoryKey = (typeof PROJECT_CATEGORY_KEYS)[number];

export const PROJECT_STYLE_KEYS = ["animated", "realistic", "semi-realistic"] as const;
export type ProjectStyleKey = (typeof PROJECT_STYLE_KEYS)[number];

export const PROJECT_KEYS = [
  "boleron",
  "plasico",
  "mindguard",
  "emblema",
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
   * The project's own clip on Bunny Stream, for a project whose film is not on YouTube: the cards' poster +
   * background player and the showcase frame use it in `videoId`'s place (`videoId` wins when both exist).
   */
  clip?: BunnyVideo;
  /**
   * Clip for the home showcase frame only - a stand-in that must NOT be
   * attributed to the client on the case study / cards. Falls back to `clip`, then `videoId`.
   */
  showcaseVideoId?: string;
  /** A Bunny clip for the home showcase frame (preferred over `showcaseVideoId`); MindGuard's UI/UX film. */
  showcaseClip?: BunnyVideo;
  /**
   * The generic case study's ground in the client's colours (light / dark theme) - a project with a long-form story
   * paints its own (see `StoryShell`).
   */
  world?: { light: string; dark: string; accent: string };
  /** Aspect of the clip behind `videoId`; tall thumbnails get a centre crop. */
  orientation: "wide" | "tall";
  /** Start of the partnership, ISO `yyyy-mm-dd`; `null` hides the tile. */
  since: string | null;
  /** Where the campaign ran. */
  platforms: ProjectPlatform[];
  /**
   * Long-form case study ("story") data that is not copy (see `components/projects/story/`): `films` = one entry
   * per film in `projects.stories[id].films.items` (same order, Emblema) - the clip (`null` = branded
   * placeholder until it is published) and its aspect; `clips` = the named clips a story embeds (Boleron,
   * Plasico, MindGuard, OSMO) - YouTube or Bunny, `null` = placeholder.
   */
  story?: {
    films?: { clip: StoryClip | null; orientation: "wide" | "tall" }[];
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
    // Story: everything on Bunny Stream - the TV spot, the three vertical cuts in the social phones, the film
    // beside the character section and the one in the YouTube section (the client's picks: the same clips as
    // two of the ads), and the eight product ads (all 16:9) keyed by product, in `AD_KEYS` order on the page.
    story: {
      clips: {
        tv: { bunny: { library: "750681", id: "da5e80fb-24ce-40d1-98a7-c0c56f96ac2a" } }, // "Boleron TV 3"
        shorts: { bunny: { library: "750681", id: "dc6e898d-c894-427a-8b33-ab5fb7cbe899" } }, // "Boleron Автокаско 3 Vertical"
        facebook: { bunny: { library: "750681", id: "315b0817-c32b-49aa-9bfe-cc03cbd08c97" } }, // "Boleron - Автокаско 4 (вертикално)"
        tiktok: { bunny: { library: "750681", id: "8f2d311f-ca79-4658-9585-18891c4b991d" } }, // "Гражданска отговорност - вертикално"
        character: { bunny: { library: "750681", id: "d3c562b7-d5e9-4a8b-979c-0619227e97bf" } }, // "Гражданска 2" (= liability2)
        youtube: { bunny: { library: "750681", id: "aeb0681d-6e2f-4aff-bfc7-463e87c443f4" } }, // "Гражданска Отговорност 3 - Хоризонтално 4k" (= liability3)
        summer: { bunny: { library: "750681", id: "879d538c-1bb4-46d3-bbd0-6bd9d3cab9eb" } }, // "Boleron - Лятна Реклама"
        casco4: { bunny: { library: "750681", id: "57df0c8a-c7aa-46cc-a581-b71019803c70" } }, // "Boleron - Автокаско 4"
        liability3: { bunny: { library: "750681", id: "aeb0681d-6e2f-4aff-bfc7-463e87c443f4" } }, // "Гражданска Отговорност 3 - Хоризонтално 4k"
        property: { bunny: { library: "750681", id: "73680a1c-ff29-44a4-b248-07511785b74b" } }, // "Имуществена Застраховка Хоризонтално"
        travel: { bunny: { library: "750681", id: "84014d4f-6f5f-418c-8541-36fd7fcf93cf" } }, // "Пътуване в чужбина - horizontal"
        liabilityApp: { bunny: { library: "750681", id: "a12ed819-ef01-4098-bc7a-5dee4249be56" } }, // "Boleron Гражданска Интерфейс (horizontal)"
        casco3: { bunny: { library: "750681", id: "566606d5-c770-4397-b712-3523dd07bbc6" } }, // "Boleron Автокаско 3"
        liability2: { bunny: { library: "750681", id: "d3c562b7-d5e9-4a8b-979c-0619227e97bf" } }, // "Гражданска 2"
      },
    },
    accent: ["#1d6fe0", "#22c1c3"],
  },
  {
    id: "plasico",
    category: "products",
    style: "realistic",
    partnerId: "plasico",
    videoId: "dvqlJZPQynw", // "Plasico 1"
    // The home showcase frame plays the "Back to Work 4K" ad from Bunny Stream.
    showcaseClip: bunny("481d2093-0dc0-44db-bda4-4d562c20d8fe"),
    // Story: the three ads in the order they were made, all on Bunny Stream - "Back to Work 4K" (the office one,
    // 16:9), "Back to School" (the vertical 9:16 cut, with subtitles) and the "Hot Summer Sale" spot.
    story: {
      clips: {
        first: { bunny: { library: "750681", id: "481d2093-0dc0-44db-bda4-4d562c20d8fe" } },
        second: { bunny: { library: "750681", id: "9bbc728d-de27-4404-994c-3f987516db83" } },
        third: { bunny: { library: "750681", id: "eeaa9212-f44d-4d7c-b69a-b3054c758eed" } },
      },
    },
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
    videoId: null, // the films are on Bunny Stream, not YouTube - see `clip` and `story.clips`
    // The PR film (the one presented to Prof. Klaus Schwab) - the cards' poster + player.
    clip: bunny("dbb13635-0fda-4d13-8ff6-1a832cbc54af"),
    // The showcase tablet plays the UI/UX film (the interface, made for TV).
    showcaseClip: bunny("973736cf-0b6c-417e-b0fe-45c5e2dfa14b"),
    // Story: the four films of the client's case study - the PR film (the presentation to Klaus Schwab), the user
    // film (the presentation to the President of Switzerland), the UI/UX film (the 1+1 TV presentation) and the
    // TV segment on Ukraine's national TV (under it).
    story: {
      clips: {
        pr: { bunny: { library: "750681", id: "dbb13635-0fda-4d13-8ff6-1a832cbc54af" } },
        president: { bunny: { library: "750681", id: "067fb3bd-0528-4972-bfba-5e0007f2e7c3" } },
        tv: { bunny: { library: "750681", id: "973736cf-0b6c-417e-b0fe-45c5e2dfa14b" } },
        broadcast: { bunny: { library: "750681", id: "e9ebc942-97c4-4b00-8609-9b85f695f274" } },
      },
    },
    // The platform's own colours (mymindguard.ai): charcoal, teal - and the teal on a whisper-of-teal white.
    world: { light: "#F3F7F7", dark: "#0E1116", accent: "#45A199" },
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
    // The three films on Bunny Stream, in the order of `stories.emblema.films.items`: "Eria Video 1 - Movie
    // Style" (4K, wide), then the two vertical social cuts - "Eria Video 3" (the cyclist, "Повече място за живот")
    // under the second item and "Eria Video 2" (the family in the park) under the third, the client's order.
    // NOTE(content): the third item's copy still describes the District Living film - both vertical clips are
    // ERIA social cuts.
    story: {
      films: [
        { clip: { bunny: { library: "750681", id: "28f54810-3c7b-4beb-9a0a-f6f0926323d5" } }, orientation: "wide" },
        { clip: { bunny: { library: "750681", id: "d491c5e2-2f68-489b-8318-bdae7816a1a9" } }, orientation: "tall" },
        { clip: { bunny: { library: "750681", id: "521631f9-1eb7-4dca-a39d-603bf7d61c3f" } }, orientation: "tall" },
      ],
    },
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
    // Story: the four product films on Bunny Stream (4:5, 9:16, 4:5, 4:5 - their real frames), in the order of
    // `stories.osmo.products`.
    story: {
      clips: {
        lazur: { bunny: { library: "750681", id: "41c9be58-ac47-425a-9b93-240185214c08" } }, // "1. Лазурно Масло Осмо" (1080×1350)
        singleCoat: { bunny: { library: "750681", id: "ec95a6f3-740c-4f12-ab67-b9d71647d558" } }, // "2. Еднослоен Лазур" (608×1088)
        uv: { bunny: { library: "750681", id: "49a2ee2c-e8ee-4549-b934-7b39fffaace8" } }, // "3. УВ Защитно Масло" (1080×1340)
        decking: { bunny: { library: "750681", id: "77afdafa-a4c2-48fa-8e08-ef9a8ef6b269" } }, // "4. Decking Масло" (2048×2560)
      },
    },
    accent: ["#e11d48", "#f97316"],
  },
];

/**
 * Home showcase line-up and order (the "case studies journey"): the five
 * brands with a bespoke scene in `components/projects/showcase-scenes.tsx`.
 * Everything in `PROJECTS` still lists on `/projects`.
 */
export const SHOWCASE_PROJECT_KEYS = ["boleron", "emblema", "mindguard", "plasico", "osmo"] as const satisfies readonly ProjectKey[];
export type ShowcaseProjectKey = (typeof SHOWCASE_PROJECT_KEYS)[number];

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
