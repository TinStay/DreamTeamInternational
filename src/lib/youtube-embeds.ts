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

// Portfolio defaults (used for categories without specific lists yet)
export const PORTFOLIO_DEFAULT_WIDE: YouTubeEmbed = {
  src: "https://www.youtube.com/embed/fznYCs6dvQI",
  title: "DreamTeam portfolio wide video",
};

export const PORTFOLIO_DEFAULT_SHORT: YouTubeEmbed = {
  src: "https://www.youtube.com/embed/ERFq46M0MJQ?si=RLc4e53ViJ_YqjN4",
  title: "DreamTeam portfolio short video",
};

// Construction category (16:9) - store exact embed src with si tokens as provided
export const CONSTRUCTION_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/8dw7O71wawY",
    title: "Construction (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/qizKXT8PDGY?si=_8yd3oeNoUS9wHvn",
    title: "Construction (wide) 2",
  },
  {
    src: "https://www.youtube.com/embed/rVMKCSCJfF4?si=ZqTARanF3e5hGzgl",
    title: "Construction (wide) 3",
  },
  {
    src: "https://www.youtube.com/embed/jdbcZ0noPI0?si=iagITF3S-W2QaeaK",
    title: "Construction (wide) 4",
  },
  {
    src: "https://www.youtube.com/embed/L-TYLYZO_Tc",
    title: "Construction (wide) 5",
  },
];

// Construction category (9:16 Shorts)
// Shorts embed technique: use /embed/VIDEO_ID (not /shorts/).
export const CONSTRUCTION_SHORT: YouTubeEmbed[] = [
  { src: "https://www.youtube.com/embed/wwhzehmqiAY", title: "Construction (short) 1" },
  { src: "https://www.youtube.com/embed/RssEcjOuIXQ", title: "Construction (short) 2" },
  { src: "https://www.youtube.com/embed/LnAw3nnzpbc", title: "Construction (short) 3" },
  { src: "https://www.youtube.com/embed/BhdbyyMSxy8", title: "Construction (short) 4" },
  { src: "https://www.youtube.com/embed/2OJ1YgUpzKo", title: "Construction (short) 5" },
  { src: "https://www.youtube.com/embed/O8zto3d9Xv4", title: "Construction (short) 6" },
];

// Avatars (mapped to "mascots" category in this app)
export const AVATARS_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/I6EmmL9u678",
    title: "Avatars (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/q4ZrE0VEzyE?si=-zzzksLE_b-N1OuL",
    title: "Avatars (wide) 2",
  },
  {
    src: "https://www.youtube.com/embed/MN3Y-LbeBAI?si=U8UspQdb6lJvWdZQ",
    title: "Avatars (wide) 3",
  },
  {
    src: "https://www.youtube.com/embed/xxigf7G2gVQ?si=fkoy2ur2vC3abdJk",
    title: "Avatars (wide) 4",
  },
  {
    src: "https://www.youtube.com/embed/jBjzJqQxa7k?si=b-GEwbcJPtYU6sin",
    title: "Avatars (wide) 5",
  },
];

/** Avatars / mascots category (9:16 Shorts) */
export const AVATARS_SHORT: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/i-0pVR3S1S8",
    title: "Avatars (short) 1",
  },
  {
    src: "https://www.youtube.com/embed/Gmux1tj5mlo",
    title: "Avatars (short) 2",
  },
  {
    src: "https://www.youtube.com/embed/-xfEuhvBUFc",
    title: "Avatars (short) 3",
  },
  {
    src: "https://www.youtube.com/embed/7ry0zuyIgrY",
    title: "Avatars (short) 4",
  },
  {
    src: "https://www.youtube.com/embed/XsKRWZRUeXw",
    title: "Avatars (short) 5",
  },
];

export const CARS_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/VYqnblPpknE",
    title: "Cars (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/NZEvmRdCyk4?si=gU-ezFmYxlLruDEC",
    title: "Cars (wide) 2",
  },
  {
    src: "https://www.youtube.com/embed/jnyQrfLk0Lo",
    title: "Cars (wide) 3",
  },
  {
    src: "https://www.youtube.com/embed/oEkHqaeBsik?si=Xutqw9O7FZkFwzwI",
    title: "Cars (wide) 4",
  },
  {
    src: "https://www.youtube.com/embed/BMoPhk-U35w?si=K36oEJh1RKLrh7iT",
    title: "Cars (wide) 5",
  },
];

/** Cars category (9:16 Shorts) */
export const CARS_SHORT: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/TilXvyDCSGc?si=cdO0hr4QfCUyJxPV",
    title: "Cars (short) 1",
  },
  {
    src: "https://www.youtube.com/embed/3hEz5IxQRiU",
    title: "Cars (short) 2",
  },
];

/** Кино Реклама / TV category (16:9) */
export const TV_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/ob_VQOeBP9Y",
    title: "Кино реклама (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/fznYCs6dvQI?si=4Hn-P0ozS1KgdFjX",
    title: "Кино реклама (wide) 2",
  },
  {
    src: "https://www.youtube.com/embed/L81ngoOb-Xg?si=FFJYN0GcjYE1fjnd",
    title: "Кино реклама (wide) 3",
  },
];

/** Кино Реклама / TV category (9:16 Shorts) */
export const TV_SHORT: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/xf3WQx89K08?si=_PlVQUSaBU4QWcAQ",
    title: "Кино реклама (short) 1",
  },
  {
    src: "https://www.youtube.com/embed/O7rSjOXZSwM?si=a9kVvbwH6fge68Hy",
    title: "Кино реклама (short) 2",
  },
  {
    src: "https://www.youtube.com/embed/ymzLC2ae6gw?si=BOct84jCEIHMRxzx",
    title: "Кино реклама (short) 3",
  },
  {
    src: "https://www.youtube.com/embed/UpA3ILk_Tm4",
    title: "Кино реклама (short) 4",
  },
  {
    src: "https://www.youtube.com/embed/qP5rhT5XtmM",
    title: "Кино реклама (short) 5",
  },
];

export const PRODUCT_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/dvqlJZPQynw",
    title: "Product (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/ZLld8y9aVzk?si=AZWoyOWCE1SJWVNs",
    title: "Product (wide) 2",
  },
  {
    src: "https://www.youtube.com/embed/db_4Us57TeE?si=6fho3tA9PPNaynKa",
    title: "Product (wide) 3",
  },
  {
    src: "https://www.youtube.com/embed/38pIUDtV83Q?si=cEQtYYMQapD8B_eU",
    title: "Product (wide) 4",
  },
  {
    src: "https://www.youtube.com/embed/_49Z32qr58Y?si=vIImdf220x8r23mY",
    title: "Product (wide) 5",
  },
  {
    src: "https://www.youtube.com/embed/OrgF3MCq9rQ?si=OuGw5LDYD7WmGwBv",
    title: "Product (wide) 6",
  },
  {
    src: "https://www.youtube.com/embed/FvysLofa9zU?si=jh4zybJsslEOX22g",
    title: "Product (wide) 7",
  },
  {
    src: "https://www.youtube.com/embed/jj_LSOIpg58?si=QBjjv2VuSji_a8WJ",
    title: "Product (wide) 8",
  },
  {
    src: "https://www.youtube.com/embed/6vIDrUkpPEM",
    title: "Product (wide) 9",
  },
];

/** Product category (9:16 Shorts) */
export const PRODUCT_SHORT: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/W_zkdem99bo",
    title: "Product (short) 1",
  },
  {
    src: "https://www.youtube.com/embed/Ufr8ZBXw9hk",
    title: "Product (short) 2",
  },
  {
    src: "https://www.youtube.com/embed/8yCJwRuoA9w",
    title: "Product (short) 3",
  },
  {
    src: "https://www.youtube.com/embed/lN3LHKoa6bg",
    title: "Product (short) 4",
  },
  {
    src: "https://www.youtube.com/embed/vh8dh2Oev80",
    title: "Product (short) 5",
  },
  {
    src: "https://www.youtube.com/embed/NItwP80QwJ4",
    title: "Product (short) 6",
  },
  {
    src: "https://www.youtube.com/embed/ERFq46M0MJQ?si=RLc4e53ViJ_YqjN4",
    title: "Product (short) 7",
  },
  {
    src: "https://www.youtube.com/embed/MxS7NWl22dU?si=urE_dho0NTRMi5D-",
    title: "Product (short) 8",
  },
  {
    src: "https://www.youtube.com/embed/T40vemPjBJY?si=0brqU6akCOkI5EfW",
    title: "Product (short) 9",
  },
  {
    src: "https://www.youtube.com/embed/sppnJ1zTcTg",
    title: "Product (short) 10",
  },
  {
    src: "https://www.youtube.com/embed/y9Sk-7PU89k",
    title: "Product (short) 11",
  },
  {
    src: "https://www.youtube.com/embed/U83f4Ku5xa4",
    title: "Product (short) 12",
  },
  {
    src: "https://www.youtube.com/embed/getNNKJZfaU",
    title: "Product (short) 13",
  },
];

/** Services category (16:9) */
export const SERVICES_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/TVGwnZG-ZLs",
    title: "Services (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/HDMaMXlJoxw?si=Wkfapvk8CF5sVqtw",
    title: "Services (wide) 2",
  },
  {
    src: "https://www.youtube.com/embed/3zcXNedV1-0?si=iRnK-AqVr02tErxW",
    title: "Services (wide) 3",
  },
  {
    src: "https://www.youtube.com/embed/OrgF3MCq9rQ?si=OuGw5LDYD7WmGwBv",
    title: "Services (wide) 4",
  },
  {
    src: "https://www.youtube.com/embed/oVU1PXHVZ8A",
    title: "Services (wide) 5",
  },
];

/** Services category (9:16 Shorts) */
export const SERVICES_SHORT: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/W5kSYsWeNog",
    title: "Services (short) 1",
  },
  {
    src: "https://www.youtube.com/embed/NmaniWHr2uk",
    title: "Services (short) 2",
  },
  {
    src: "https://www.youtube.com/embed/Mu5vTQYn4u4",
    title: "Services (short) 3",
  },
  {
    src: "https://www.youtube.com/embed/UvGVxF-zzOM?si=M2P3JfppgkDFgfyR",
    title: "Services (short) 4",
  },
  {
    src: "https://www.youtube.com/embed/mw9KUBHfkjM",
    title: "Services (short) 5",
  },
  {
    src: "https://www.youtube.com/embed/KNI6lZXqdzw",
    title: "Services (short) 6",
  },
];

/** Animated category (9:16 Shorts) */
export const ANIMATED_SHORT: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/oZ89ofdtlj0",
    title: "Animation (short) 1",
  },
  {
    src: "https://www.youtube.com/embed/5ceanpoMMDE",
    title: "Animation (short) 2",
  },
  {
    src: "https://www.youtube.com/embed/HnMiNTf3NGw",
    title: "Animation (short) 3",
  },
];

/** Animated category (16:9) */
export const ANIMATED_WIDE: YouTubeEmbed[] = [
  {
    src: "https://www.youtube.com/embed/kCNmslCsfkc",
    title: "Animation (wide) 1",
  },
  {
    src: "https://www.youtube.com/embed/w_Xi96J5Ky0",
    title: "Animation (wide) 2",
  },
];

