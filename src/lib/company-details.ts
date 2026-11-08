import type Stripe from "stripe";
import { EU_COUNTRIES } from "@/lib/invoice-profiles";
import { KEEP_TAX_ID } from "@/lib/stripe-customers";

/**
 * A client's company, entered on their account page (`business-details-card.tsx`) **before** they order - the only way
 * Stripe can know a buyer is a company where it has no tax ID to ask for at checkout (the US, for one: an EIN does not
 * change Stripe Tax; only a reverse-charge customer does, checked 08-11-2026).
 *
 * - In Bulgaria: the VAT number is optional and VAT is charged (20%).
 * - In the EU outside Bulgaria: the EU VAT number is required - with it Stripe reverses the VAT itself.
 * - Outside the EU: a company number of any format; the customer becomes `tax_exempt: reverse`, so no VAT
 *   (чл. 21, ал. 2 ЗДДС).
 *
 * Saving also keeps the details for the next checkouts (`keep_tax_id`); removing them puts the customer back to "asked
 * every time" and taxed as a person until they say otherwise.
 */
export type CompanyInput = { name: string; country: string; number: string };
export type CompanyError = "invalid_name" | "invalid_country" | "invalid_number" | "vat_required" | "invalid_vat";

export const COMPANY_NUMBER_KEY = "company_number";
export const COMPANY_COUNTRY_KEY = "company_country";

export function parseCompany(raw: unknown): CompanyInput | CompanyError {
  const b = (raw ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim().replace(/\s+/g, " ") : "";
  const country = typeof b.country === "string" ? b.country.trim().toUpperCase() : "";
  const number = typeof b.number === "string" ? b.number.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 120) return "invalid_name";
  if (!/^[A-Z]{2}$/.test(country)) return "invalid_country";
  if (number && (number.length < 3 || number.length > 40 || !/^[A-Za-z0-9 .\-/]+$/.test(number))) return "invalid_number";
  if (country !== "BG" && EU_COUNTRIES.has(country) && !number) return "vat_required";
  if (!EU_COUNTRIES.has(country) && !number) return "invalid_number";
  return { name, country, number };
}

/** An EU VAT number with its country prefix (a German `123456789` becomes `DE123456789`; Greece uses `EL`). */
export function euVatValue(country: string, number: string): string {
  const prefix = country === "GR" ? "EL" : country;
  const compact = number.replace(/[\s.\-/]/g, "").toUpperCase();
  return compact.startsWith(prefix) ? compact : `${prefix}${compact}`;
}

/** Writes the company onto the Stripe customer. Throws `invalid_vat` when Stripe refuses an EU VAT number. */
export async function saveCompany(stripe: Stripe, customerId: string, company: CompanyInput): Promise<void> {
  const ids = await stripe.customers.listTaxIds(customerId, { limit: 20 });
  for (const id of ids.data) await stripe.customers.deleteTaxId(customerId, id.id);
  const inEu = EU_COUNTRIES.has(company.country);
  if (inEu && company.number) {
    try {
      await stripe.customers.createTaxId(customerId, { type: "eu_vat", value: euVatValue(company.country, company.number) });
    } catch {
      throw new Error("invalid_vat");
    }
  }
  await stripe.customers.update(customerId, {
    name: company.name,
    // Outside the EU Stripe has no tax ID to go on, so the customer itself is marked reverse-charge: no VAT.
    tax_exempt: inEu ? "none" : "reverse",
    metadata: { [KEEP_TAX_ID]: "true", [COMPANY_NUMBER_KEY]: company.number, [COMPANY_COUNTRY_KEY]: company.country },
  });
}

/** Removes the company: no tax IDs, taxed as a person, asked "business or person" on every checkout again. */
export async function removeCompany(stripe: Stripe, customerId: string): Promise<void> {
  const ids = await stripe.customers.listTaxIds(customerId, { limit: 20 });
  for (const id of ids.data) await stripe.customers.deleteTaxId(customerId, id.id);
  await stripe.customers.update(customerId, { tax_exempt: "none", metadata: { [KEEP_TAX_ID]: "", [COMPANY_NUMBER_KEY]: "", [COMPANY_COUNTRY_KEY]: "" } });
}
