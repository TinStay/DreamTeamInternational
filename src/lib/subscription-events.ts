import { PLAN_SECONDS } from "@/lib/credits";
import { PLANS, planPricing, type PlanKey } from "@/lib/pricing";
import { isLiveStatus } from "@/lib/subscription-status";

/**
 * What a `subscription.*` notification from Paddle means for the client, so it can be emailed
 * (`lib/email/subscription-emails.ts`). Paddle sends the subscription's new state only, so the change is read by
 * comparing it with the mirror's row from before (`saveSubscription` returns it):
 * - `started`  - a new plan is live (a first one, or one that was not live before);
 * - `cancelled` - the client (or the team) cancelled: it runs to the end of the paid period, then stops;
 * - `changed`  - the plan's price changed (an upgrade or a downgrade - plan changes are made by the team in Paddle);
 * - `ended`    - the subscription is over.
 * Anything else - a renewal, a custom-data write, a status flicker - is `null`.
 */

export type PlanPrice = { amountCents: number; interval: "month" | "year" };

export type SubscriptionChange =
  | { kind: "started" }
  | { kind: "cancelled" }
  | { kind: "ended" }
  | { kind: "changed"; from: PlanPrice; to: PlanPrice; upgrade: boolean };

/** The mirror's view of a subscription - the parts a change is read from. */
export type SubscriptionState = { status: string; cancel_at_period_end: boolean; amount_cents: number | null; billing: string | null };

/** The subscription's price: what one period costs and how long a period is. */
export function planPriceOf(s: Pick<SubscriptionState, "amount_cents" | "billing"> | null | undefined): PlanPrice | null {
  if (!s || s.amount_cents == null || (s.billing !== "monthly" && s.billing !== "annual")) return null;
  return { amountCents: s.amount_cents, interval: s.billing === "annual" ? "year" : "month" };
}

/** A price per month, so a monthly and an annual plan compare. */
export const monthlyCents = (p: PlanPrice) => (p.interval === "year" ? p.amountCents / 12 : p.amountCents);

/** Which plan on `/pricing` a price is (its monthly price, or its annual total) - `null` for a custom price. */
export function planForPrice(p: PlanPrice): PlanKey | null {
  for (const plan of [...PLANS.individual, ...PLANS.business]) {
    if (plan.oneTime || plan.custom || plan.price == null) continue;
    const cents = p.interval === "year" ? planPricing(plan.price, "annual").annualTotal * 100 : plan.price * 100;
    if (cents === p.amountCents) return plan.key;
  }
  return null;
}

/** The custom data a subscription should carry for its price: the plan, the billing, and the seconds each payment adds. */
export function metadataForPrice(p: PlanPrice): { plan_key: PlanKey; billing: "monthly" | "annual"; seconds: string } | null {
  const key = planForPrice(p);
  if (!key || !PLAN_SECONDS[key]) return null;
  return { plan_key: key, billing: p.interval === "year" ? "annual" : "monthly", seconds: String(PLAN_SECONDS[key] * (p.interval === "year" ? 12 : 1)) };
}

/** A plan the client is actually on (a payment being retried, or a paused plan, is not a fresh start). */
const running = (status: string) => status === "active" || status === "trialing";

export function subscriptionChange(previous: SubscriptionState | null, next: SubscriptionState): SubscriptionChange | null {
  if (next.status === "canceled") return !previous || previous.status !== "canceled" ? { kind: "ended" } : null;
  if (!previous || !isLiveStatus(previous.status)) return running(next.status) ? { kind: "started" } : null;
  // Cancelled at the end of the period (a scheduled cancellation appeared).
  if (next.cancel_at_period_end && !previous.cancel_at_period_end) return { kind: "cancelled" };
  // A new price on the subscription.
  const from = planPriceOf(previous);
  const to = planPriceOf(next);
  if (from && to && (from.amountCents !== to.amountCents || from.interval !== to.interval)) {
    return { kind: "changed", from, to, upgrade: monthlyCents(to) > monthlyCents(from) };
  }
  return null;
}
