import { PLAN_SECONDS } from "@/lib/credits";
import { formatDateDisplay } from "@/lib/dates";
import { getDictionary } from "@/lib/i18n/config";
import type { PlanKey } from "@/lib/pricing";
import { accountPath, myProjectsPath, pricingPath, teamPath } from "@/lib/routes";
import { planForPrice, type PlanPrice, type SubscriptionChange } from "@/lib/subscription-events";
import { renderBrandEmail, type EmailButton, type EmailFact } from "@/lib/email/layout";
import { clientEmail, copy, fill, type ProjectEmail } from "@/lib/email/compose";

/**
 * The emails a subscription sends - bought, cancelled, upgraded / downgraded, ended - to the client, with a copy for the
 * admin inbox. Built from the subscription as Stripe reports it in the webhook; copy in `en.ts` (`emails.subscription`).
 */

export type SubscriptionFacts = {
  change: SubscriptionChange;
  /** The plan now (matched from the price, else the subscription's metadata) - `null` for a custom price. */
  planKey: PlanKey | null;
  price: PlanPrice | null;
  /** End of the paid period (ISO): the renewal date, or the last day of a cancelled plan. */
  periodEnd: string | null;
  subscriptionId: string;
  livemode: boolean;
};

const planName = (key: PlanKey | null) => {
  const tiers = getDictionary("en").plans.tiers as Record<string, { name: string }>;
  return (key && tiers[key]?.name) || copy().subscription.customPlan;
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

/** "45 sec", "1 min 30 sec", "3 min". */
const duration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m === 0 ? `${s} sec` : s === 0 ? `${m} min` : `${m} min ${s} sec`;
};

function planFacts(f: SubscriptionFacts, extra: EmailFact[] = []): EmailFact[] {
  const c = copy().subscription;
  const rows: EmailFact[] = [{ label: c.facts.plan, value: planName(f.planKey) }];
  if (f.price) {
    rows.push({ label: c.facts.billing, value: c.billing[f.price.interval === "year" ? "annual" : "monthly"] });
    rows.push({ label: c.facts.price, value: fill(f.price.interval === "year" ? c.perYear : c.perMonth, { price: money(f.price.amountCents) }) });
  }
  const secs = f.planKey ? PLAN_SECONDS[f.planKey] : 0;
  if (secs) rows.push({ label: c.facts.videoTime, value: fill(c.videoTimeMonthly, { time: duration(secs) }) });
  return [...rows, ...extra];
}

/** Which copy block the change reads as. */
function variant(change: SubscriptionChange): "started" | "cancelled" | "upgraded" | "downgraded" | "ended" {
  if (change.kind === "changed") return change.upgrade ? "upgraded" : "downgraded";
  return change.kind;
}

/** The plan before a change: its name, from the old price. */
function fromName(change: SubscriptionChange) {
  return change.kind === "changed" ? planName(planForPrice(change.from)) : "";
}

export function subscriptionClientEmail(f: SubscriptionFacts, name: string | null, origin: string): ProjectEmail {
  const c = copy().subscription;
  const v = variant(f.change);
  const block = c[v];
  const date = f.periodEnd ? formatDateDisplay(f.periodEnd.slice(0, 10)) : null;
  const values = { plan: planName(f.planKey), from: fromName(f.change), date: date ?? "" };

  const extra: EmailFact[] = [];
  if (f.change.kind === "changed") extra.unshift({ label: c.facts.previous, value: values.from });
  if (date && (v === "started" || v === "upgraded" || v === "downgraded")) extra.push({ label: c.facts.renews, value: date });
  if (date && v === "cancelled") extra.push({ label: c.facts.endsOn, value: date });

  const projects = `${origin}${myProjectsPath("en")}`;
  const account = `${origin}${accountPath("en")}`;
  const buttons: EmailButton[] =
    v === "cancelled"
      ? [{ label: c.buttons.resume, href: account }]
      : v === "ended"
        ? [{ label: c.buttons.plans, href: `${origin}${pricingPath("en")}` }]
        : [
            { label: c.buttons.start, href: projects },
            { label: c.buttons.manage, href: account, variant: "secondary" },
          ];

  return clientEmail(
    fill(block.subject, values),
    name,
    {
      eyebrow: block.eyebrow,
      title: fill(block.title, values),
      paragraphs: [fill(block.intro, values), fill(block.body, values)],
      facts: v === "ended" ? undefined : planFacts(f, extra),
      buttons,
    },
    [copy().help, c.reason],
  );
}

export function subscriptionTeamEmail(f: SubscriptionFacts, client: { name: string | null; email: string | null }, origin: string): ProjectEmail {
  const e = copy();
  const c = e.subscription;
  const v = variant(f.change);
  const block = c.team[v];
  const who = client.name?.trim() || client.email || "A client";
  const values = { plan: planName(f.planKey), from: fromName(f.change), client: who, date: f.periodEnd ? formatDateDisplay(f.periodEnd.slice(0, 10)) : "" };
  const stripeUrl = `https://dashboard.stripe.com/${f.livemode ? "" : "test/"}subscriptions/${f.subscriptionId}`;
  const extra: EmailFact[] = [{ label: c.facts.client, value: client.email ? `${who} (${client.email})` : who }];
  if (f.change.kind === "changed") extra.unshift({ label: c.facts.previous, value: values.from });
  const { html, text } = renderBrandEmail({
    preheader: fill(block.title, values),
    eyebrow: c.team.eyebrow,
    title: fill(block.title, values),
    paragraphs: v === "cancelled" ? [fill(c.team.cancelled.note, values)] : [],
    facts: planFacts(f, extra),
    buttons: [
      { label: c.buttons.stripe, href: stripeUrl },
      { label: e.buttons.team, href: `${origin}${teamPath("en")}`, variant: "secondary" },
    ],
    footnotes: [e.teamReason],
  });
  return { subject: fill(block.subject, values), html, text };
}
