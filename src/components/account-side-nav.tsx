"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconCoins, IconFolder, IconLayoutDashboard, IconLogout, IconUser } from "@tabler/icons-react";
import type { ComponentType } from "react";
import { AccountAvatar } from "@/components/account-avatar";
import { useLanguage } from "@/lib/i18n/language-context";
import { accountInfoFromUser, formatVideoTime } from "@/lib/account-info";
import { accountPath, homePath, myProjectsPath, pricingPath, teamPath } from "@/lib/routes";
import { isTeamUser } from "@/lib/team";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/lib/supabase/use-auth-user";
import { useCredits } from "@/lib/supabase/use-credits";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> };

/**
 * The account pages' side menu: who is signed in and their video time up top, then Your projects · Account &
 * subscription · (Team dashboard, for the team) · Buy video time, and Sign out. A sticky column from `lg`; below it, a
 * row of pills that scrolls sideways under the breadcrumbs. The current page is marked in the orange primary.
 */
export function AccountSideNav() {
  const { t, language } = useLanguage();
  const n = t.account.nav;
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthUser();
  const credits = useCredits(Boolean(user));
  const info = user ? accountInfoFromUser(user) : null;

  const items: Item[] = [
    { href: myProjectsPath(language), label: n.projects, icon: IconFolder },
    { href: accountPath(language), label: n.account, icon: IconUser },
    ...(isTeamUser(user) ? [{ href: teamPath(language), label: n.team, icon: IconLayoutDashboard }] : []),
    { href: pricingPath(language), label: n.buy, icon: IconCoins },
  ];

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push(homePath(language));
    router.refresh();
  };

  const link = (active: boolean) =>
    cn(
      "group flex shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold whitespace-nowrap transition-[transform,background-color,color] duration-200 ease-out lg:hover:translate-x-1",
      active ? "bg-primary/12 text-primary" : "text-white/70 hover:bg-white/[0.06] hover:text-primary"
    );

  return (
    <nav aria-label={n.label} className="lg:sticky lg:top-28 lg:self-start">
      {/* Who is signed in and what they have left - desktop only (the header menu shows it on phones). */}
      {info ? (
        <div className="mb-4 hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 lg:flex">
          <AccountAvatar name={info.name} url={info.avatarUrl} className="size-10 text-base" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{info.name}</p>
            <p className="truncate text-xs text-white/50">{credits ? formatVideoTime(credits.balance) : "…"}</p>
          </div>
        </div>
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
        <li className="lg:mt-3 lg:border-t lg:border-white/10 lg:pt-3">
          <button type="button" onClick={() => void signOut()} className={cn(link(false), "w-full")}>
            <IconLogout className="size-[19px] shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden />
            {n.signOut}
          </button>
        </li>
      </ul>
    </nav>
  );
}
