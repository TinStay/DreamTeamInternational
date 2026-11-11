import Stripe from "stripe";

let client: Stripe | null = null;

/** The Stripe client, or `null` while `STRIPE_SECRET_KEY` is not set (payments are simply off until it is). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

/**
 * `PAYMENTS_PAUSED=true` (Vercel) stops new self-service checkouts - the pricing page then says payments are not
 * switched on yet - while everything else keeps working: the webhook, subscriptions already running, cancel / resume,
 * and the invoices the team sends.
 */
export function paymentsPaused(): boolean {
  return process.env.PAYMENTS_PAUSED === "true";
}

/**
 * How a client pays. `invoice` (the default): the order becomes a Stripe **invoice sent to their email**, paid from the
 * link in it - nothing is paid on the site itself. `checkout`: Stripe's hosted Checkout page opens straight from the
 * site (set `PURCHASE_FLOW=checkout`).
 */
export function purchaseFlow(): "invoice" | "checkout" {
  return process.env.PURCHASE_FLOW === "checkout" ? "checkout" : "invoice";
}
