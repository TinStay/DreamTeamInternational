import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountPageView, type AccountOrder, type AccountSubscription } from "@/components/account-page-view";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { requireAccount } from "@/lib/supabase/account-page";
import { createClient } from "@/lib/supabase/server";
import type { ProfileFields } from "@/lib/clients";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { listInvoices, type InvoiceSummary } from "@/lib/invoices";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // A private page: out of the search index.
  return { title: getDictionary(lang).account.metaTitle, robots: { index: false, follow: false } };
}

/**
 * `/account` - Account & subscription, the one page for the profile and the account (`/profile` redirects here): who
 * they are, their editable details (`profiles`), their plan, video time and subscription (`subscriptions`, mirrored
 * from Stripe), their orders, their invoices (Stripe), and how to delete the account. Signed-out visitors go to the home page. A table that is not there yet
 * (profiles.sql / delivery.sql not run) just leaves its part out.
 */
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const info = await requireAccount(lang);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? "";

  const { data: row, error: profileError } = await supabase.from("profiles").select("full_name, company, phone, country").eq("id", uid).maybeSingle();
  const fields: ProfileFields | null =
    profileError || !row ? null : { fullName: row.full_name ?? info.name, company: row.company ?? "", phone: row.phone ?? "", country: row.country ?? "" };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_key, status, current_period_end, cancel_at_period_end")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const subscription: AccountSubscription | null = sub
    ? {
        planKey: sub.plan_key ?? null,
        status: String(sub.status),
        periodEnd: sub.current_period_end ?? null,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      }
    : null;

  // Their orders, newest first (supabase/orders.sql) - one-time or subscription, plan, seconds, amount, status.
  const { data: orderRows } = await supabase
    .from("orders")
    .select("id, plan_key, purchase_type, billing, seconds, amount_cents, currency, status, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(20);
  const orders: AccountOrder[] = (orderRows ?? []).map((o) => ({
    id: String(o.id),
    planKey: String(o.plan_key),
    oneTime: o.purchase_type === "one_time",
    billing: o.billing ?? null,
    seconds: Number(o.seconds) || 0,
    amountCents: Number(o.amount_cents) || 0,
    currency: String(o.currency ?? "usd"),
    status: String(o.status),
    createdAt: String(o.created_at),
  }));

  // Their invoices, straight from Stripe (one per payment, plus any the team sent) - nothing without Stripe or a customer yet.
  let invoices: InvoiceSummary[] = [];
  const stripe = getStripe();
  const admin = createAdminClient();
  if (stripe && admin) {
    const { data: p } = await admin.from("profiles").select("stripe_customer_id").eq("id", uid).maybeSingle();
    if (p?.stripe_customer_id) invoices = await listInvoices(stripe, String(p.stripe_customer_id)).catch(() => []);
  }

  return <AccountPageView info={info} fields={fields} subscription={subscription} orders={orders} invoices={invoices} />;
}
