/**
 * Bunny Stream (mediadelivery.net) hosted clips. A share link looks like
 * `https://player.mediadelivery.net/play/<library>/<video-guid>`; the embed
 * player lives at `iframe.mediadelivery.net/embed/<library>/<video-guid>`.
 */
export type BunnyVideo = { library: string; id: string };

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
