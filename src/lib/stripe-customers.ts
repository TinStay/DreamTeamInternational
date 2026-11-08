import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The client's one Stripe customer - the record their invoices, tax ID and billing address live on. It is read from their
 * profile (`profiles.stripe_customer_id`, also set by the subscription webhook) and created on first use, with the
 * account's id in its metadata. A customer deleted in the Dashboard is replaced. Returns `null` without the service role.
 */
export async function customerFor(stripe: Stripe, userId: string, fallback: { email?: string | null; name?: string | null } = {}): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, email, full_name").eq("id", userId).maybeSingle();

  const existing = profile?.stripe_customer_id as string | null | undefined;
  if (existing) {
    const found = await stripe.customers.retrieve(existing).catch(() => null);
    if (found && !("deleted" in found && found.deleted)) return found.id;
  }

  const email = (profile?.email as string | null | undefined) ?? fallback.email ?? undefined;
  const name = (profile?.full_name as string | null | undefined) ?? fallback.name ?? undefined;
  const customer = await stripe.customers.create(
    { email, name, metadata: { user_id: userId }, preferred_locales: ["en"] },
    // Two checkouts opened at once must not make two customers.
    { idempotencyKey: `customer-${userId}-${existing ?? "new"}` },
  );
  await admin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

/**
 * The customer metadata key for the client's choice to keep their saved tax ID between checkouts (`/account`).
 */
export const KEEP_TAX_ID = "keep_tax_id";

/**
 * Lets the client choose again, on every checkout, whether they pay as a business or as a person: Stripe's checkout only
 * offers "I'm purchasing as a business" to a customer with no tax ID saved, so the saved ones are removed first. Skipped
 * while the client has a live subscription - its renewals are taxed on the tax ID it was bought with. The checkout saves
 * whatever the client enters this time, and the webhook writes the matching invoice texts. Never throws.
 */
export async function clearTaxIdsForCheckout(stripe: Stripe, customerId: string): Promise<void> {
  try {
    // The client chose, on their account page, to keep their business details for next time.
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer && customer.deleted) && (customer as Stripe.Customer).metadata?.[KEEP_TAX_ID] === "true") return;
    const ids = await stripe.customers.listTaxIds(customerId, { limit: 20 });
    for (const id of ids.data) await stripe.customers.deleteTaxId(customerId, id.id);
  } catch {
    /* the checkout then simply uses the saved tax ID */
  }
}
