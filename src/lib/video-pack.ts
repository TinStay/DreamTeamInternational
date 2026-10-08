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

export const VIDEO_PACK: { key: VideoPackKey; clip: BunnyVideo | null }[] = [
  { key: "socialAds", clip: bunny("b7bd4d28-a15f-46cc-a82e-800d9d4e3ee9") },
  { key: "tvAds", clip: bunny("5b06ab4b-b780-4e11-96fe-571b71dfa9aa") },
  { key: "corporate", clip: bunny("3fe879b1-3a7e-4adb-851d-7e6a04da71f9") },
  { key: "brandCampaigns", clip: bunny("1dd9d4d5-4459-48d5-9891-207b3bb9da5c") },
  { key: "ugc", clip: bunny("0adbb91f-8ed4-4f26-a6e3-46efbe51fad2") },
];
