import type Stripe from "stripe";
import { BRAND_NAME, LEGAL_ENTITY } from "@/lib/brand";
import { EMAIL_PRIMARY } from "@/lib/contact-info";

/**
 * Stripe Tax and the invoice dressing every Keplerbay charge shares - the Checkout sessions (`/api/checkout`, the paid
 * change requests) and the invoices the team sends (`/api/team/invoices`).
 *
 * **Tax is off until `STRIPE_TAX_ENABLED=true`.** Stripe Tax only collects where the account has an *active registration*
 * (Dashboard → Tax → Locations), and with none it silently collects nothing - so the flag is switched on once the head
 * office address (DT A I, Sofia) and the registrations the tax advisor confirms are in the Dashboard. With it on, Stripe
 * works out the tax from the client's billing address and tax ID on every Checkout session and invoice.
 *
 * `STRIPE_TAX_CODE` is the product tax code for the video work (a `txcd_…` from Stripe's list - never guessed here); without
 * it, the account's preset tax code applies. Prices are **tax-exclusive**, the US norm: any tax is added on top.
 */
export function taxEnabled(): boolean {
  return process.env.STRIPE_TAX_ENABLED === "true";
}

/** The configured product tax code, or `undefined` (the account's preset applies). Malformed values are ignored. */
export function taxCode(): string | undefined {
  const code = process.env.STRIPE_TAX_CODE?.trim();
  return code && /^txcd_\d{8}$/.test(code) ? code : undefined;
}

/** Every price is quoted before tax. */
export const TAX_BEHAVIOR = "exclusive" as const;

/** The line under every invoice and receipt: the legal seller behind the brand, and where to write. */
export const INVOICE_FOOTER = `${LEGAL_ENTITY}, trading as ${BRAND_NAME} · Sofia, Bulgaria · ${EMAIL_PRIMARY.label}`;

/**
 * Tags every session in the Dashboard, so the flows can be told apart (Stripe's `integration_identifier`, with a fixed
 * random suffix as Stripe asks).
 */
export const INTEGRATION_ID = { packs: "keplerbay-packs-qmtrwhzk", requests: "keplerbay-requests-qmtrwhzk" } as const;

/**
 * What a Checkout session needs for tax and a proper invoice, for an existing Stripe customer: the billing address is
 * always collected (a US address must be complete to be taxed, and it goes on the invoice) and saved back to the customer,
 * and a business can enter its tax ID - without one Stripe treats a cross-border sale as B2C. In payment mode the session
 * also issues an **invoice** (subscriptions get one each period anyway), carrying the same metadata as the payment.
 */
export function checkoutTaxAndInvoice(
  mode: "payment" | "subscription",
  metadata: Stripe.MetadataParam,
  description?: string,
): Pick<Stripe.Checkout.SessionCreateParams, "automatic_tax" | "billing_address_collection" | "customer_update" | "tax_id_collection" | "invoice_creation"> {
  return {
    automatic_tax: { enabled: taxEnabled() },
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
    tax_id_collection: { enabled: true },
    ...(mode === "payment" ? { invoice_creation: { enabled: true, invoice_data: { metadata, footer: INVOICE_FOOTER, ...(description ? { description } : {}) } } } : {}),
  };
}

/** The tax fields of a Checkout line's `product_data` / `price_data`. */
export function lineTax(): { taxCode: { tax_code?: string }; taxBehavior: { tax_behavior: typeof TAX_BEHAVIOR } } {
  const code = taxCode();
  return { taxCode: code ? { tax_code: code } : {}, taxBehavior: { tax_behavior: TAX_BEHAVIOR } };
}
