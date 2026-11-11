// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

/**
 * Orders paid by invoice: the invoice is marked `flow: invoice` (the webhook credits only those), an unpaid plan invoice
 * is replaced, and a paid plan invoice starts exactly one subscription that bills by invoice from the next period.
 */
const live = vi.hoisted(() => ({ value: false }));
vi.mock("@/lib/subscriptions", () => ({ hasLiveSubscription: vi.fn(async () => live.value) }));

const { INVOICE_DUE_DAYS, INVOICE_GRACE_DAYS, nextPeriodAnchor, sendOrderInvoice, startInvoicedSubscription, voidOpenOrderInvoices, voidOverdueOrderInvoices } = await import("@/lib/invoice-orders");

const stripe = {
  invoices: {
    create: vi.fn(async (params: Record<string, unknown>) => ({ id: "in_1", ...params })),
    finalizeInvoice: vi.fn(async (id: string) => ({ id })),
    sendInvoice: vi.fn(async (id: string) => ({ id, number: "000000-0090" })),
    list: vi.fn(),
    voidInvoice: vi.fn(async () => ({})),
  },
  invoiceItems: { create: vi.fn(async () => ({})) },
  products: { retrieve: vi.fn(async (id: string) => ({ id })), create: vi.fn() },
  subscriptions: {
    create: vi.fn(async (...args: [Record<string, unknown>, Record<string, unknown>]) => (void args, { id: "sub_1" })),
    list: vi.fn(async (...args: unknown[]) => (void args, { data: [] as { id: string; metadata: Record<string, string> }[] })),
  },
};
const s = stripe as unknown as Stripe;

beforeEach(() => {
  live.value = false;
  vi.clearAllMocks();
});

describe("sendOrderInvoice", () => {
  it("writes one line before tax, marks the flow, finalizes and emails it", async () => {
    const invoice = await sendOrderInvoice(s, { customer: "cus_1", amountCents: 29900, line: "Keplerbay - Personal", memo: "Paid = added", metadata: { user_id: "u1", purchase_type: "one_time" }, profiled: true });
    expect(invoice.number).toBe("000000-0090");
    const params = stripe.invoices.create.mock.calls[0][0];
    expect(params).toMatchObject({ customer: "cus_1", currency: "usd", collection_method: "send_invoice", days_until_due: INVOICE_DUE_DAYS, description: "Paid = added" });
    expect(params.metadata).toEqual({ user_id: "u1", purchase_type: "one_time", flow: "invoice" });
    // The customer carries their own invoice texts, so no plain footer on top.
    expect(params.footer).toBeUndefined();
    expect(stripe.invoiceItems.create).toHaveBeenCalledWith(expect.objectContaining({ invoice: "in_1", amount: 29900, description: "Keplerbay - Personal", tax_behavior: "exclusive" }));
    expect(stripe.invoices.sendInvoice).toHaveBeenCalledWith("in_1");
  });
});

describe("voidOpenOrderInvoices", () => {
  it("voids only this flow's matching invoices and returns their orders", async () => {
    stripe.invoices.list.mockResolvedValue({
      data: [
        { id: "in_a", metadata: { flow: "invoice", purchase_type: "subscription", order_id: "o-a" } },
        { id: "in_b", metadata: { flow: "invoice", purchase_type: "one_time", order_id: "o-b" } },
        { id: "in_c", metadata: { purchase_type: "subscription" } }, // not an order invoice (a renewal, a team invoice)
      ],
    });
    expect(await voidOpenOrderInvoices(s, "cus_1", (m) => m.purchase_type === "subscription")).toEqual(["o-a"]);
    expect(stripe.invoices.voidInvoice.mock.calls).toEqual([["in_a"]]);
  });

  it("never throws - the new invoice still goes out", async () => {
    stripe.invoices.list.mockRejectedValue(new Error("stripe down"));
    expect(await voidOpenOrderInvoices(s, "cus_1", () => true)).toEqual([]);
  });
});

describe("startInvoicedSubscription", () => {
  const PAID_AT = Date.parse("2026-11-11T12:00:00Z") / 1000;
  const paid = { id: "in_plan", customer: "cus_1", paidAt: PAID_AT, metadata: { user_id: "u1", plan_key: "creator", seconds: "480", billing: "annual", amount_cents: "389000", order_id: "o1" } };

  it("starts the plan by invoice from the next period, at the plan's price, once per invoice", async () => {
    expect(await startInvoicedSubscription(s, paid, "Creator")).toBe("sub_1");
    const [params, options] = stripe.subscriptions.create.mock.calls[0];
    expect(params).toMatchObject({ customer: "cus_1", collection_method: "send_invoice", days_until_due: INVOICE_DUE_DAYS, proration_behavior: "none" });
    expect(params.items).toEqual([{ price_data: { currency: "usd", unit_amount: 389000, recurring: { interval: "year" }, product: "kb_plan_creator", tax_behavior: "exclusive" } }]);
    // The period just paid is not billed again: the first renewal is a year after the payment - counted from the
    // invoice's own paid time, so a second delivery of the event asks Stripe for exactly the same thing.
    expect(params.billing_cycle_anchor).toBe(Date.parse("2027-11-11T11:00:00Z") / 1000);
    expect(params.metadata).toMatchObject({ user_id: "u1", plan_key: "creator", seconds: "480", billing: "annual", purchase_type: "subscription", order_id: "o1", first_invoice: "in_plan" });
    expect(options).toEqual({ idempotencyKey: "sub-from-in_plan" });
  });

  it("returns the subscription the invoice already started, when Stripe sends the event again", async () => {
    stripe.subscriptions.list.mockResolvedValueOnce({ data: [{ id: "sub_other", metadata: { first_invoice: "in_x" } }, { id: "sub_done", metadata: { first_invoice: "in_plan" } }] });
    live.value = true; // it is live by now - and still the answer is the one already made
    expect(await startInvoicedSubscription(s, paid, "Creator")).toBe("sub_done");
    expect(stripe.subscriptions.create).not.toHaveBeenCalled();
  });

  it("never starts a second plan for a client who has a live one, nor one without a price", async () => {
    live.value = true;
    expect(await startInvoicedSubscription(s, paid, "Creator")).toBeNull();
    live.value = false;
    expect(await startInvoicedSubscription(s, { ...paid, metadata: { ...paid.metadata, amount_cents: "" } }, "Creator")).toBeNull();
    expect(stripe.subscriptions.create).not.toHaveBeenCalled();
  });
});

describe("nextPeriodAnchor", () => {
  it("is one period ahead, less an hour", () => {
    const from = new Date("2026-11-11T12:00:00Z");
    expect(nextPeriodAnchor("month", from)).toBe(Date.parse("2026-12-11T11:00:00Z") / 1000);
    expect(nextPeriodAnchor("year", from)).toBe(Date.parse("2027-11-11T11:00:00Z") / 1000);
  });
});

describe("voidOverdueOrderInvoices", () => {
  const NOW = new Date("2026-11-20T06:00:00Z");
  const day = 86_400;
  const t = Math.floor(NOW.getTime() / 1000);
  // An async-iterable list, as stripe-node's auto-paging list is.
  const listOf = (rows: Record<string, unknown>[]) => ({ async *[Symbol.asyncIterator]() { yield* rows; } });

  it("voids only the site's order invoices unpaid three days past their due date, and expires their orders", async () => {
    stripe.invoices.list.mockReturnValue(listOf([
      { id: "in_old", due_date: t - (INVOICE_GRACE_DAYS + 1) * day, amount_paid: 0, metadata: { flow: "invoice", order_id: "o1" } },
      { id: "in_recent", due_date: t - 1 * day, amount_paid: 0, metadata: { flow: "invoice", order_id: "o2" } },
      { id: "in_team", due_date: t - 10 * day, amount_paid: 0, metadata: { purchase_type: "custom_invoice" } },
      { id: "in_renewal", due_date: t - 10 * day, amount_paid: 0, metadata: { flow: "invoice" }, parent: { type: "subscription_details" } },
      { id: "in_partly", due_date: t - 10 * day, amount_paid: 5000, metadata: { flow: "invoice", order_id: "o3" } },
      { id: "in_request", due_date: t - 5 * day, amount_paid: 0, metadata: { flow: "invoice", purchase_type: "project_request" } },
    ]));
    const expired: (string | null)[] = [];
    const voided = await voidOverdueOrderInvoices(s, NOW, async ({ orderId }) => void expired.push(orderId));

    expect(voided).toEqual(["in_old", "in_request"]);
    expect(stripe.invoices.voidInvoice.mock.calls.map((c) => (c as unknown[])[0])).toEqual(["in_old", "in_request"]);
    expect(expired).toEqual(["o1", null]);
    // Stripe is asked only for open, emailed invoices due before the cut-off.
    expect(stripe.invoices.list.mock.calls[0][0]).toMatchObject({ status: "open", collection_method: "send_invoice", due_date: { lt: t - INVOICE_GRACE_DAYS * day } });
  });

  it("goes on past an invoice Stripe refuses to void", async () => {
    stripe.invoices.list.mockReturnValue(listOf([
      { id: "in_a", due_date: t - 9 * day, metadata: { flow: "invoice" } },
      { id: "in_b", due_date: t - 9 * day, metadata: { flow: "invoice" } },
    ]));
    stripe.invoices.voidInvoice.mockRejectedValueOnce(new Error("already paid"));
    expect(await voidOverdueOrderInvoices(s, NOW)).toEqual(["in_b"]);
  });
});
