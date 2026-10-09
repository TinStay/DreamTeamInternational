"use client";

// The account area's side menu: video time available, then the account pages.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight, IconCoinFilled, IconFolderFilled, IconLayoutDashboardFilled, IconUserFilled } from "@tabler/icons-react";
import { useState, type ComponentType } from "react";
import { PlanDetailsDialog } from "@/components/plan-details-dialog";
import { DashboardSwitch } from "@/components/admin/dashboard-switch";
import { useMyPlan } from "@/lib/supabase/use-my-plan";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatVideoTime } from "@/lib/account-info";
import { accountPath, myProjectsPath, pricingPath, teamPath } from "@/lib/routes";
import { isTeamUser } from "@/lib/team";
import { useAuthUser } from "@/lib/supabase/use-auth-user";
import { useCredits } from "@/lib/supabase/use-credits";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> };

/**
 * The account pages' side menu: the video time available up top (the balance, a bar against everything added, the
 * plan), then Your projects · Account & subscription · (Team dashboard, for the team) · Buy video time - Sign out lives
 * in the header's account menu. A sticky column from `lg`; below it, the card and then a row of pills that scrolls
 * sideways under the breadcrumbs. The current page is marked in the orange primary.
 */
export function AccountSideNav() {
  const { t, language } = useLanguage();
  const n = t.account.nav;
  const pathname = usePathname();
  const user = useAuthUser();
  const credits = useCredits(Boolean(user));
  const c = t.account.credits;
  const balance = credits?.balance ?? 0;
  const added = credits?.added ?? 0;
  const share = added > 0 ? Math.min(100, Math.round((balance / added) * 100)) : 0;
  // The plan exactly as bought (the live subscription, else the last one-time video) - the card says it and opens it.
  const plan = useMyPlan(Boolean(user));
  const [planOpen, setPlanOpen] = useState(false);
  const d = t.account.planDetails;
  const planName = plan && plan.kind !== "none" ? ((t.plans.tiers as Record<string, { name: string }>)[plan.planKey]?.name ?? plan.planKey) : null;
  const planKind = plan?.kind === "subscription" ? (plan.billing ? d.billing[plan.billing] : d.subscription) : plan?.kind === "one_time" ? d.oneTime : null;

  const items: Item[] = [
    { href: myProjectsPath(language), label: n.projects, icon: IconFolderFilled },
    { href: accountPath(language), label: n.account, icon: IconUserFilled },
    ...(isTeamUser(user) ? [{ href: teamPath(language), label: n.team, icon: IconLayoutDashboardFilled }] : []),
    { href: pricingPath(language), label: n.buy, icon: IconCoinFilled },
  ];

  const link = (active: boolean) =>
    cn(
      "group flex shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold whitespace-nowrap transition-[transform,background-color,color] duration-200 ease-out lg:hover:translate-x-1",
      active ? "bg-primary/12 text-primary" : "text-white/70 hover:bg-white/[0.06] hover:text-primary"
    );

  return (
    <nav aria-label={n.label} className="lg:sticky lg:top-28 lg:self-start">
      {/* A team account: switch to the admin dashboard and back. */}
      <DashboardSwitch active="client" className="mb-4" />
      {/* The video time available. */}
      {user ? (
        <button
          type="button"
          onClick={() => setPlanOpen(true)}
          aria-haspopup="dialog"
          className="group/plan relative mb-4 block w-full cursor-pointer overflow-hidden rounded-2xl text-left transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(255,106,20,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a1f] bg-[linear-gradient(135deg,rgba(255,138,31,0.55)_0%,rgba(255,255,255,0.08)_40%,rgba(255,138,31,0.3)_100%)] p-px">
          <div className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-[linear-gradient(160deg,#1c1d22_0%,#101114_75%)] p-4">
            <span aria-hidden className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-[radial-gradient(circle,rgba(255,110,20,0.25),transparent_68%)]" />
            <div className="relative flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">{c.title}</p>
              <span className="truncate rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] px-2 py-0.5 text-[10px] font-bold text-white">{planName ?? c.noPlan}</span>
            </div>
            <p className="relative mt-2 font-heading text-2xl leading-tight font-black text-white">{credits ? formatVideoTime(balance) : <span className="text-white/30">…</span>}</p>
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff5e00,#ffb066)] transition-[width] duration-700" style={{ width: `${share}%` }} />
            </div>
            {added > 0 ? <p className="relative mt-1.5 text-xs text-white/45">{c.of.replace("{total}", formatVideoTime(added))}</p> : null}
            {/* The plan as bought, and the way into its details. */}
            <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
              <span className="min-w-0 text-xs">
                {planKind ? <span className="block truncate text-white/55">{planKind}</span> : null}
                <span className="font-semibold text-[#ffb066]">{d.button}</span>
              </span>
              <IconChevronRight className="size-4 shrink-0 text-[#ff8a1f] transition-transform duration-200 group-hover/plan:translate-x-0.5" aria-hidden />
            </div>
          </div>
        </button>
      ) : null}

      <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== pricingPath(language) && pathname.startsWith(`${href}/`));
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={link(active)}>
                <Icon className="size-[19px] shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <PlanDetailsDialog plan={plan} open={planOpen} onOpenChange={setPlanOpen} />
    </nav>
  );
}
