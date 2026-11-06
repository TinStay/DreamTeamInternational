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

/** The public contact email - the header copy button, the footer, the legal pages and the structured data. The emails
 * the site sends keep `info@keplerbay.com` as their sender (`RESEND_FROM`) and the admin inbox is `ADMIN_INBOX`. */
export const EMAIL_PRIMARY = {
  href: "mailto:hq@keplerbay.com",
  label: "hq@keplerbay.com",
} as const;

/** A `mailto:` link to the public inbox, with a subject when there is one - the "write to us" links on the site. */
export function emailHref(subject?: string) {
  return subject ? `${EMAIL_PRIMARY.href}?subject=${encodeURIComponent(subject)}` : EMAIL_PRIMARY.href;
}

/**
 * Keplerbay's Google Business listing ("Keplerbay - AI видео реклами и услуги", Sofia). The rating and the
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

/** Keplerbay on Clutch - the id the official widget (`review-badges.tsx`) is keyed by. */
export const CLUTCH = { companyId: "2617358" } as const;
