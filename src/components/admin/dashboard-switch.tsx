"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { IconLayoutDashboardFilled, IconUserFilled } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { adminPath, myProjectsPath } from "@/lib/routes";
import { useAuthUser } from "@/lib/supabase/use-auth-user";
import { isTeamUser } from "@/lib/team";
import { cn } from "@/lib/utils";

/**
 * Admin ↔ Client: the two dashboards a team account can switch between - the admin dashboard (`/admin`) and the client
 * area as a client sees it (Your Projects). A segmented pill with the active side lit in the orange gradient (the light
 * slides across on a switch). Renders nothing for anyone without the admin role, so it can sit in shared chrome.
 */
export function DashboardSwitch({ active, className }: { active: "admin" | "client"; className?: string }) {
  const { t, language } = useLanguage();
  const a = t.team.admin;
  const user = useAuthUser();
  if (!isTeamUser(user)) return null;

  const items = [
    { key: "admin" as const, href: adminPath(language), label: a.switchAdmin, icon: IconLayoutDashboardFilled },
    { key: "client" as const, href: myProjectsPath(language), label: a.switchClient, icon: IconUserFilled },
  ];
  return (
    <nav aria-label={a.switchLabel} className={cn("inline-flex rounded-full border border-white/12 bg-black/40 p-1 backdrop-blur", className)}>
      {items.map(({ key, href, label, icon: Icon }) => {
        const on = key === active;
        return (
          <Link
            key={key}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "group relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-[color,transform] duration-200 ease-out hover:-translate-y-px",
              on ? "text-white" : "text-white/55 hover:text-white",
            )}
          >
            {on ? (
              <motion.span
                layoutId="dashboard-switch-light"
                className="absolute inset-0 -z-0 rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] shadow-[0_8px_22px_-8px_rgba(255,106,20,0.9)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <Icon className="relative size-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
