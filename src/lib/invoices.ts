import type Stripe from "stripe";
import { INVOICE_FOOTER, lineTax, taxEnabled } from "@/lib/stripe-tax";

/** One invoice, as the client's account page and the team's client window show it. */
export type InvoiceSummary = {
  id: string;
  /** Stripe's invoice number (e.g. `KEPL-0001`), once finalized. */
  number: string | null;
  /** ISO date-time it was issued. */
  createdAt: string;
  /** ISO date it is due (sent invoices only). */
  dueAt: string | null;
  description: string | null;
  /** Cents, tax included. */
  totalCents: number;
  taxCents: number;
  currency: string;
  status: "open" | "paid" | "void" | "uncollectible" | "draft";
  /** Stripe's hosted page - view and pay. */
  hostedUrl: string | null;
  pdfUrl: string | null;
};

export function invoiceSummary(inv: Stripe.Invoice): InvoiceSummary {
  const total = inv.total ?? 0;
  return {
    id: inv.id ?? "",
    number: inv.number ?? null,
    createdAt: new Date(inv.created * 1000).toISOString(),
    dueAt: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
    description: inv.description ?? inv.lines?.data?.[0]?.description ?? null,
    totalCents: total,
    taxCents: Math.max(0, total - (inv.total_excluding_tax ?? total)),
    currency: inv.currency,
    status: (inv.status ?? "draft") as InvoiceSummary["status"],
    hostedUrl: inv.hosted_invoice_url ?? null,
    pdfUrl: inv.invoice_pdf ?? null,
  };
}

/** A customer's invoices, newest first - drafts left out (the client never sees one, the team sends them finalized). */
export async function listInvoices(stripe: Stripe, customerId: string, limit = 24): Promise<InvoiceSummary[]> {
  const page = await stripe.invoices.list({ customer: customerId, limit });
  return page.data.filter((inv) => inv.status !== "draft").map(invoiceSummary);
}

/** One line of an invoice the team writes. */
export type InvoiceLine = { description: string; amountCents: number };

/** What the team sends, checked: 1-20 lines, each with a description and a positive amount, at most $100,000 in all. */
export type InvoiceDraft = { lines: InvoiceLine[]; daysUntilDue: number; memo: string };

export function parseInvoiceDraft(body: unknown): InvoiceDraft | null {
  const b = (body ?? {}) as { lines?: unknown; daysUntilDue?: unknown; memo?: unknown };
  if (!Array.isArray(b.lines) || b.lines.length === 0 || b.lines.length > 20) return null;
  const lines: InvoiceLine[] = [];
  for (const raw of b.lines) {
    const l = (raw ?? {}) as { description?: unknown; amountCents?: unknown };
    const description = typeof l.description === "string" ? l.description.trim().slice(0, 250) : "";
    const amountCents = typeof l.amountCents === "number" ? Math.round(l.amountCents) : NaN;
    if (!description || !Number.isFinite(amountCents) || amountCents < 100) return null;
    lines.push({ description, amountCents });
  }
  if (lines.reduce((s, l) => s + l.amountCents, 0) > 10_000_000) return null;
  const days = typeof b.daysUntilDue === "number" ? Math.round(b.daysUntilDue) : 14;
  if (days < 1 || days > 90) return null;
  const memo = typeof b.memo === "string" ? b.memo.trim().slice(0, 500) : "";
  return { lines, daysUntilDue: days, memo };
}

/** A billing address the team enters for a client (needed to tax an invoice - a US one in full). */
export type BillingAddress = { line1: string; line2?: string; city: string; state?: string; postal_code: string; country: string };

export function parseAddress(raw: unknown): BillingAddress | null {
  const a = (raw ?? {}) as Record<string, unknown>;
  const s = (k: string, max = 120) => (typeof a[k] === "string" ? (a[k] as string).trim().slice(0, max) : "");
  const country = s("country", 3).toUpperCase();
  const address: BillingAddress = { line1: s("line1"), line2: s("line2") || undefined, city: s("city"), state: s("state") || undefined, postal_code: s("postal_code", 20), country };
  if (!/^[A-Z]{2}$/.test(country) || !address.line1 || !address.city || !address.postal_code) return null;
  if (country === "US" && !address.state) return null;
  return address;
}

/**
 * Writes, finalizes and emails a one-off invoice for a custom quote: the lines in USD before tax, Stripe Tax on top when it
 * is on, due in `daysUntilDue` days, paid on Stripe's hosted page (card or bank transfer, as set in the Dashboard). The
 * invoice carries `purchase_type: custom_invoice`, so the webhook never mistakes it for a video-time pack.
 */
export async function sendCustomInvoice(stripe: Stripe, customerId: string, userId: string, draft: InvoiceDraft, teamUserId: string): Promise<Stripe.Invoice> {
  const tax = lineTax();
  const invoice = await stripe.invoices.create({
    customer: customerId,
    currency: "usd",
    collection_method: "send_invoice",
    days_until_due: draft.daysUntilDue,
    automatic_tax: { enabled: taxEnabled() },
    pending_invoice_items_behavior: "exclude",
    footer: INVOICE_FOOTER,
    ...(draft.memo ? { description: draft.memo } : {}),
    metadata: { user_id: userId, purchase_type: "custom_invoice", created_by: teamUserId },
  });
  for (const line of draft.lines) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      currency: "usd",
      amount: line.amountCents,
      description: line.description,
      ...tax.taxBehavior,
      ...tax.taxCode,
    });
  }
  const finalized = await stripe.invoices.finalizeInvoice(invoice.id ?? "");
  return stripe.invoices.sendInvoice(finalized.id ?? "");
}
