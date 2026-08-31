/**
 * "How did you find us?" option keys — the single source of truth shared by
 * the contact form, the quote form, and `/api/quote`. Labels live in the
 * dictionaries under `contact.foundUsOptions` (keys must match this list).
 */
export const FOUND_US_KEYS = [
  "google",
  "social",
  "instagram",
  "tiktok",
  "youtube",
  "referral",
  "event",
  "other",
] as const;

export type FoundUsKey = (typeof FOUND_US_KEYS)[number];

export function isFoundUsKey(value: unknown): value is FoundUsKey {
  return (
    typeof value === "string" && (FOUND_US_KEYS as readonly string[]).includes(value)
  );
}
