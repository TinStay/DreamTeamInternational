import Stripe from "stripe";

let client: Stripe | null = null;

/** The Stripe client, or `null` while `STRIPE_SECRET_KEY` is not set (payments are simply off until it is). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}
