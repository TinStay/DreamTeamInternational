import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PLAN_SECONDS } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Purchase = { userId: string; seconds: number; planKey: string; ref: string; note: string };

/** Adds a purchase to the ledger; the same payment (`ref`) is only ever credited once. Returns false on a real failure. */
async function credit(p: Purchase): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("credit_ledger").insert({
    user_id: p.userId,
    seconds: p.seconds,
    kind: "purchase",
    plan_key: p.planKey,
    note: p.note,
    external_ref: p.ref,
  });
  // 23505 = this payment was already credited (Stripe sends events more than once): fine.
  return !error || error.code === "23505";
}

const fromMetadata = (m: Stripe.Metadata | null | undefined, ref: string, note: string): Purchase | null => {
  const seconds = Number.parseInt(m?.seconds ?? "", 10);
  const planKey = m?.plan_key ?? "";
  if (!m?.user_id || !seconds || !(planKey in PLAN_SECONDS)) return null;
  return { userId: m.user_id, seconds, planKey, ref, note };
};

/**
 * Stripe tells us a payment happened; this adds the pack's video seconds to the client's account. A one-time pack is
 * credited when its checkout completes and is paid, a subscription each time an invoice is paid (the first month too, and
 * every renewal). The signature is verified with `STRIPE_WEBHOOK_SECRET`, so only Stripe can call this.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  let purchase: Purchase | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "payment" && session.payment_status === "paid") {
      purchase = fromMetadata(session.metadata, session.id, "Pack purchase");
    }
  } else if (event.type === "invoice.paid") {
    const invoice = event.data.object as unknown as {
      id: string;
      subscription?: string | { id: string } | null;
      parent?: { subscription_details?: { subscription?: string | { id: string } } } | null;
    };
    const sub = invoice.parent?.subscription_details?.subscription ?? invoice.subscription;
    const subscriptionId = typeof sub === "string" ? sub : sub?.id;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      purchase = fromMetadata(subscription.metadata, invoice.id, "Subscription payment");
    }
  }

  if (purchase && !(await credit(purchase))) {
    // Let Stripe retry: better a late credit than a paid client with no seconds.
    return NextResponse.json({ error: "credit_failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
