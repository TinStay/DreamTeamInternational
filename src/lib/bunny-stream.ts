/**
 * Bunny Stream (mediadelivery.net) hosted clips. A share link looks like
 * `https://player.mediadelivery.net/play/<library>/<video-guid>`; the embed
 * player lives at `iframe.mediadelivery.net/embed/<library>/<video-guid>`.
 */
export type BunnyVideo = { library: string; id: string };

/** A clip's own library on the share link (`/play/750681/…`) - the site's one library. */
export const BUNNY_LIBRARY = "750681";
/** A clip in the site's library. */
export const bunny = (id: string): BunnyVideo => ({ library: BUNNY_LIBRARY, id });
/**
 * The library's pull zone - the poster frame of a clip lives at `<zone>/<guid>/thumbnail.jpg`. The zone only
 * serves requests with the site (or localhost) as referrer, so posters are plain `<img>`s (never through the
 * image optimizer, which fetches with no referrer) sent with the origin as referrer.
 */
const BUNNY_PULL_ZONE = "https://vz-49fa6283-9c1.b-cdn.net";
export function bunnyThumbnailUrl({ id }: BunnyVideo) {
  return `${BUNNY_PULL_ZONE}/${id}/thumbnail.jpg`;
}

/** The home hero's background film (share link `player.mediadelivery.net/play/750681/d856fe05-…`). */
export const HERO_VIDEO: BunnyVideo = { library: "750681", id: "d856fe05-54ae-4955-9043-c4eebc9208a4" };

/** The regular player (controls; no autoplay unless asked - a lightbox opens playing) for a film frame. */
export function bunnyPlayerEmbedSrc({ library, id }: BunnyVideo, { autoplay = false }: { autoplay?: boolean } = {}) {
  const params = new URLSearchParams({ autoplay: autoplay ? "true" : "false", preload: "true", responsive: "true" });
  return `https://iframe.mediadelivery.net/embed/${library}/${id}?${params.toString()}`;
}

/** Muted, looping, auto-playing background player with the in-player chrome hidden. */
export function bunnyBackgroundEmbedSrc({ library, id }: BunnyVideo) {
  const params = new URLSearchParams({
    autoplay: "true",
    loop: "true",
    muted: "true",
    preload: "true",
    responsive: "false",
    // Hides the play-bar overlays (Bunny "showHeatmap" etc. stay off by default).
    controls: "false",
  });
  return `https://iframe.mediadelivery.net/embed/${library}/${id}?${params.toString()}`;
}
