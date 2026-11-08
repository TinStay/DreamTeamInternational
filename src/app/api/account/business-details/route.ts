import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KEEP_TAX_ID, customerFor } from "@/lib/stripe-customers";
import { COMPANY_COUNTRY_KEY, COMPANY_NUMBER_KEY, parseCompany, removeCompany, saveCompany } from "@/lib/company-details";
import { applyInvoiceProfile } from "@/lib/invoice-profiles";
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
 * The client's business details (`business-details-card.tsx`):
 * - `GET` - the company saved on their Stripe customer (name, country, company / VAT number) and whether the next
 *   checkout keeps them.
 * - `POST { company: { name, country, number } }` - saves a company (`lib/company-details.ts`): a company outside
 *   Bulgaria is then charged no VAT. `POST { keep }` - keep the details for the next checkout, or be asked every time.
 * - `DELETE` - removes the company; the client is taxed as a person again.
 */
export async function GET() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ company: null, keep: false });
  const me = await clientCustomer();
  if (me instanceof NextResponse) return me;
  if (!me.customer) return NextResponse.json({ company: null, keep: false });
  try {
    const customer = await stripe.customers.retrieve(me.customer, { expand: ["tax_ids"] });
    if ("deleted" in customer && customer.deleted) return NextResponse.json({ company: null, keep: false });
    const vat = customer.tax_ids?.data[0];
    const number = customer.metadata?.[COMPANY_NUMBER_KEY] || vat?.value || "";
    const country = customer.metadata?.[COMPANY_COUNTRY_KEY] || vat?.country || customer.address?.country || "";
    const company = number ? { name: customer.name ?? "", country, number } : null;
    return NextResponse.json({ company, keep: customer.metadata?.[KEEP_TAX_ID] === "true" });
  } catch {
    return NextResponse.json({ company: null, keep: false });
  }
}

export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const me = await clientCustomer();
  if (me instanceof NextResponse) return me;
  // A client who has never paid has no Stripe customer yet: their company details create it.
  const customer = me.customer ?? (await customerFor(stripe, me.userId));
  if (!customer) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { keep?: unknown; company?: unknown };

  if (body.company !== undefined) {
    const company = parseCompany(body.company);
    if (typeof company === "string") return NextResponse.json({ error: company }, { status: 400 });
    try {
      await saveCompany(stripe, customer, company);
    } catch (err) {
      if (err instanceof Error && err.message === "invalid_vat") return NextResponse.json({ error: "invalid_vat" }, { status: 400 });
      return NextResponse.json({ error: "failed" }, { status: 502 });
    }
    await applyInvoiceProfile(stripe, customer);
    return NextResponse.json({ company, keep: true });
  }

  if (typeof body.keep !== "boolean") return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await stripe.customers.update(customer, {
      metadata: { [KEEP_TAX_ID]: body.keep ? "true" : "" },
      // Not kept: the next checkout asks again, and the client is taxed as a person until they say otherwise.
      ...(body.keep ? {} : { tax_exempt: "none" as const }),
    });
    return NextResponse.json({ keep: body.keep });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const me = await clientCustomer();
  if (me instanceof NextResponse) return me;
  if (!me.customer) return NextResponse.json({ company: null, keep: false });
  try {
    await removeCompany(stripe, me.customer);
    await applyInvoiceProfile(stripe, me.customer);
    return NextResponse.json({ company: null, keep: false });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
