import { paddle, type PaddleTransaction } from "@/lib/paddle";
import { lineItem } from "@/lib/paddle-checkout";
import type { BillingAddress } from "@/lib/paddle-customers";

export type { BillingAddress } from "@/lib/paddle-customers";

/**
 * One invoice, as the client's account page and the team's client window show it. In Paddle every invoice is a
 * **transaction** (Paddle, the merchant of record, issues it): a checkout payment, a renewal, or one the team sent.
 */
export type InvoiceSummary = {
  id: string;
  /** Paddle's invoice number, once issued. */
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
  /** Paddle's checkout for an invoice still to pay. */
  hostedUrl: string | null;
  /** Our route that hands over Paddle's PDF (its links expire, so it is fetched on click - `/api/invoices/[id]/pdf`). */
  pdfUrl: string | null;
};

const STATUS: Record<PaddleTransaction["status"], InvoiceSummary["status"]> = {
  completed: "paid",
  paid: "paid",
  billed: "open",
  past_due: "uncollectible",
  canceled: "void",
  draft: "draft",
  ready: "draft",
};

const DAY_MS = 86_400_000;

export function invoiceSummary(tx: PaddleTransaction): InvoiceSummary {
  const totals = tx.details?.totals;
  const issued = tx.billed_at ?? tx.created_at;
  const terms = tx.billing_details?.payment_terms;
  const dueAt = tx.collection_mode === "manual" && tx.billed_at && terms ? new Date(Date.parse(tx.billed_at) + terms.frequency * (terms.interval === "week" ? 7 : terms.interval === "month" ? 30 : 1) * DAY_MS).toISOString() : null;
  const status = STATUS[tx.status] ?? "draft";
  return {
    id: tx.id,
    number: tx.invoice_number ?? null,
    createdAt: issued,
    dueAt,
    description: tx.billing_details?.additional_information || tx.items?.[0]?.price?.description || null,
    totalCents: Number.parseInt(totals?.grand_total ?? "0", 10) || 0,
    taxCents: Number.parseInt(totals?.tax ?? "0", 10) || 0,
    currency: (tx.currency_code ?? "USD").toLowerCase(),
    status,
    hostedUrl: status === "open" ? (tx.checkout?.url ?? null) : null,
    pdfUrl: tx.invoice_number ? `/api/invoices/${encodeURIComponent(tx.id)}/pdf` : null,
  };
}

/** A customer's invoices, newest first - drafts and abandoned checkouts left out. */
export async function listInvoices(customerId: string, limit = 24): Promise<InvoiceSummary[]> {
  const list = await paddle<PaddleTransaction[]>("GET", "/transactions", undefined, {
    customer_id: customerId,
    status: "billed,paid,completed,past_due,canceled",
    order_by: "created_at[DESC]",
    per_page: limit,
  });
  // A canceled transaction that was never billed is an abandoned checkout, not an invoice.
  return list.filter((tx) => tx.status !== "canceled" || tx.billed_at).map(invoiceSummary);
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
 * Issues a one-off invoice for a custom quote: a **manually collected** Paddle transaction, issued at once (`billed`) - the
 * lines in USD before tax (Paddle adds the tax from the address), due in `daysUntilDue` days, payable through Paddle's
 * checkout link, the memo printed on the invoice. Paddle emails it to the client. It carries
 * `purchase_type: custom_invoice`, so the webhook never mistakes it for a video-time pack.
 */
export async function sendCustomInvoice(customerId: string, addressId: string, userId: string, draft: InvoiceDraft, teamUserId: string): Promise<PaddleTransaction> {
  return paddle<PaddleTransaction>("POST", "/transactions", {
    items: draft.lines.map((l) => lineItem({ name: l.description, description: l.description, amountCents: l.amountCents })),
    customer_id: customerId,
    address_id: addressId,
    currency_code: "USD",
    collection_mode: "manual",
    status: "billed",
    billing_details: {
      enable_checkout: true,
      payment_terms: { interval: "day", frequency: draft.daysUntilDue },
      ...(draft.memo ? { additional_information: draft.memo } : {}),
    },
    custom_data: { user_id: userId, purchase_type: "custom_invoice", created_by: teamUserId },
  });
}
