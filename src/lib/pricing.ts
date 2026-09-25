/**
 * The plans on `/pricing` (the client's "AI Video Subscription Plans" file). Numbers live here, every word in the
 * dictionaries under `plans.tiers[key]`; a card's colour is its `tint` (`pricing-card.tsx`). Prices are in US dollars.
 *
 * Two audiences, switched by the page's toggle - individual and business - and two billings: monthly, or annual,
 * where a year costs ten months (two free - 17% off). A `oneTime` plan is a single order, a `custom` one is priced on a
 * call; neither changes with the billing. A plan with `secs` (its monthly seconds of video) also shows how much it
 * saves against ordering the same seconds one-time (`ONE_TIME`).
 */
export type Billing = "monthly" | "annual";
export type Audience = "individual" | "business";
export type PlanKey = "personal" | "creator" | "pro" | "local" | "brand" | "enterprise";
export type PlanTint = "gray" | "olive" | "maroon" | "navy";

export type Plan = {
  key: PlanKey;
  tint: PlanTint;
  /** US dollars per month (or the one-time price); absent for a custom plan. */
  price?: number;
  oneTime?: boolean;
  custom?: boolean;
  popular?: boolean;
  /** Seconds of video a month, for the "save vs one-time orders" tag. */
  secs?: number;
};

export const PLANS: Record<Audience, Plan[]> = {
  individual: [
    { key: "personal", tint: "gray", price: 299, oneTime: true },
    { key: "creator", tint: "olive", price: 389, secs: 40, popular: true },
    { key: "pro", tint: "maroon", price: 629, secs: 60 },
  ],
  business: [
    { key: "local", tint: "gray", price: 990 },
    { key: "brand", tint: "navy", price: 3490, popular: true },
    { key: "enterprise", tint: "maroon", custom: true },
  ],
};

/** A one-time order: $299 for up to 20 seconds, $119 for every 10 seconds more. */
export const ONE_TIME = { base: 299, baseSecs: 20, extra: 119 };

/** Annual billing: pay for this many months, get twelve. */
export const ANNUAL_PAID_MONTHS = 10;

export function oneTimeCost(secs: number) {
  return ONE_TIME.base + (Math.max(0, secs - ONE_TIME.baseSecs) / 10) * ONE_TIME.extra;
}

/** The numbers a subscription card shows for a billing. */
export function planPricing(price: number, billing: Billing) {
  const yearly = price * 12;
  const annualTotal = price * ANNUAL_PAID_MONTHS;
  const saved = yearly - annualTotal;
  return {
    perMonth: billing === "annual" ? annualTotal / 12 : price,
    annualTotal,
    saved,
    percent: Math.round((saved / yearly) * 100),
  };
}

/** The annual discount, for the toggle's tag ("17% off"). */
export const ANNUAL_PERCENT = Math.round(((12 - ANNUAL_PAID_MONTHS) / 12) * 100);

/** "$1,990" - the same in both languages (the prices are in dollars). */
export function formatPrice(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}
