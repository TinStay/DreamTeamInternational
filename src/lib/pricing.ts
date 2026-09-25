/**
 * The plans on `/pricing`. Numbers live here, every word in the dictionaries under `plans.tiers[key]`; the card look
 * per plan is its `tone` (`pricing-card.tsx`). Prices are in US dollars per month; `annual` is the per-month price
 * when billed yearly (the same as monthly for now - the client sets the discount later).
 *
 * Two audiences, switched by the page's toggle: the business plans below, and individual plans still to come (the
 * Individual tab shows a "coming soon - ask for a quote" card until `INDIVIDUAL_PLANS` has entries).
 */
export const PLAN_KEYS = ["local", "brand", "premium"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export type Billing = "monthly" | "annual";
export type Audience = "individual" | "business";

export type Plan = {
  key: PlanKey;
  /** US dollars per month, billed monthly / billed annually. */
  price: Record<Billing, number>;
  /** The highlighted plan ("Most popular"). */
  popular?: boolean;
};

export const BUSINESS_PLANS: Plan[] = [
  { key: "local", price: { monthly: 590, annual: 590 } },
  { key: "brand", price: { monthly: 1990, annual: 1990 }, popular: true },
  { key: "premium", price: { monthly: 3990, annual: 3990 } },
];

export const INDIVIDUAL_PLANS: Plan[] = [];

/** "$1,990" - the same in both languages (the price is in dollars). */
export function formatPrice(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}
