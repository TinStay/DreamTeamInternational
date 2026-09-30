"use client";

import Link from "next/link";
import { AccountAvatar } from "@/components/account-avatar";
import { ACCOUNT_CARD, AccountRow, AccountShell } from "@/components/account-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { accountPath, myProjectsPath } from "@/lib/routes";
import type { AccountInfo } from "@/lib/account-info";
import { useCredits } from "@/lib/supabase/use-credits";

/** `/profile` - View profile: the visitor's picture, name and email, their plan and how long they have been a member. */
export function ProfilePageView({ info }: { info: AccountInfo }) {
  const { t, language } = useLanguage();
  const a = t.account;
  const credits = useCredits();
  const planName = credits?.planKey ? (t.plans.tiers as Record<string, { name: string }>)[credits.planKey]?.name : null;

  return (
    <AccountShell>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.eyebrow}</p>
      <div className="mt-5 flex items-center gap-5">
        <AccountAvatar name={info.name} url={info.avatarUrl} className="size-20 text-3xl" />
        <div className="min-w-0">
          <h1 className="font-heading text-[clamp(28px,3.6vw,48px)] leading-[0.98] font-black uppercase text-balance">
            <span className="text-section-accent">{info.name}</span>
          </h1>
          <p className="mt-1.5 truncate text-white/55">{info.email}</p>
        </div>
      </div>

      <section className={`${ACCOUNT_CARD} mt-10 px-6 py-2`}>
        <AccountRow label={a.currentPlan}>{planName ?? a.noPlan}</AccountRow>
        <AccountRow label={a.memberSince}>{formatDateDisplay(info.createdAt.slice(0, 10))}</AccountRow>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href={myProjectsPath(language)}
          className="inline-flex h-11 cursor-pointer items-center rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,1)]"
        >
          {a.yourProjects}
        </Link>
        <Link
          href={accountPath(language)}
          className="inline-flex h-11 cursor-pointer items-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white/85 transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10 hover:text-white"
        >
          {a.manageAccount}
        </Link>
      </div>
    </AccountShell>
  );
}
