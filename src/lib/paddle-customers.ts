import { paddle, PaddleError } from "@/lib/paddle";
import { createAdminClient } from "@/lib/supabase/admin";

type Customer = { id: string; email: string; status?: string };

/**
 * The client's one Paddle customer - the record their transactions, invoices, billing address and tax ID live on. It is
 * read from their profile (`profiles.paddle_customer_id`, also set by the subscription webhook) and created on first use,
 * with the account's id in its custom data. Paddle keeps one customer per email, so when one exists already (a purchase
 * made before the id was saved) it is looked up by email and adopted. Returns `null` without the service role or an email.
 */
export async function customerFor(userId: string, fallback: { email?: string | null; name?: string | null } = {}): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: profile } = await admin.from("profiles").select("paddle_customer_id, email, full_name").eq("id", userId).maybeSingle();

  const existing = profile?.paddle_customer_id as string | null | undefined;
  if (existing) {
    const found = await paddle<Customer>("GET", `/customers/${encodeURIComponent(existing)}`).catch(() => null);
    if (found && found.status !== "archived") return found.id;
  }

  const email = ((profile?.email as string | null | undefined) ?? fallback.email ?? "").trim();
  if (!email) return null;
  const name = (profile?.full_name as string | null | undefined) ?? fallback.name ?? undefined;
  let id: string;
  try {
    const created = await paddle<Customer>("POST", "/customers", { email, ...(name ? { name } : {}), locale: "en", custom_data: { user_id: userId } });
    id = created.id;
  } catch (err) {
    // One customer per email in Paddle: adopt the one already there.
    if (!(err instanceof PaddleError) || err.code !== "customer_already_exists") throw err;
    const list = await paddle<Customer[]>("GET", "/customers", undefined, { email });
    if (!list[0]) throw err;
    id = list[0].id;
  }
  await admin.from("profiles").update({ paddle_customer_id: id }).eq("id", userId);
  return id;
}

/** A billing address on the customer (Paddle needs one to issue an invoice the team sends - `lib/invoices.ts`). */
export type BillingAddress = { line1: string; line2?: string; city: string; state?: string; postal_code: string; country: string };

/** The customer's first active address id, or `null`. */
export async function addressIdFor(customerId: string): Promise<string | null> {
  const list = await paddle<{ id: string }[]>("GET", `/customers/${encodeURIComponent(customerId)}/addresses`, undefined, { status: "active" }).catch(() => []);
  return list[0]?.id ?? null;
}

/** Adds an address to the customer and returns its id. */
export async function addAddress(customerId: string, a: BillingAddress): Promise<string> {
  const created = await paddle<{ id: string }>("POST", `/customers/${encodeURIComponent(customerId)}/addresses`, {
    country_code: a.country,
    first_line: a.line1,
    ...(a.line2 ? { second_line: a.line2 } : {}),
    city: a.city,
    ...(a.state ? { region: a.state } : {}),
    postal_code: a.postal_code,
  });
  return created.id;
}
