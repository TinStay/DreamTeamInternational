import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { invoiceSummary, parseAddress, parseInvoiceDraft } from "@/lib/invoices";

describe("parseInvoiceDraft", () => {
  it("accepts lines in cents, a due period and a memo", () => {
    expect(parseInvoiceDraft({ lines: [{ description: " 60s film ", amountCents: 150000 }], daysUntilDue: 30, memo: " Thanks " })).toEqual({
      lines: [{ description: "60s film", amountCents: 150000 }],
      daysUntilDue: 30,
      memo: "Thanks",
    });
  });

  it("refuses empty, unpriced, tiny, oversized and badly dated invoices", () => {
    expect(parseInvoiceDraft({ lines: [] })).toBeNull();
    expect(parseInvoiceDraft({ lines: [{ description: "", amountCents: 5000 }] })).toBeNull();
    expect(parseInvoiceDraft({ lines: [{ description: "Film", amountCents: 50 }] })).toBeNull();
    expect(parseInvoiceDraft({ lines: [{ description: "Film", amountCents: 10_000_001 }] })).toBeNull();
    expect(parseInvoiceDraft({ lines: [{ description: "Film", amountCents: 5000 }], daysUntilDue: 0 })).toBeNull();
    expect(parseInvoiceDraft({ lines: Array.from({ length: 21 }, () => ({ description: "x", amountCents: 100 })) })).toBeNull();
  });

  it("defaults to 14 days", () => {
    expect(parseInvoiceDraft({ lines: [{ description: "Film", amountCents: 5000 }] })?.daysUntilDue).toBe(14);
  });
});

describe("parseAddress", () => {
  it("needs a full US address, state included", () => {
    expect(parseAddress({ line1: "1 Market St", city: "San Francisco", postal_code: "94105", country: "us" })).toBeNull();
    expect(parseAddress({ line1: "1 Market St", city: "San Francisco", state: "CA", postal_code: "94105", country: "us" })).toMatchObject({ country: "US", state: "CA" });
  });

  it("takes a non-US address without a state", () => {
    expect(parseAddress({ line1: "1 Vitosha Blvd", city: "Sofia", postal_code: "1000", country: "BG" })).toMatchObject({ country: "BG" });
    expect(parseAddress({ line1: "x", city: "y", postal_code: "1", country: "Bulgaria" })).toBeNull();
  });
});

describe("invoiceSummary", () => {
  it("reads the tax as total less total before tax", () => {
    const inv = { id: "in_1", number: "KEPL-0001", created: 1_760_000_000, due_date: null, description: null, lines: { data: [{ description: "Film" }] }, total: 10875, total_excluding_tax: 10000, currency: "usd", status: "paid", hosted_invoice_url: "https://invoice.stripe.com/i/1", invoice_pdf: null } as unknown as Stripe.Invoice;
    expect(invoiceSummary(inv)).toMatchObject({ number: "KEPL-0001", totalCents: 10875, taxCents: 875, description: "Film", status: "paid" });
  });
});
