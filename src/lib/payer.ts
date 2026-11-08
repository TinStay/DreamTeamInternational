/**
 * Who pays a checkout - asked on the pricing page before Stripe opens (`payer-dialog.tsx`), because Stripe cannot tell a
 * company from a person where it has no tax ID to collect (the US, for one):
 *
 * - `person` - Bulgarian VAT (Stripe Tax: 20% in Bulgaria, to EU persons and to persons outside the EU - video
 *   production is a general service, чл. 21, ал. 1 ЗДДС).
 * - `company_bg` - a company in Bulgaria: 20% VAT; its VAT number is optional.
 * - `company_abroad` - a company outside Bulgaria: no VAT (чл. 21, ал. 2 ЗДДС), whether or not it has a VAT number -
 *   the customer is marked `tax_exempt: reverse`, so Stripe Tax charges 0% with the reverse-charge note. Its business
 *   name is required.
 *
 * Plain module - the browser imports it too.
 */
export const PAYER_TYPES = ["person", "company_bg", "company_abroad"] as const;
export type PayerType = (typeof PAYER_TYPES)[number];

export function isPayerType(value: unknown): value is PayerType {
  return typeof value === "string" && (PAYER_TYPES as readonly string[]).includes(value);
}

/** What the Stripe customer is set to before the checkout opens. */
export function payerCustomerSettings(payer: PayerType): { tax_exempt: "none" | "reverse"; metadata: { payer_type: PayerType } } {
  return { tax_exempt: payer === "company_abroad" ? "reverse" : "none", metadata: { payer_type: payer } };
}
