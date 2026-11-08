import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KEEP_TAX_ID } from "@/lib/stripe-customers";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";

export const runtime = "nodejs";

const isRateLimited = createRateLimiter(60_000, 20);

/** The signed-in client's Stripe customer id, or the response to send instead. */
async function clientCustomer(): Promise<{ userId: string; customer: string | null } | NextResponse> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const admin = createAdminClient();
  if (!admin) return { userId: auth.user.id, customer: null };
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", auth.user.id).maybeSingle();
  return { userId: auth.user.id, customer: profile?.stripe_customer_id ? String(profile.stripe_customer_id) : null };
}

/**
 * `GET` - the business details saved from the client's last checkout (the business name and tax ID) and whether they
 * chose to keep them for the next one. `POST { keep: boolean }` - that choice (`keep_tax_id` on the Stripe customer).
 * Without a choice the checkout asks "business or person" afresh every time (`clearTaxIdsForCheckout`).
 */
export async function GET() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ taxId: null, keep: false });
  const me = await clientCustomer();
  if (me instanceof NextResponse) return me;
  if (!me.customer) return NextResponse.json({ taxId: null, keep: false });
  try {
    const customer = await stripe.customers.retrieve(me.customer, { expand: ["tax_ids"] });
    if ("deleted" in customer && customer.deleted) return NextResponse.json({ taxId: null, keep: false });
    const first = customer.tax_ids?.data[0];
    return NextResponse.json({
      taxId: first ? { type: first.type, value: first.value, country: first.country ?? null } : null,
      business: customer.name ?? null,
      keep: customer.metadata?.[KEEP_TAX_ID] === "true",
    });
  } catch {
    return NextResponse.json({ taxId: null, keep: false });
  }
}

export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const me = await clientCustomer();
  if (me instanceof NextResponse) return me;
  if (!me.customer) return NextResponse.json({ error: "no_customer" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { keep?: unknown };
  if (typeof body.keep !== "boolean") return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await stripe.customers.update(me.customer, { metadata: { [KEEP_TAX_ID]: body.keep ? "true" : "" } });
    return NextResponse.json({ keep: body.keep });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
