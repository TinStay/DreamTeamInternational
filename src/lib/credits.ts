import type { PlanKey } from "@/lib/pricing";

/**
 * The video seconds each pack puts in a client's account: a Personal pack is one order of up to 20 seconds; the monthly
 * plans give their seconds every month (a year of them at once on annual billing). Enterprise is custom: the team adds
 * its seconds by hand. Keep in step with the plan cards (`plans.tiers` volume lines).
 */
export const PLAN_SECONDS: Record<PlanKey, number> = {
  personal: 20,
  creator: 40,
  pro: 60,
  local: 90,
  brand: 180,
  enterprise: 0,
};

/** One row of the `credit_ledger` table (supabase/credits.sql). */
export type LedgerEntry = {
  seconds: number;
  kind: "purchase" | "spend" | "refund" | "adjustment";
  plan_key: string | null;
  created_at: string;
};

export type CreditSummary = {
  /** Seconds the client can spend now. */
  balance: number;
  /** Everything ever added (purchases, refunds, gifts) - the bar's full length. */
  added: number;
  /** The pack they last bought, if any. */
  planKey: PlanKey | null;
};

export const EMPTY_CREDITS: CreditSummary = { balance: 0, added: 0, planKey: null };

export function summarizeLedger(entries: LedgerEntry[]): CreditSummary {
  let balance = 0;
  let added = 0;
  let last: { at: string; key: string } | null = null;
  for (const e of entries) {
    balance += e.seconds;
    if (e.seconds > 0) added += e.seconds;
    if (e.kind === "purchase" && e.plan_key && (!last || e.created_at > last.at)) last = { at: e.created_at, key: e.plan_key };
  }
  const planKey = last && last.key in PLAN_SECONDS ? (last.key as PlanKey) : null;
  return { balance, added, planKey };
}
