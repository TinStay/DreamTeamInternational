import { describe, expect, it } from "vitest";
import type { PaddleTransaction } from "@/lib/paddle";
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
  const tx = (over: Partial<PaddleTransaction> = {}) =>
    ({
      id: "txn_01abc",
      status: "completed",
      invoice_number: "325-10001",
      collection_mode: "automatic",
      currency_code: "USD",
      created_at: "2026-10-01T09:00:00Z",
      billed_at: "2026-10-01T09:00:00Z",
      custom_data: null,
      details: { totals: { grand_total: "10875", tax: "875", subtotal: "10000" } },
      items: [{ price: { description: "Film" } }],
      ...over,
    }) as PaddleTransaction;

  it("reads Paddle's totals and tax, and links the PDF through our route", () => {
    expect(invoiceSummary(tx())).toMatchObject({ number: "325-10001", totalCents: 10875, taxCents: 875, description: "Film", status: "paid", currency: "usd", hostedUrl: null, pdfUrl: "/api/invoices/txn_01abc/pdf" });
  });

  it("a sent invoice is open, due after its payment terms, payable on Paddle's checkout", () => {
    const inv = invoiceSummary(tx({ status: "billed", collection_mode: "manual", billing_details: { payment_terms: { interval: "day", frequency: 14 }, additional_information: "Brand film" }, checkout: { url: "https://pay.example/?_ptxn=txn_01abc" } }));
    expect(inv).toMatchObject({ status: "open", dueAt: "2026-10-15T09:00:00.000Z", description: "Brand film", hostedUrl: "https://pay.example/?_ptxn=txn_01abc" });
  });

  it("has no PDF before Paddle numbers it", () => {
    expect(invoiceSummary(tx({ invoice_number: null, status: "ready" }))).toMatchObject({ pdfUrl: null, status: "draft" });
  });
});
