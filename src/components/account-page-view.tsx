"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACCOUNT_CARD, AccountRow, AccountShell } from "@/components/account-shell";
import { AccountPlanCard } from "@/components/account-plan-card";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { homePath, contactProcessPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import type { AccountInfo } from "@/lib/account-info";

/**
 * `/account` - Manage account: how the visitor signs in, their email and join date, the plan with the video time left
 * and Upgrade, Sign out, and where to ask for the account to be deleted.
 */
export function AccountPageView({ info }: { info: AccountInfo }) {
  const { t, language } = useLanguage();
  const a = t.account;
  const router = useRouter();
  const providers = a.providers as Record<string, string>;

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push(homePath(language));
    router.refresh();
  };

  return (
    <AccountShell>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.eyebrow}</p>
      <h1 className="mt-3 font-heading text-[clamp(30px,4vw,56px)] leading-[0.98] font-black uppercase text-balance">
        {a.manageTitle1} <span className="text-section-accent">{a.manageTitle2}</span>
      </h1>

      <section className={`${ACCOUNT_CARD} mt-10 px-6 py-2`}>
        <AccountRow label={a.email}>{info.email}</AccountRow>
        <AccountRow label={a.signedInWith}>{providers[info.provider] ?? info.provider}</AccountRow>
        <AccountRow label={a.memberSince}>{formatDateDisplay(info.createdAt.slice(0, 10))}</AccountRow>
      </section>

      <AccountPlanCard className="mt-6 max-w-md" />

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex h-11 cursor-pointer items-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white/85 transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10 hover:text-white"
        >
          {a.logout}
        </button>
        <Link href={contactProcessPath(language)} className="text-sm text-white/55 underline decoration-white/25 underline-offset-2 transition-colors hover:text-[#ff8a1f]">
          {a.deleteAccount}
        </Link>
      </div>
    </AccountShell>
  );
}
