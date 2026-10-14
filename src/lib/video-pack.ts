import { bunny, type BunnyVideo } from "@/lib/bunny-stream";

/**
 * The "Get your AI video pack" rail on the English home page (`components/video-pack-section.tsx`): one window per kind
 * of video, in this order; titles and lines in the dictionary under `videoPack.items[key]`.
 *
 * `clip` is the film the window plays (a 16:9 Bunny Stream clip - its 720p MP4 and its poster): replace the id, or set
 * `null` for a branded empty window.
 */
export const VIDEO_PACK_KEYS = ["socialAds", "tvAds", "corporate", "brandCampaigns", "ugc"] as const;
export type VideoPackKey = (typeof VIDEO_PACK_KEYS)[number];

/**
 * Where the video sales letter comes from: a Bunny clip (the frame shows its poster and plays it in the lightbox with sound),
 * or an animated **page** - a self-contained HTML motion piece in `public/` (a Claude Design export), which plays live and
 * muted in the frame and full size, with its own play bar, in the lightbox. `poster` is a still of it (shown until it has
 * loaded, and alone under reduced motion).
 */
export type VslSource = { kind: "bunny"; clip: BunnyVideo } | { kind: "page"; src: string; poster: string };

/**
 * The video sales letter in the home page's first screen (top right, desktop): "Order to delivery", the 42-second
 * walkthrough of ordering and tracking a video (`public/vsl/order-to-delivery.html`; the poster is its opening frame).
 * `null` shows a branded placeholder ("video coming soon").
 */
export const HOME_VSL: VslSource | null = {
  kind: "page",
  src: "/vsl/order-to-delivery.html",
  poster: "/vsl/order-to-delivery.webp",
};

export const VIDEO_PACK: { key: VideoPackKey; clip: BunnyVideo | null }[] = [
  { key: "socialAds", clip: bunny("b7bd4d28-a15f-46cc-a82e-800d9d4e3ee9") },
  { key: "tvAds", clip: bunny("5b06ab4b-b780-4e11-96fe-571b71dfa9aa") },
  { key: "corporate", clip: bunny("3fe879b1-3a7e-4adb-851d-7e6a04da71f9") },
  { key: "brandCampaigns", clip: bunny("1dd9d4d5-4459-48d5-9891-207b3bb9da5c") },
  { key: "ugc", clip: bunny("0adbb91f-8ed4-4f26-a6e3-46efbe51fad2") },
];
