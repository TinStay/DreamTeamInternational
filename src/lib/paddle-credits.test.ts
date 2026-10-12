// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { creditDecision } from "@/lib/paddle-credits";
import { verifyPaddleSignature, type PaddleEvent } from "@/lib/paddle";

const META = { user_id: "u1", plan_key: "personal", seconds: "40", order_id: "order-1", purchase_type: "one_time" };
const event = (event_type: string, data: Record<string, unknown>) => ({ event_type, data }) as PaddleEvent;
const tx = (over: Record<string, unknown> = {}) => ({ id: "txn_1", status: "completed", custom_data: META, ...over });

describe("creditDecision - seconds only for money collected", () => {
  it("a completed one-time pack is credited once, on its transaction id, with its order", () => {
    expect(creditDecision(event("transaction.completed", tx()))).toEqual({
      kind: "credit",
      purchase: { userId: "u1", seconds: 40, planKey: "personal", ref: "txn_1", note: "Pack purchase", orderId: "order-1" },
    });
  });

  it("a subscription's first payment and each renewal are credited (the renewal carries the plan's custom data)", () => {
    const renewal = tx({ id: "txn_2", subscription_id: "sub_1", origin: "subscription_recurring", custom_data: { user_id: "u1", plan_key: "creator", seconds: "40" } });
    expect(creditDecision(event("transaction.completed", renewal))).toMatchObject({ kind: "credit", purchase: { ref: "txn_2", seconds: 40, note: "Subscription payment" } });
  });

  it("never credits a failed or unfinished payment", () => {
    expect(creditDecision(event("transaction.payment_failed", tx({ status: "past_due" })))).toEqual({ kind: "none", reason: "payment_failed" });
    expect(creditDecision(event("transaction.paid", tx({ status: "paid" })))).toEqual({ kind: "none", reason: "ignored" });
    expect(creditDecision(event("transaction.completed", tx({ status: "billed" })))).toEqual({ kind: "none", reason: "not_paid" });
  });

  it("paid change requests and the team's invoices are never video seconds", () => {
    expect(creditDecision(event("transaction.completed", tx({ custom_data: { ...META, purchase_type: "project_request" } })))).toEqual({ kind: "none", reason: "not_a_pack" });
    expect(creditDecision(event("transaction.completed", tx({ custom_data: { user_id: "u1", purchase_type: "custom_invoice" } })))).toEqual({ kind: "none", reason: "not_a_pack" });
  });

  it("ignores a transaction without our custom data, or with an unknown plan", () => {
    expect(creditDecision(event("transaction.completed", tx({ custom_data: null })))).toEqual({ kind: "none", reason: "not_a_pack" });
    expect(creditDecision(event("transaction.completed", tx({ custom_data: { ...META, plan_key: "free-money" } })))).toEqual({ kind: "none", reason: "not_a_pack" });
  });
});

describe("verifyPaddleSignature", () => {
  const secret = "pdl_ntfset_secret";
  const raw = JSON.stringify({ event_type: "transaction.completed" });
  const now = 1_790_000_000_000;
  const sign = (ts: number, body = raw) => `ts=${ts};h1=${createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex")}`;

  it("accepts Paddle's signature over the timestamp and the raw body", () => {
    expect(verifyPaddleSignature(raw, sign(now / 1000), secret, now)).toBe(true);
  });

  it("refuses a changed body, a wrong secret, a missing header and an old notification", () => {
    expect(verifyPaddleSignature(raw + " ", sign(now / 1000), secret, now)).toBe(false);
    expect(verifyPaddleSignature(raw, sign(now / 1000), "other", now)).toBe(false);
    expect(verifyPaddleSignature(raw, null, secret, now)).toBe(false);
    expect(verifyPaddleSignature(raw, "ts=1;h1=zz", secret, now)).toBe(false);
    expect(verifyPaddleSignature(raw, sign(now / 1000 - 600), secret, now)).toBe(false);
  });
});
