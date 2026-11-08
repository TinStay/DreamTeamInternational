import type Stripe from "stripe";
import { PLAN_SECONDS } from "@/lib/credits";
import type { PlanKey } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionRow } from "@/lib/subscriptions";
import { metadataForPrice, planForPrice, planPriceOf, subscriptionChange } from "@/lib/subscription-events";
import { sendEmail, teamInbox } from "@/lib/email/send";
import { subscriptionClientEmail, subscriptionTeamEmail, type SubscriptionFacts } from "@/lib/email/subscription-emails";

/**
 * Called by the Stripe webhook for every `customer.subscription.*` event, after the mirror is saved. When the event is one
 * a person should hear about (`subscriptionChange` - bought, cancelled, plan changed, ended) the client gets their email
 * and the admin inbox its copy, each once only (the idempotency key names the subscription and what happened).
 *
 * A **plan change** is made by the team in Stripe (swapping the price), which leaves the subscription's metadata - the
 * plan and the seconds every payment credits (`creditDecision`) - on the old plan. So the metadata is brought in step
 * with the new price first, when the price is one of the plans on `/pricing`; a custom price keeps its metadata.
 *
 * Never throws: an email problem must never make Stripe retry the event.
 */
export async function notifySubscriptionEvent(stripe: Stripe, event: Stripe.Event, origin: string): Promise<void> {
  try {
    const change = subscriptionChange(event);
    if (!change) return;
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.user_id;
    if (!userId) return;

    const price = planPriceOf(sub.items as unknown as Parameters<typeof planPriceOf>[0]);
    const metaKey = sub.metadata?.plan_key && sub.metadata.plan_key in PLAN_SECONDS ? (sub.metadata.plan_key as PlanKey) : null;
    const planKey = (price && planForPrice(price)) ?? metaKey;

    if (change.kind === "changed" && price) {
      const meta = metadataForPrice(price);
      if (meta && (meta.plan_key !== sub.metadata?.plan_key || meta.seconds !== sub.metadata?.seconds || meta.billing !== sub.metadata?.billing)) {
        await stripe.subscriptions.update(sub.id, { metadata: { ...sub.metadata, ...meta } }).catch((err) => console.error("subscription: metadata sync failed", err));
      }
    }

    const admin = createAdminClient();
    const { data: profile } = admin ? await admin.from("profiles").select("email, full_name").eq("id", userId).maybeSingle() : { data: null };
    const email = (profile?.email as string | null | undefined) ?? null;
    const name = (profile?.full_name as string | null | undefined) ?? null;

    const facts: SubscriptionFacts = {
      change,
      planKey,
      price,
      periodEnd: subscriptionRow(sub)?.current_period_end ?? null,
      subscriptionId: sub.id,
      livemode: event.livemode,
    };
    const what = change.kind === "changed" ? `changed:${change.to.amountCents}-${change.to.interval}` : change.kind === "cancelled" ? `cancelled:${facts.periodEnd ?? ""}` : change.kind;

    if (email) {
      await sendEmail({
        to: email,
        ...subscriptionClientEmail(facts, name, origin),
        idempotencyKey: `sub:${sub.id}:${what}`,
        tags: [{ name: "kind", value: `subscription_${change.kind}` }],
      });
    }
    await sendEmail({
      to: teamInbox(),
      ...subscriptionTeamEmail(facts, { name, email }, origin),
      replyTo: email ?? undefined,
      idempotencyKey: `team-sub:${sub.id}:${what}`,
      tags: [{ name: "kind", value: `team_subscription_${change.kind}` }],
    });
  } catch (err) {
    console.error("subscription: notification failed", err);
  }
}
