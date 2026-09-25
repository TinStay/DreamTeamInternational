/**
 * The monthly production plans on `/pricing` (the client's table: Локал / Бранд / Премиум). Numbers live here, every
 * word in the dictionaries under `plans.tiers[key]`; the card look per plan is `tone` (`pricing-card.tsx`).
 * Prices are in euro, per month. Per-video pricing comes later.
 */
export const PLAN_KEYS = ["local", "brand", "premium"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export type Plan = {
  key: PlanKey;
  /** Euro per month. */
  price: number;
  /** Minutes of finished video per month. */
  minutes: number;
  /** The same volume as 30-second videos. */
  clips: number;
  /** The highlighted plan ("Most popular"). */
  popular?: boolean;
  /** The checklist under the card: which of `plans.checklist` this plan has, in that order. */
  checklist: boolean[];
};

export const PLANS: Plan[] = [
  { key: "local", price: 500, minutes: 2.5, clips: 5, checklist: [true, true, true, false, false] },
  { key: "brand", price: 1200, minutes: 3, clips: 6, popular: true, checklist: [true, true, true, true, false] },
  { key: "premium", price: 2400, minutes: 4, clips: 8, checklist: [true, true, true, true, true] },
];
