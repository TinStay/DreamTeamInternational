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
