export type SocialLink = { href: string; src: string; alt: string };

/**
 * Social profiles + their icon assets — the footer's Socials column, the contact section, the quote form's success
 * screen, the organization's `sameAs` and the llms.txt contact line. **Empty for now**: the profiles are still the
 * DreamTeam accounts, so they are parked (below, ready to restore) until the Keplerbay ones exist; every place that
 * reads this list renders nothing - no heading, no empty row - while it is empty.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  // {
  //   href: "https://www.facebook.com/profile.php?id=61585919836260",
  //   src: "/social_media_icons/facebook.png",
  //   alt: "Facebook",
  // },
  // {
  //   href: "https://www.instagram.com/dreamteam.video.ai/",
  //   src: "/social_media_icons/instagram.png",
  //   alt: "Instagram",
  // },
  // {
  //   href: "https://www.linkedin.com/company/109344952",
  //   src: "/social_media_icons/linkedin.png",
  //   alt: "LinkedIn",
  // },
  // {
  //   href: "https://www.youtube.com/@DreamTeamVideo",
  //   src: "/social_media_icons/youtube.png",
  //   alt: "YouTube",
  // },
  // {
  //   // The profile URL without the share dialog's tracking query (`is_from_webapp`, `sender_device`) - it is
  //   // also the organization's `sameAs` and the llms.txt profile line, where the clean address is what counts.
  //   href: "https://www.tiktok.com/@dreamteam.video.a",
  //   src: "/social_media_icons/tiktok.png",
  //   alt: "TikTok",
  // },
];
