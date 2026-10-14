import { PLAN_SECONDS } from "@/lib/credits";
import type { PlanKey } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { paddle, paddleEnvironment, type PaddleSubscription } from "@/lib/paddle";
import type { SubscriptionRow } from "@/lib/subscriptions";
import { metadataForPrice, planForPrice, planPriceOf, subscriptionChange } from "@/lib/subscription-events";
import { sendEmail, teamInbox } from "@/lib/email/send";
import { subscriptionClientEmail, subscriptionTeamEmail, type SubscriptionFacts } from "@/lib/email/subscription-emails";

/**
 * Called by the Paddle webhook for every `subscription.*` notification, after the mirror is saved, with the row it
 * replaced. When the change is one a person should hear about (`subscriptionChange` - bought, cancelled, plan changed,
 * ended) the client gets their email and the admin inbox its copy, each once only (the idempotency key names the
 * subscription and what happened).
 *
 * A **plan change** is made by the team in Paddle (a new price on the subscription), which leaves its custom data - the
 * plan and the seconds every renewal credits (`creditDecision`) - on the old plan. So the custom data is brought in step
 * with the new price first, when the price is one of the plans on `/pricing`; a custom price keeps its custom data.
 *
 * Never throws: an email problem must never make Paddle retry the notification.
 */
export async function notifySubscriptionEvent(
  sub: PaddleSubscription,
  previous: SubscriptionRow | null,
  row: SubscriptionRow | null,
  origin: string,
): Promise<void> {
  try {
    if (!row) return;
    const change = subscriptionChange(previous, row);
    if (!change) return;
    const userId = row.user_id;

    const price = planPriceOf(row);
    const meta0 = sub.custom_data ?? {};
    const metaKey = meta0.plan_key && meta0.plan_key in PLAN_SECONDS ? (meta0.plan_key as PlanKey) : null;
    const planKey = (price && planForPrice(price)) ?? metaKey;

    if (change.kind === "changed" && price) {
      const meta = metadataForPrice(price);
      if (meta && (meta.plan_key !== meta0.plan_key || meta.seconds !== meta0.seconds || meta.billing !== meta0.billing)) {
        await paddle("PATCH", `/subscriptions/${encodeURIComponent(sub.id)}`, { custom_data: { ...meta0, ...meta } }).catch((err) =>
          console.error("subscription: custom data sync failed", err),
        );
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
      periodEnd: row.current_period_end,
      subscriptionId: sub.id,
      livemode: paddleEnvironment() === "production",
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
