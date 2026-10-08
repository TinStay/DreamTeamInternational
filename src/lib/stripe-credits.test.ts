import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { creditDecision } from "@/lib/stripe-credits";

const META = { user_id: "u1", plan_key: "personal", seconds: "20" };
const event = (type: string, object: Record<string, unknown>) => ({ type, data: { object } }) as unknown as Stripe.Event;
const session = (over: Record<string, unknown>) => ({ id: "cs_1", mode: "payment", payment_status: "paid", metadata: META, ...over });

describe("creditDecision - seconds only for collected money", () => {
  it("credits a one-time pack paid at checkout", () => {
    expect(creditDecision(event("checkout.session.completed", session({})))).toEqual({
      kind: "credit",
      purchase: { userId: "u1", seconds: 20, planKey: "personal", ref: "cs_1", note: "Pack purchase", orderId: null },
    });
  });

  it("carries the order the checkout recorded", () => {
    const d = creditDecision(event("checkout.session.completed", session({ metadata: { ...META, seconds: "40", order_id: "o1" } })));
    expect(d.kind === "credit" && d.purchase).toMatchObject({ seconds: 40, orderId: "o1" });
  });

  it("does not credit a checkout whose bank payment is still pending", () => {
    expect(creditDecision(event("checkout.session.completed", session({ payment_status: "unpaid" })))).toEqual({ kind: "none", reason: "payment_pending" });
  });

  it("credits the delayed payment once it succeeds, under the same ref", () => {
    const d = creditDecision(event("checkout.session.async_payment_succeeded", session({})));
    expect(d.kind === "credit" && d.purchase.ref).toBe("cs_1");
  });

  it("never credits a failed payment", () => {
    for (const type of ["checkout.session.async_payment_failed", "invoice.payment_failed", "payment_intent.payment_failed"]) {
      expect(creditDecision(event(type, session({ payment_status: "unpaid" })))).toEqual({ kind: "none", reason: "payment_failed" });
    }
  });

  it("leaves subscription checkouts to invoice.paid", () => {
    expect(creditDecision(event("checkout.session.completed", session({ mode: "subscription" })))).toEqual({ kind: "none", reason: "ignored" });
  });

  it("credits a paid subscription invoice (old and new API shapes)", () => {
    expect(creditDecision(event("invoice.paid", { id: "in_1", status: "paid", subscription: "sub_1" }))).toEqual({ kind: "subscription", subscriptionId: "sub_1", ref: "in_1" });
    expect(
      creditDecision(event("invoice.paid", { id: "in_2", status: "paid", parent: { subscription_details: { subscription: { id: "sub_2" } } } }))
    ).toEqual({ kind: "subscription", subscriptionId: "sub_2", ref: "in_2" });
  });

  it("does not credit an invoice that is not actually paid", () => {
    expect(creditDecision(event("invoice.paid", { id: "in_3", status: "open", subscription: "sub_1" }))).toEqual({ kind: "none", reason: "not_paid" });
  });

  it("ignores a paid session without valid pack metadata", () => {
    expect(creditDecision(event("checkout.session.completed", session({ metadata: { user_id: "u1", plan_key: "nope", seconds: "20" } })))).toEqual({
      kind: "none",
      reason: "not_a_pack",
    });
    expect(creditDecision(event("checkout.session.completed", session({ metadata: { ...META, seconds: "-5" } })))).toEqual({ kind: "none", reason: "not_a_pack" });
  });
});
