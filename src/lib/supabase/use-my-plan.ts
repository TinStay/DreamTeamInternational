"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isLiveStatus } from "@/lib/subscription-status";
import type { Billing } from "@/lib/pricing";

/** Exactly what the signed-in client bought, for the plan card and the plan details window. */
export type MyPlan =
  | {
      kind: "subscription";
      planKey: string;
      status: string;
      billing: Billing | null;
      /** Per billing period, in cents (null until the webhook has mirrored it). */
      amountCents: number | null;
      periodEnd: string | null;
      cancelAtPeriodEnd: boolean;
    }
  | { kind: "one_time"; planKey: string; seconds: number; amountCents: number; paidAt: string | null }
  | { kind: "none" };

/** Fired after the client changes their plan (cancel / resume), so every plan card reads it again. */
const PLAN_CHANGED_EVENT = "izi:plan-changed";
export function notifyPlanChanged() {
  window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
}

const billingOf = (v: unknown): Billing | null => (v === "monthly" || v === "annual" ? v : null);

/**
 * The client's plan: their **live subscription** (`subscriptions`, mirrored from Stripe - plan, billing, price, renewal
 * or end date), else the paid subscription order the mirror has not caught up with yet, else their latest **one-time
 * video** order, else none. `null` while loading; `fallback` in sample mode instead of asking Supabase.
 */
export function useMyPlan(enabled = true, fallback?: MyPlan): MyPlan | null {
  const [plan, setPlan] = useState<MyPlan | null>(fallback ?? null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (fallback || !enabled) return;
    const reload = () => setVersion((v) => v + 1);
    window.addEventListener(PLAN_CHANGED_EVENT, reload);
    return () => window.removeEventListener(PLAN_CHANGED_EVENT, reload);
  }, [enabled, fallback]);

  useEffect(() => {
    if (fallback || !enabled) return;
    let alive = true;
    const done = (p: MyPlan) => alive && setPlan(p);
    void (async () => {
      if (!supabaseConfigured) return done({ kind: "none" });
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return done({ kind: "none" });

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_key, status, billing, amount_cents, current_period_end, cancel_at_period_end")
        .eq("user_id", auth.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub && sub.plan_key && isLiveStatus(String(sub.status))) {
        return done({
          kind: "subscription",
          planKey: String(sub.plan_key),
          status: String(sub.status),
          billing: billingOf(sub.billing),
          amountCents: typeof sub.amount_cents === "number" ? sub.amount_cents : null,
          periodEnd: sub.current_period_end ?? null,
          cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        });
      }

      const { data: order } = await supabase
        .from("orders")
        .select("plan_key, purchase_type, billing, seconds, amount_cents, paid_at")
        .eq("user_id", auth.user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (order && order.purchase_type === "subscription" && !sub) {
        // Paid a moment ago: the order is settled, the subscription mirror not yet.
        return done({ kind: "subscription", planKey: String(order.plan_key), status: "active", billing: billingOf(order.billing), amountCents: Number(order.amount_cents) || null, periodEnd: null, cancelAtPeriodEnd: false });
      }
      if (order && order.purchase_type === "one_time") {
        return done({ kind: "one_time", planKey: String(order.plan_key), seconds: Number(order.seconds) || 0, amountCents: Number(order.amount_cents) || 0, paidAt: order.paid_at ?? null });
      }
      done({ kind: "none" });
    })();
    return () => {
      alive = false;
    };
  }, [enabled, fallback, version]);

  return plan;
}
