import { PLAN_SECONDS } from "@/lib/credits";
import { PLANS, planPricing, type Billing, type PlanKey } from "@/lib/pricing";

/** What a pack costs and gives, worked out on the server from `lib/pricing.ts` - the browser never sends a price. */
export type CheckoutSpec = {
  planKey: PlanKey;
  /** US cents. */
  amountCents: number;
  /** A single payment (Personal) - otherwise a subscription. */
  oneTime: boolean;
  interval: "month" | "year";
  /** Video seconds credited per payment (a year of them on annual billing). */
  seconds: number;
};

const ALL = [...PLANS.individual, ...PLANS.business];

export function checkoutFor(planKey: string, billing: string): CheckoutSpec | null {
  const plan = ALL.find((p) => p.key === planKey);
  if (!plan || plan.custom || plan.price == null) return null;
  const perPack = PLAN_SECONDS[plan.key];
  if (!perPack) return null;
  if (plan.oneTime) return { planKey: plan.key, amountCents: plan.price * 100, oneTime: true, interval: "month", seconds: perPack };
  if (billing === "annual") {
    return { planKey: plan.key, amountCents: planPricing(plan.price, "annual").annualTotal * 100, oneTime: false, interval: "year", seconds: perPack * 12 };
  }
  return { planKey: plan.key, amountCents: plan.price * 100, oneTime: false, interval: "month", seconds: perPack };
}

export const isBilling = (v: unknown): v is Billing => v === "monthly" || v === "annual";
