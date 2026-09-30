"use client";

import Link from "next/link";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { pricingPath } from "@/lib/routes";
import { formatVideoTime } from "@/lib/account-info";
import { useCredits } from "@/lib/supabase/use-credits";
import { cn } from "@/lib/utils";

/**
 * The plan the visitor is on, the video time they have left (a bar and "12 sec of 30 sec") and the Upgrade button to the
 * plans. Used in the header's account menu and on the account page.
 */
export function AccountPlanCard({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { t, language } = useLanguage();
  const a = t.account;
  const credits = useCredits();
  const balance = credits?.balance ?? 0;
  const added = credits?.added ?? 0;
  const hasTime = added > 0;
  const share = hasTime ? Math.min(100, Math.round((balance / added) * 100)) : 0;
  const planName = credits?.planKey ? (t.plans.tiers as Record<string, { name: string }>)[credits.planKey]?.name : null;

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.04] p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{a.currentPlan}</span>
        <span className="rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] px-2.5 py-0.5 text-xs font-bold text-white">{planName ?? a.noPlan}</span>
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-white/70">{a.timeLeft}</span>
        <span className="font-semibold text-white">
          {formatVideoTime(balance)}
          {hasTime ? <span className="font-normal text-white/45"> / {formatVideoTime(added)}</span> : null}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={share} aria-label={a.timeLeft}>
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff5e00,#ffb066)] transition-[width] duration-500" style={{ width: `${share}%` }} />
      </div>
      {!hasTime ? <p className="mt-2 text-xs leading-relaxed text-white/45">{a.noTime}</p> : null}

      <Link
        href={`${pricingPath(language)}?for=individual`}
        onClick={onNavigate}
        className="group mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(255,106,20,0.9)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-12px_rgba(255,106,20,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {hasTime ? a.upgrade : a.buyPack}
        <IconArrowUpRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </Link>
    </div>
  );
}
