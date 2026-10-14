import { getDictionary, type Language } from "@/lib/i18n/config";
import { AUDIENCES, ONE_TIME, PLANS, oneTimeCost, planPricing, type Audience, type PlanKey } from "@/lib/pricing";

/*
 * The plans on `/pricing` as plain facts - numbers from `lib/pricing.ts`, words from the dictionary (`plans.tiers`) -
 * for the machine-readable copies of the price list: `llms.txt` (`lib/llms.ts`) and the `/pricing` JSON-LD
 * (`lib/seo-graph.ts`). Both read this module, so neither can quote a price the pricing cards do not show.
 */

export type PlanFacts = {
  key: PlanKey;
  audience: Audience;
  name: string;
  /** Who the plan is for (the card's line). */
  for: string;
  popular: boolean;
  oneTime: boolean;
  custom: boolean;
  /** US dollars a month, or the one-time price (from); absent for a custom plan. */
  price?: number;
  /** A subscription billed annually: the year's total. */
  annualTotal?: number;
  /** A one-time order at its longest (`ONE_TIME.maxSecs`). */
  maxPrice?: number;
  /** "40 sec of video / month (≈ two 20-second videos)". */
  volume: string;
  features: readonly string[];
  missing: readonly string[];
};

export function planFacts(lang: Language): PlanFacts[] {
  const tiers = getDictionary(lang).plans.tiers;
  return AUDIENCES.flatMap((audience) =>
    PLANS[audience].map((plan) => {
      const tier = tiers[plan.key];
      const subscription = plan.price !== undefined && !plan.oneTime && !plan.custom;
      return {
        key: plan.key,
        audience,
        name: tier.name,
        for: tier.for,
        popular: Boolean(plan.popular),
        oneTime: Boolean(plan.oneTime),
        custom: Boolean(plan.custom),
        price: plan.price,
        annualTotal: subscription ? planPricing(plan.price!, "annual").annualTotal : undefined,
        maxPrice: plan.oneTime ? oneTimeCost(ONE_TIME.maxSecs) : undefined,
        volume: `${tier.volume} ${tier.volumeUnit} (${tier.volumeNote})`,
        features: tier.features,
        missing: tier.missing,
      };
    })
  );
}

/** The "from" prices the copy quotes: a one-time video, the cheapest individual and business subscriptions, the top list price. */
export function priceHighlights() {
  const subscriptions = (audience: Audience) =>
    PLANS[audience].filter((plan) => plan.price !== undefined && !plan.oneTime && !plan.custom).map((plan) => plan.price!);
  const listed = AUDIENCES.flatMap((audience) => PLANS[audience]).flatMap((plan) => (plan.price === undefined ? [] : [plan.price]));
  return {
    oneTimeFrom: ONE_TIME.base,
    individualFrom: Math.min(...subscriptions("individual")),
    businessFrom: Math.min(...subscriptions("business")),
    highest: Math.max(...listed),
  };
}
