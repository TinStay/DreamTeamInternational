import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceSummary } from "@/lib/invoices";
import { createRateLimiter } from "@/lib/server/form-guards";

export const runtime = "nodejs";

// The header asks on load and when the window regains focus - a handful a minute per client is plenty.
const isRateLimited = createRateLimiter(60_000, 12);

/**
 * `GET` - the signed-in client's invoices waiting to be paid (Stripe status `open`), for the header's invoice notice
 * (`invoice-notice.tsx`): number, total, due date and Stripe's page to pay on. Empty when there is nothing to pay, no
 * Stripe customer yet, or payments are not configured - the notice then simply does not show.
 */
export async function GET() {
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return NextResponse.json({ invoices: [] });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", auth.user.id).maybeSingle();
  const customer = profile?.stripe_customer_id ? String(profile.stripe_customer_id) : null;
  if (!customer) return NextResponse.json({ invoices: [] });

  try {
    const page = await stripe.invoices.list({ customer, status: "open", limit: 10 });
    const invoices = page.data
      .map(invoiceSummary)
      .filter((inv) => inv.hostedUrl)
      .map(({ id, number, totalCents, currency, dueAt, description, hostedUrl }) => ({ id, number, totalCents, currency, dueAt, description, hostedUrl }));
    return NextResponse.json({ invoices }, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return NextResponse.json({ invoices: [] });
  }
}
