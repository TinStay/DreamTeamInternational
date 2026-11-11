import type Stripe from "stripe";
import { INVOICE_FOOTER, lineTax, taxEnabled } from "@/lib/stripe-tax";
import { hasLiveSubscription } from "@/lib/subscriptions";

/**
 * Orders paid **by invoice** (`purchaseFlow() === "invoice"`, `lib/stripe.ts`): instead of opening Stripe's Checkout from
 * the site, the order becomes a Stripe invoice that Stripe emails to the client; they pay it from the link in the email
 * (Stripe's hosted invoice page, with the payment methods set in the Dashboard), and the webhook's `invoice.paid` does
 * the rest - video seconds for a pack, the request for a paid change, and for a plan its first period **and** the
 * subscription itself (`startInvoicedSubscription`), which then sends an invoice every period.
 *
 * Every such invoice carries `flow: "invoice"` in its metadata. That is what tells it apart from the invoice a Checkout
 * payment issues with the same metadata (which is credited from its checkout session, never from the invoice).
 */
export const INVOICE_FLOW = "invoice";

/** Days a client has to pay an order's invoice (and each renewal's). */
export const INVOICE_DUE_DAYS = 7;

export const isInvoiceOrder = (m: Stripe.Metadata | null | undefined) => m?.flow === INVOICE_FLOW;

export type OrderInvoice = {
  customer: string;
  amountCents: number;
  /** The invoice's one line. */
  line: string;
  /** The memo above the lines (what happens next, the renewal). */
  memo?: string;
  metadata: Stripe.MetadataParam;
  /** The customer already carries their invoice texts (`lib/invoice-profiles.ts`). */
  profiled: boolean;
};

/** Writes, finalizes and emails one order's invoice (USD, before tax; Stripe Tax on top when it is on). */
export async function sendOrderInvoice(stripe: Stripe, order: OrderInvoice): Promise<Stripe.Invoice> {
  const tax = lineTax();
  const invoice = await stripe.invoices.create({
    customer: order.customer,
    currency: "usd",
    collection_method: "send_invoice",
    days_until_due: INVOICE_DUE_DAYS,
    automatic_tax: { enabled: taxEnabled() },
    pending_invoice_items_behavior: "exclude",
    ...(order.profiled ? {} : { footer: INVOICE_FOOTER }),
    ...(order.memo ? { description: order.memo } : {}),
    metadata: { ...order.metadata, flow: INVOICE_FLOW },
  });
  await stripe.invoiceItems.create({
    customer: order.customer,
    invoice: invoice.id,
    currency: "usd",
    amount: order.amountCents,
    description: order.line,
    ...tax.taxBehavior,
    ...tax.taxCode,
  });
  const finalized = await stripe.invoices.finalizeInvoice(invoice.id ?? "");
  return stripe.invoices.sendInvoice(finalized.id ?? "");
}

/**
 * Voids the customer's unpaid order invoices that `match` - ordering a plan again replaces the invoice still waiting,
 * so a client can never pay for two. Returns the order ids they carried. Never throws.
 */
export async function voidOpenOrderInvoices(stripe: Stripe, customer: string, match: (m: Stripe.Metadata) => boolean): Promise<string[]> {
  const orders: string[] = [];
  try {
    const open = await stripe.invoices.list({ customer, status: "open", limit: 30 });
    for (const inv of open.data) {
      const m = inv.metadata ?? {};
      if (!isInvoiceOrder(m) || !match(m) || !inv.id) continue;
      await stripe.invoices.voidInvoice(inv.id);
      if (m.order_id) orders.push(m.order_id);
    }
  } catch {
    /* the new invoice still goes out */
  }
  return orders;
}

/** The Stripe product a plan's subscription is priced on (`kb_plan_<key>`), created on first use. */
export async function planProduct(stripe: Stripe, planKey: string, name: string): Promise<string> {
  const id = `kb_plan_${planKey}`;
  const tax = lineTax();
  const found = await stripe.products.retrieve(id).catch(() => null);
  if (found && !("deleted" in found && found.deleted)) return found.id;
  const created = await stripe.products.create({ id, name: `Keplerbay - ${name}`, ...tax.taxCode }).catch(async () => stripe.products.retrieve(id));
  return created.id;
}

/** One period from `from`, less an hour: Stripe refuses an anchor later than the plan's next natural billing date. */
export function nextPeriodAnchor(interval: "month" | "year", from = new Date()): number {
  const next = new Date(from);
  if (interval === "year") next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return Math.floor(next.getTime() / 1000) - 3600;
}

/**
 * A plan's first invoice was paid: starts the subscription itself. It bills **by invoice** (`send_invoice`) from the next
 * period on - the period just paid is not billed again (`billing_cycle_anchor` a period ahead, no proration) - and carries
 * the plan's metadata, so each paid renewal adds its seconds like any subscription. **Once per invoice**: Stripe sends an
 * event more than once, so the subscription this invoice already started is returned as it is (found on the customer by
 * `first_invoice`), and the request itself is the same every time (the period is counted from when the invoice was paid)
 * under one idempotency key. Never a second plan for a client who already has a live one. Returns the subscription's id,
 * or `null` when none was started.
 */
export async function startInvoicedSubscription(stripe: Stripe, invoice: { id: string; customer: string; metadata: Stripe.Metadata; paidAt?: number | null }, planName: string): Promise<string | null> {
  const m = invoice.metadata;
  const amount = Number.parseInt(m.amount_cents ?? "", 10);
  const interval = m.billing === "annual" ? "year" : "month";
  if (!m.user_id || !m.plan_key || !amount || amount <= 0) return null;
  const existing = await stripe.subscriptions.list({ customer: invoice.customer, status: "all", limit: 30 });
  const started = existing.data.find((sub) => sub.metadata?.first_invoice === invoice.id);
  if (started) return started.id;
  if (await hasLiveSubscription(stripe, m.user_id)) return null;
  const product = await planProduct(stripe, m.plan_key, planName);
  const tax = lineTax();
  const subscription = await stripe.subscriptions.create(
    {
      customer: invoice.customer,
      collection_method: "send_invoice",
      days_until_due: INVOICE_DUE_DAYS,
      billing_cycle_anchor: nextPeriodAnchor(interval, invoice.paidAt ? new Date(invoice.paidAt * 1000) : new Date()),
      proration_behavior: "none",
      automatic_tax: { enabled: taxEnabled() },
      items: [{ price_data: { currency: "usd", unit_amount: amount, recurring: { interval }, product, ...tax.taxBehavior } }],
      metadata: {
        user_id: m.user_id,
        plan_key: m.plan_key,
        seconds: m.seconds ?? "",
        purchase_type: "subscription",
        billing: m.billing ?? "monthly",
        ...(m.order_id ? { order_id: m.order_id } : {}),
        flow: INVOICE_FLOW,
        first_invoice: invoice.id,
      },
    },
    { idempotencyKey: `sub-from-${invoice.id}` },
  );
  return subscription.id;
}
