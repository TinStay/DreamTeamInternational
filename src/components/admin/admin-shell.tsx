"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { AccountMenu } from "@/components/account-menu";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { DashboardSwitch } from "@/components/admin/dashboard-switch";
import { useLanguage } from "@/lib/i18n/language-context";
import { homePath } from "@/lib/routes";
import { useAuthUser } from "@/lib/supabase/use-auth-user";

/**
 * The admin area's own interface - not the client account frame, not the marketing site: a control-room ground (near
 * black, a faint grid, an orange light top-left), a slim top bar (the logo with an ADMIN badge, the Admin ↔ Client switch,
 * back to the site, the account menu), and the page below it across the whole width of the window - one page, no side
 * menu (the Dashboard holds the projects and the clients itself).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { t, language } = useLanguage();
  const a = t.team.admin;
  const user = useAuthUser();

  return (
    <div className="relative isolate min-h-svh bg-[#060608] text-white">
      {/* The control-room ground: a fine grid fading out toward the bottom, an orange light and a cool one. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.6)_45%,transparent_100%)]" />
        <div className="absolute -top-[20%] -left-[10%] size-[60vw] rounded-full bg-[radial-gradient(circle,rgba(255,106,20,0.16),transparent_62%)]" />
        <div className="absolute -right-[15%] -bottom-[25%] size-[55vw] rounded-full bg-[radial-gradient(circle,rgba(110,90,255,0.10),transparent_62%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#060608]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-[max(1.25rem,2.5vw)]">
          <Link href={homePath(language)} className="flex shrink-0 cursor-pointer items-center gap-3 transition-opacity duration-200 hover:opacity-85">
            <BrandWordmark priority className="h-7 sm:h-9" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff8a1f]/45 bg-[#ff7a1a]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb066]">
            <span className="size-1.5 rounded-full bg-[#ff8a1f] shadow-[0_0_8px_#ff8a1f]" />
            {a.badge}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <DashboardSwitch active="admin" className="hidden sm:inline-flex" />
            <Link
              href={homePath(language)}
              className="group hidden h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white/60 transition-[color,background-color,transform] duration-200 ease-out hover:-translate-y-px hover:bg-white/[0.06] hover:text-white md:inline-flex"
            >
              <IconArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
              {a.backToSite}
            </Link>
            {user ? <AccountMenu user={user} /> : null}
          </div>
        </div>
      </header>

      <main className="px-[max(1.25rem,2.5vw)] pt-6 pb-16 lg:pt-10">
        <DashboardSwitch active="admin" className="mb-5 sm:hidden" />
        {children}
      </main>
    </div>
  );
}
