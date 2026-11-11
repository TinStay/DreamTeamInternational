import type Stripe from "stripe";
import { parseAddress, type BillingAddress } from "@/lib/invoices";
import { COMPANY_NUMBER_KEY } from "@/lib/company-details";

/**
 * Who an order's invoice is addressed to: the client's name and billing address, entered in the order window
 * (`invoice-order-dialog.tsx`) and saved on their Stripe customer - Stripe Tax works the tax out from the address, and it
 * is printed on the invoice. A **company** saved on the account page (`lib/company-details.ts`) keeps its own name: only
 * the address is taken then.
 */
export type BillingDetails = { name: string; address: BillingAddress };

export function parseBillingDetails(raw: unknown): BillingDetails | null {
  const b = (raw ?? {}) as { name?: unknown; address?: unknown };
  const address = parseAddress(b.address);
  if (!address) return null;
  const name = typeof b.name === "string" ? b.name.trim().replace(/\s+/g, " ").slice(0, 120) : "";
  return { name, address };
}

const isCompany = (customer: Stripe.Customer) => Boolean(customer.metadata?.[COMPANY_NUMBER_KEY]) || customer.tax_exempt === "reverse";

/** The details Stripe holds for a customer - `address` is `null` until it is complete enough to invoice. Never throws. */
export async function billingDetailsOf(stripe: Stripe, customerId: string): Promise<{ name: string; address: BillingAddress | null; company: boolean } | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return null;
    return { name: customer.name ?? "", address: parseAddress(customer.address), company: isCompany(customer) };
  } catch {
    return null;
  }
}

/** Saves the details on the customer; a person needs a name (2+ characters), a company keeps its own. False when refused. */
export async function saveBillingDetails(stripe: Stripe, customerId: string, details: BillingDetails): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return false;
    const company = isCompany(customer);
    if (!company && details.name.length < 2) return false;
    const a = details.address;
    await stripe.customers.update(customerId, {
      address: { line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state ?? "", postal_code: a.postal_code, country: a.country },
      ...(company ? {} : { name: details.name }),
    });
    return true;
  } catch {
    return false;
  }
}
