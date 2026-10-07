"use client";

import Link from "next/link";
import { IconArrowUpRight } from "@tabler/icons-react";
import { AccountAvatar } from "@/components/account-avatar";
import { ACCOUNT_CARD, AccountRow, AccountShell } from "@/components/account-shell";
import { AccountPlanCard } from "@/components/account-plan-card";
import { ProfileForm } from "@/components/profile-form";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { contactProcessPath, pricingPath } from "@/lib/routes";
import type { AccountInfo } from "@/lib/account-info";
import type { ProfileFields } from "@/lib/clients";
import { EMAIL_PRIMARY } from "@/lib/contact-info";

/** The client's latest subscription, as `/account` reads it from `subscriptions` (mirrored from Stripe). */
export type AccountSubscription = { planKey: string | null; status: string; periodEnd: string | null; cancelAtPeriodEnd: boolean };

const SECTION_TITLE = "font-heading text-base font-black uppercase tracking-wide text-white/90";

/**
 * `/account` - Account & subscription, one page (the old View profile is merged in): who is signed in, the account facts,
 * their editable details (`ProfileForm`), their plan and video time (`AccountPlanCard`) with the subscription - status,
 * renewal or end date - and how to delete the account. Sign out lives in the side menu.
 */
export function AccountPageView({ info, fields, subscription }: { info: AccountInfo; fields: ProfileFields | null; subscription: AccountSubscription | null }) {
  const { t, language } = useLanguage();
  const a = t.account;
  const s = a.subscription;
  const providers = a.providers as Record<string, string>;
  const planNames = t.plans.tiers as Record<string, { name: string }>;
  const statusLabels = t.team.clients.subscription;
  const live = subscription && ["active", "trialing", "past_due", "unpaid"].includes(subscription.status);

  return (
    <AccountShell>
      <div className="flex items-center gap-5">
        <AccountAvatar name={info.name} url={info.avatarUrl} className="size-16 text-2xl sm:size-20 sm:text-3xl" />
        <div className="min-w-0">
          <h1 className="font-heading text-[clamp(26px,3.4vw,44px)] leading-[0.98] font-black uppercase text-balance">
            {a.manageTitle1} <span className="text-section-accent">{a.manageTitle2}</span>
          </h1>
          <p className="mt-1.5 truncate text-white/55">
            {info.name} · {info.email}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <section className={`${ACCOUNT_CARD} px-6 py-5`}>
          <h2 className={SECTION_TITLE}>{a.sections.account}</h2>
          <div className="mt-2">
            <AccountRow label={a.email}>{info.email}</AccountRow>
            <AccountRow label={a.signedInWith}>{providers[info.provider] ?? info.provider}</AccountRow>
            <AccountRow label={a.memberSince}>{formatDateDisplay(info.createdAt.slice(0, 10))}</AccountRow>
          </div>
        </section>

        <section className={`${ACCOUNT_CARD} flex flex-col gap-4 px-6 py-5`}>
          <h2 className={SECTION_TITLE}>{a.sections.plan}</h2>
          <AccountPlanCard />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{s.title}</p>
            {live && subscription ? (
              <div className="mt-1">
                <AccountRow label={s.plan}>{subscription.planKey ? (planNames[subscription.planKey]?.name ?? subscription.planKey) : "-"}</AccountRow>
                <AccountRow label={s.status}>
                  <span className={subscription.status === "active" || subscription.status === "trialing" ? "text-emerald-300" : "text-[#ffb066]"}>
                    {statusLabels[subscription.status] ?? subscription.status}
                  </span>
                </AccountRow>
                {subscription.periodEnd ? (
                  <AccountRow label={subscription.cancelAtPeriodEnd ? s.ends : s.renews}>{formatDateDisplay(subscription.periodEnd.slice(0, 10))}</AccountRow>
                ) : null}
                <p className="mt-3 text-xs leading-relaxed text-white/45">
                  {s.change}{" "}
                  <a href={EMAIL_PRIMARY.href} className="text-white/65 underline decoration-white/25 underline-offset-2 transition-colors duration-200 hover:text-primary">
                    {EMAIL_PRIMARY.label}
                  </a>
                </p>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-[44ch] text-sm leading-relaxed text-white/55">{s.none}</p>
                <Link
                  href={`${pricingPath(language)}?for=business`}
                  className="group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/25 px-4 text-sm font-semibold text-white/85 transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/70 hover:bg-white/10 hover:text-white"
                >
                  {s.seePlans}
                  <IconArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {fields ? <ProfileForm initial={fields} /> : null}

      {/* Deleting an account is done by support (it also cancels the plan and removes the files) - see the privacy policy. */}
      <section className={`${ACCOUNT_CARD} mt-6 p-6`}>
        <h2 className={SECTION_TITLE}>{a.deleteAccount.title}</h2>
        <p className="mt-2 max-w-[75ch] text-sm leading-relaxed text-white/60">{a.deleteAccount.text}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href={`${EMAIL_PRIMARY.href}?subject=${encodeURIComponent(a.deleteAccount.subject)}`}
            className="inline-flex h-10 cursor-pointer items-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white/85 transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/70 hover:bg-white/10 hover:text-white"
          >
            {a.deleteAccount.cta}
          </a>
          <Link href={contactProcessPath(language)} className="text-sm text-white/55 underline decoration-white/25 underline-offset-2 transition-colors duration-200 hover:text-primary">
            {a.deleteAccount.form}
          </Link>
        </div>
      </section>
    </AccountShell>
  );
}
