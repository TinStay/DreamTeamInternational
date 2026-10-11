import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { metadataForPrice, planForPrice, subscriptionChange } from "@/lib/subscription-events";
import { subscriptionClientEmail, subscriptionTeamEmail } from "@/lib/email/subscription-emails";

const items = (amount: number, interval: "month" | "year") => ({ data: [{ price: { id: "price_x", unit_amount: amount, recurring: { interval } } }] });
const sub = (over: Record<string, unknown> = {}) => ({ id: "sub_1", status: "active", cancel_at_period_end: false, cancel_at: null, items: items(38900, "month"), metadata: { user_id: "u1", plan_key: "creator" }, ...over });
const event = (type: string, object: Record<string, unknown>, previous?: Record<string, unknown>) =>
  ({ id: "evt_1", type, livemode: false, data: { object, ...(previous ? { previous_attributes: previous } : {}) } }) as unknown as Stripe.Event;

describe("subscriptionChange", () => {
  it("a new live subscription is started; a pending one starts once its payment goes through", () => {
    expect(subscriptionChange(event("customer.subscription.created", sub()))).toEqual({ kind: "started" });
    expect(subscriptionChange(event("customer.subscription.created", sub({ status: "incomplete" })))).toBeNull();
    expect(subscriptionChange(event("customer.subscription.updated", sub(), { status: "incomplete" }))).toEqual({ kind: "started" });
  });

  it("cancelling at the period end is a cancellation; deletion is the end", () => {
    expect(subscriptionChange(event("customer.subscription.updated", sub({ cancel_at_period_end: true }), { cancel_at_period_end: false }))).toEqual({ kind: "cancelled" });
    expect(subscriptionChange(event("customer.subscription.deleted", sub({ status: "canceled" })))).toEqual({ kind: "ended" });
  });

  it("a new price is an upgrade or a downgrade, compared per month", () => {
    const up = subscriptionChange(event("customer.subscription.updated", sub({ items: items(62900, "month") }), { items: items(38900, "month") }));
    expect(up).toMatchObject({ kind: "changed", upgrade: true });
    // Pro monthly ($629) -> Creator annual ($3,890 a year = $324/month): a downgrade.
    const down = subscriptionChange(event("customer.subscription.updated", sub({ items: items(389000, "year") }), { items: items(62900, "month") }));
    expect(down).toMatchObject({ kind: "changed", upgrade: false });
  });

  it("ignores renewals and metadata writes", () => {
    expect(subscriptionChange(event("customer.subscription.updated", sub(), { metadata: { plan_key: "pro" } }))).toBeNull();
    expect(subscriptionChange(event("customer.subscription.updated", sub(), { items: items(38900, "month") }))).toBeNull();
  });
});

describe("plans from prices", () => {
  it("knows each plan by its monthly price or annual total, and the seconds it credits", () => {
    expect(planForPrice({ amountCents: 62900, interval: "month" })).toBe("pro");
    expect(planForPrice({ amountCents: 3490000, interval: "year" })).toBe("brand");
    expect(planForPrice({ amountCents: 12345, interval: "month" })).toBeNull();
    expect(metadataForPrice({ amountCents: 62900, interval: "month" })).toEqual({ plan_key: "pro", billing: "monthly", seconds: "60" });
    expect(metadataForPrice({ amountCents: 389000, interval: "year" })).toEqual({ plan_key: "creator", billing: "annual", seconds: "480" });
  });
});

describe("subscription emails", () => {
  const facts = { planKey: "pro" as const, price: { amountCents: 62900, interval: "month" as const }, periodEnd: "2026-11-09T00:00:00Z", subscriptionId: "sub_1", livemode: false };

  it("an upgrade names the old and the new plan, with the price and video time", () => {
    const e = subscriptionClientEmail({ ...facts, change: { kind: "changed", from: { amountCents: 38900, interval: "month" }, to: facts.price, upgrade: true } }, "Ana", "https://keplerbay.com");
    expect(e.subject).toBe("You've upgraded to Pro");
    expect(e.html).toContain("from Creator to Pro");
    expect(e.html).toContain("$629 / month");
    expect(e.html).toContain("09-11-2026");
  });

  it("a cancellation says until when, and offers to resume", () => {
    const e = subscriptionClientEmail({ ...facts, change: { kind: "cancelled" } }, "Ana", "https://keplerbay.com");
    expect(e.html).toContain("active until 09-11-2026");
    expect(e.html).toContain("https://keplerbay.com/en/account");
    expect(e.html).toContain("Resume your subscription");
  });

  it("the admin copy links the subscription in Stripe", () => {
    const e = subscriptionTeamEmail({ ...facts, change: { kind: "started" } }, { name: "Ana Petrova", email: "ana@example.com" }, "https://keplerbay.com");
    expect(e.subject).toBe("New subscription: Pro (Ana Petrova)");
    expect(e.html).toContain("https://dashboard.stripe.com/test/subscriptions/sub_1");
  });
});
