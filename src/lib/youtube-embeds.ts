export type YouTubeEmbed = {
  /** Full iframe src URL (no dynamic building). */
  src: string;
  /** Optional descriptive title for a11y */
  title?: string;
};

// Default allow/referrer policy we apply to all iframes.
export const YOUTUBE_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
export const YOUTUBE_REFERRER_POLICY = "strict-origin-when-cross-origin" as const;

export const HERO_EMBED: YouTubeEmbed = {
  // Hero video (16:9)
  src: "https://www.youtube.com/embed/aZ3llb8YVXE?si=HqE-1rIFNgBY5xLI&autoplay=1&mute=1&controls=0&loop=1&playlist=aZ3llb8YVXE&modestbranding=1&playsinline=1&rel=0&disablekb=1",
  title: "DreamTeam hero video",
};

// Portfolio defaults (used for categories without specific lists yet)
export const PORTFOLIO_DEFAULT_WIDE: YouTubeEmbed = {
  src: "https://www.youtube.com/embed/fznYCs6dvQI",
  title: "DreamTeam portfolio wide video",
};

export const PORTFOLIO_DEFAULT_SHORT: YouTubeEmbed = {
  src: "https://www.youtube.com/embed/ERFq46M0MJQ",
  title: "DreamTeam portfolio short video",
};

// Construction category (16:9) - store exact embed src with si tokens as provided
export const CONSTRUCTION_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/qizKXT8PDGY?si=_8yd3oeNoUS9wHvn",
    title: "Construction (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/rVMKCSCJfF4?si=ZqTARanF3e5hGzgl",
    title: "Construction (wide) 2",
  },
  {
    src: "https://www.youtube.com/embed/jdbcZ0noPI0?si=iagITF3S-W2QaeaK",
    title: "Construction (wide) 3",
  },
];

// Construction category (9:16 Shorts)
// Shorts embed technique: use /embed/VIDEO_ID (not /shorts/).
export const CONSTRUCTION_SHORT: YouTubeEmbed[] = [
  { src: "https://www.youtube.com/embed/RssEcjOuIXQ", title: "Construction (short) 1" },
  { src: "https://www.youtube.com/embed/LnAw3nnzpbc", title: "Construction (short) 2" },
  { src: "https://www.youtube.com/embed/BhdbyyMSxy8", title: "Construction (short) 3" },
  { src: "https://www.youtube.com/embed/2OJ1YgUpzKo", title: "Construction (short) 4" },
  { src: "https://www.youtube.com/embed/O8zto3d9Xv4", title: "Construction (short) 5" },
];

// Avatars (mapped to "mascots" category in this app)
export const AVATARS_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/q4ZrE0VEzyE?si=-zzzksLE_b-N1OuL",
    title: "Avatars (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/MN3Y-LbeBAI?si=U8UspQdb6lJvWdZQ",
    title: "Avatars (wide) 2",
  },
];

export const CARS_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/NZEvmRdCyk4?si=gU-ezFmYxlLruDEC",
    title: "Cars (wide) 1",
  },
];

export const TV_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/hRQa2VGSWJY?si=an88Ta35rPjWbcy4",
    title: "TV (wide) 1",
  },
];

export const PRODUCT_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/ZLld8y9aVzk?si=AZWoyOWCE1SJWVNs",
    title: "Product (wide) 1",
  },
];

