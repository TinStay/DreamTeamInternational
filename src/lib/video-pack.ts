import { bunny, type BunnyVideo } from "@/lib/bunny-stream";

/**
 * The "Get your AI video pack" rail on the English home page (`components/video-pack-section.tsx`): one window per kind
 * of video, in this order; titles and lines in the dictionary under `videoPack.items[key]`.
 *
 * `clip` is the film the window plays (a 16:9 Bunny Stream clip - its 720p MP4 and its poster). The ones below are
 * placeholders from the client's case studies until each category has its own showreel: replace the id, or set `null`
 * for a branded empty window.
 */
export const VIDEO_PACK_KEYS = ["socialAds", "tvAds", "corporate", "brandCampaigns", "avatar", "ugc"] as const;
export type VideoPackKey = (typeof VIDEO_PACK_KEYS)[number];

export const VIDEO_PACK: { key: VideoPackKey; clip: BunnyVideo | null }[] = [
  { key: "socialAds", clip: bunny("879d538c-1bb4-46d3-bbd0-6bd9d3cab9eb") }, // placeholder: Boleron summer ad
  { key: "tvAds", clip: bunny("57df0c8a-c7aa-46cc-a581-b71019803c70") }, // placeholder: Boleron Casco 4
  { key: "corporate", clip: bunny("dbb13635-0fda-4d13-8ff6-1a832cbc54af") }, // placeholder: MindGuard PR film
  { key: "brandCampaigns", clip: bunny("481d2093-0dc0-44db-bda4-4d562c20d8fe") }, // placeholder: Plasico "Back to Work"
  { key: "avatar", clip: bunny("067fb3bd-0528-4972-bfba-5e0007f2e7c3") }, // placeholder: MindGuard presentation
  { key: "ugc", clip: bunny("3f0113df-90d2-425e-9d5b-84fec0d32932") }, // placeholder: Plasico office spot
];
