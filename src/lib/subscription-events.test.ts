import { describe, expect, it } from "vitest";
import { metadataForPrice, planForPrice, subscriptionChange, type SubscriptionState } from "@/lib/subscription-events";
import { subscriptionClientEmail, subscriptionTeamEmail } from "@/lib/email/subscription-emails";

const state = (over: Partial<SubscriptionState> = {}): SubscriptionState => ({ status: "active", cancel_at_period_end: false, amount_cents: 38900, billing: "monthly", ...over });

describe("subscriptionChange (the mirror's row before, the subscription now)", () => {
  it("a new live subscription is started; one that is not running yet is not", () => {
    expect(subscriptionChange(null, state())).toEqual({ kind: "started" });
    expect(subscriptionChange(null, state({ status: "past_due" }))).toBeNull();
    // A plan that had ended and is live again.
    expect(subscriptionChange(state({ status: "canceled" }), state())).toEqual({ kind: "started" });
  });

  it("a scheduled cancellation is a cancellation; cancelled is the end", () => {
    expect(subscriptionChange(state(), state({ cancel_at_period_end: true }))).toEqual({ kind: "cancelled" });
    expect(subscriptionChange(state({ cancel_at_period_end: true }), state({ status: "canceled" }))).toEqual({ kind: "ended" });
    // Paddle sends it again: no second email.
    expect(subscriptionChange(state({ status: "canceled" }), state({ status: "canceled" }))).toBeNull();
  });

  it("a new price is an upgrade or a downgrade, compared per month", () => {
    expect(subscriptionChange(state(), state({ amount_cents: 62900 }))).toMatchObject({ kind: "changed", upgrade: true });
    // Pro monthly ($629) -> Creator annual ($3,890 a year = $324/month): a downgrade.
    expect(subscriptionChange(state({ amount_cents: 62900 }), state({ amount_cents: 389000, billing: "annual" }))).toMatchObject({ kind: "changed", upgrade: false });
  });

  it("ignores renewals, repeats and custom-data writes", () => {
    expect(subscriptionChange(state(), state())).toBeNull();
    expect(subscriptionChange(state({ cancel_at_period_end: true }), state({ cancel_at_period_end: true }))).toBeNull();
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

  it("the admin copy links the subscription in Paddle", () => {
    const e = subscriptionTeamEmail({ ...facts, change: { kind: "started" } }, { name: "Ana Petrova", email: "ana@example.com" }, "https://keplerbay.com");
    expect(e.subject).toBe("New subscription: Pro (Ana Petrova)");
    expect(e.html).toContain("https://sandbox-vendors.paddle.com/subscriptions-v2/sub_1");
    expect(e.html).toContain("Open in Paddle");
  });
});
