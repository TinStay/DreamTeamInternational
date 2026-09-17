/** Primary phone shown in the header (and the contact section). Keep `href` in E.164. */
export const PHONE_PRIMARY = {
  href: "tel:+359878757930",
  label: "+359 87 875 7930",
} as const;

/** The second line (the contact section and the footer). */
export const PHONE_SECONDARY = {
  href: "tel:+359882367100",
  label: "+359 88 236 7100",
} as const;

/** Public email (header copy button). Stays on the old domain - Resend-verified sender/recipient. */
export const EMAIL_PRIMARY = {
  href: "mailto:info@dreamteam.technology",
  label: "info@dreamteam.technology",
} as const;

/**
 * DreamTeam's Google Business listing ("Dream Team - AI видео реклами и услуги", Sofia). The rating and the
 * review count are the listing's own numbers, read off the place page on 16-09-2026 - there is no key-less way to
 * fetch them live, so update them by hand now and then (TODO(content)).
 */
export const GOOGLE_REVIEWS = {
  placeId: "ChIJPZDwRKqFqkARRkiVSyO7lN0",
  mapUrl: "https://maps.app.goo.gl/FcAFymZsKXR6VVwp9",
  reviewsUrl: "https://search.google.com/local/reviews?placeid=ChIJPZDwRKqFqkARRkiVSyO7lN0",
  rating: 4.9,
  count: 13,
} as const;

/** DreamTeam on Clutch - the id the official widget (`review-badges.tsx`) is keyed by. */
export const CLUTCH = { companyId: "2617358" } as const;
