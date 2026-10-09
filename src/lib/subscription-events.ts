import type Stripe from "stripe";
import { PLAN_SECONDS } from "@/lib/credits";
import { PLANS, planPricing, type PlanKey } from "@/lib/pricing";
import { isLiveStatus } from "@/lib/subscription-status";

/**
 * What a `customer.subscription.*` webhook event means for the client, read from the event alone (the subscription and
 * Stripe's `previous_attributes`), so it can be emailed (`lib/email/subscription-emails.ts`):
 * - `started`  - a new plan is live (created live, or a first payment that was pending went through);
 * - `cancelled` - the client (or the team) cancelled: it runs to the end of the paid period, then stops;
 * - `changed`  - the plan's price changed (an upgrade or a downgrade - plan changes are made by the team in Stripe);
 * - `ended`    - the subscription is over.
 * Anything else - a renewal, a metadata write, a status flicker - is `null`.
 */

export type PlanPrice = { amountCents: number; interval: "month" | "year" };

export type SubscriptionChange =
  | { kind: "started" }
  | { kind: "cancelled" }
  | { kind: "ended" }
  | { kind: "changed"; from: PlanPrice; to: PlanPrice; upgrade: boolean };

type Item = { price?: { id?: string; unit_amount?: number | null; recurring?: { interval?: string } | null } | null };

/** The subscription's price: what one period costs and how long a period is. */
export function planPriceOf(items: { data?: Item[] } | null | undefined): PlanPrice | null {
  const price = items?.data?.[0]?.price;
  const interval = price?.recurring?.interval;
  if (price?.unit_amount == null || (interval !== "month" && interval !== "year")) return null;
  return { amountCents: price.unit_amount, interval };
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

/** The metadata a subscription should carry for its price: the plan, the billing, and the seconds each payment adds. */
export function metadataForPrice(p: PlanPrice): { plan_key: PlanKey; billing: "monthly" | "annual"; seconds: string } | null {
  const key = planForPrice(p);
  if (!key || !PLAN_SECONDS[key]) return null;
  return { plan_key: key, billing: p.interval === "year" ? "annual" : "monthly", seconds: String(PLAN_SECONDS[key] * (p.interval === "year" ? 12 : 1)) };
}

export function subscriptionChange(event: Stripe.Event): SubscriptionChange | null {
  const sub = event.data.object as Stripe.Subscription;
  if (event.type === "customer.subscription.deleted") return { kind: "ended" };
  if (event.type === "customer.subscription.created") return isLiveStatus(sub.status) && sub.status !== "past_due" && sub.status !== "unpaid" ? { kind: "started" } : null;
  if (event.type !== "customer.subscription.updated") return null;

  const prev = (event.data.previous_attributes ?? {}) as { status?: string; cancel_at_period_end?: boolean; cancel_at?: number | null; items?: { data?: Item[] } };
  // A first payment that was pending (a bank debit, 3-D Secure) went through.
  if (prev.status === "incomplete" && (sub.status === "active" || sub.status === "trialing")) return { kind: "started" };
  // Cancelled at the end of the period (the flag, or the newer `cancel_at` date being set).
  if ((prev.cancel_at_period_end === false && sub.cancel_at_period_end) || (prev.cancel_at === null && sub.cancel_at)) return { kind: "cancelled" };
  // A new price on the subscription.
  if (prev.items) {
    const from = planPriceOf(prev.items);
    const to = planPriceOf(sub.items as unknown as { data?: Item[] });
    if (from && to && (from.amountCents !== to.amountCents || from.interval !== to.interval)) {
      return { kind: "changed", from, to, upgrade: monthlyCents(to) > monthlyCents(from) };
    }
  }
  return null;
}
