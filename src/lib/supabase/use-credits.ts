"use client";

import { useCallback, useEffect, useState } from "react";
import { EMPTY_CREDITS, summarizeLedger, type CreditSummary, type LedgerEntry } from "@/lib/credits";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

/** Fired after anything that changes the balance (a project was submitted, a pack was bought), so every open view refreshes. */
export const CREDITS_CHANGED = "izi:credits-changed";
export const notifyCreditsChanged = () => typeof window !== "undefined" && window.dispatchEvent(new Event(CREDITS_CHANGED));

/**
 * The signed-in client's video seconds, read from their ledger (`null` until the first answer). `enabled=false` skips the
 * query (signed out); `fallback` is used in sample mode instead of asking Supabase.
 */
export function useCredits(enabled = true, fallback?: CreditSummary): CreditSummary | null {
  const [summary, setSummary] = useState<CreditSummary | null>(fallback ?? null);

  const load = useCallback(async () => {
    if (fallback) return;
    if (!supabaseConfigured) {
      setSummary(EMPTY_CREDITS);
      return;
    }
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSummary(EMPTY_CREDITS);
      return;
    }
    // Only this account's own rows: a team member's account can read everyone's ledger, but its balance is its own.
    const { data, error } = await supabase.from("credit_ledger").select("seconds, kind, plan_key, created_at").eq("user_id", auth.user.id);
    // A missing table (credits.sql not run yet) or an error just means no seconds.
    setSummary(error || !data ? EMPTY_CREDITS : summarizeLedger(data as LedgerEntry[]));
  }, [fallback]);

  useEffect(() => {
    if (!enabled) return;
    const first = window.setTimeout(() => void load(), 0);
    const onChange = () => void load();
    window.addEventListener(CREDITS_CHANGED, onChange);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener(CREDITS_CHANGED, onChange);
    };
  }, [enabled, load]);

  return summary;
}
