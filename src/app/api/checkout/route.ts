import { NextResponse } from "next/server";
import { checkoutFor, isBilling } from "@/lib/checkout";
import { getDictionary } from "@/lib/i18n/config";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/**
 * Starts buying a pack: for the signed-in client, creates a Stripe Checkout session for the chosen plan (price and seconds
 * come from `lib/pricing.ts` / `lib/credits.ts`, never from the browser) and returns its address to go to. The seconds
 * are added by the webhook (`/api/stripe/webhook`) once Stripe confirms the payment.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { plan?: unknown; billing?: unknown };
  const spec = checkoutFor(String(body.plan ?? ""), isBilling(body.billing) ? body.billing : "monthly");
  if (!spec) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

  const name = (getDictionary("en").plans.tiers as Record<string, { name: string }>)[spec.planKey]?.name ?? spec.planKey;
  const origin = new URL(request.url).origin;
  const metadata = { user_id: auth.user.id, plan_key: spec.planKey, seconds: String(spec.seconds) };

  const session = await stripe.checkout.sessions.create({
    mode: spec.oneTime ? "payment" : "subscription",
    customer_email: auth.user.email ?? undefined,
    client_reference_id: auth.user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: spec.amountCents,
          product_data: { name: `IzI Video - ${name}`, description: `${spec.seconds} seconds of AI video` },
          ...(spec.oneTime ? {} : { recurring: { interval: spec.interval } }),
        },
      },
    ],
    metadata,
    ...(spec.oneTime ? { payment_intent_data: { metadata } } : { subscription_data: { metadata } }),
    success_url: `${origin}/en/my-projects?purchase=success`,
    cancel_url: `${origin}/en/pricing?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
