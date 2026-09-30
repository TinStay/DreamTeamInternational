"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { IconChevronRight, IconLayoutDashboard, IconLogout, IconSettings, IconUser } from "@tabler/icons-react";
import { isTeamUser } from "@/lib/team";
import { AccountAvatar } from "@/components/account-avatar";
import { AccountPlanCard } from "@/components/account-plan-card";
import { useLanguage } from "@/lib/i18n/language-context";
import { accountInfoFromUser } from "@/lib/account-info";
import { accountPath, homePath, myProjectsPath, profilePath, teamPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ITEM =
  "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-white/85 transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-0.5 hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ff8a1f]";

/**
 * The signed-in header's icon (top right) and the menu it opens: who is signed in, the plan with the video time left
 * and an Upgrade button, YOUR PROJECTS (orange), View profile, Manage account and Sign out. Closes on a click outside,
 * Escape, or choosing anything.
 */
export function AccountMenu({ user }: { user: User }) {
  const { t, language } = useLanguage();
  const a = t.account;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // The menu is drawn on <body> (the header bar clips what overflows it) and placed under the icon, right edges aligned.
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const info = accountInfoFromUser(user);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 12, right: Math.max(8, window.innerWidth - r.right) });
    };
    place();
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const close = () => setOpen(false);

  const signOut = async () => {
    close();
    await createClient().auth.signOut();
    router.push(homePath(language));
    router.refresh();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={a.menu}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer rounded-full transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a1f]",
          open && "scale-105"
        )}
      >
        <AccountAvatar name={info.name} url={info.avatarUrl} className="size-10 text-base" />
      </button>

      {open && pos
        ? createPortal(
      <div
        ref={menuRef}
        role="menu"
        style={{ top: pos.top, right: pos.right }}
        className={cn(
          "fixed z-[70] w-[min(19.5rem,calc(100vw-1rem))] origin-top-right rounded-2xl border border-white/12 bg-[linear-gradient(160deg,rgba(28,29,34,0.97),rgba(16,17,20,0.97))] p-2.5 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 ease-out",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1"
        )}
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,#ff8a1f,#ffd2a1,#ff8a1f,transparent)]" />

        <div className="flex items-center gap-3 px-2 pt-1.5 pb-3">
          <AccountAvatar name={info.name} url={info.avatarUrl} className="size-11 text-lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{info.name}</p>
            <p className="truncate text-xs text-white/50">{info.email}</p>
          </div>
        </div>

        <AccountPlanCard onNavigate={close} />

        <div className="mt-2.5 flex flex-col gap-0.5">
          <Link
            href={myProjectsPath(language)}
            role="menuitem"
            onClick={close}
            className={cn(ITEM, "font-heading text-sm font-black tracking-[0.06em] text-[#ff8a1f] uppercase hover:text-[#ffb066]")}
          >
            <span className="flex-1">{a.yourProjects}</span>
            <IconChevronRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link href={profilePath(language)} role="menuitem" onClick={close} className={ITEM}>
            <IconUser className="size-[18px] text-white/50 group-hover:text-[#ffb066]" aria-hidden />
            {a.viewProfile}
          </Link>
          <Link href={accountPath(language)} role="menuitem" onClick={close} className={ITEM}>
            <IconSettings className="size-[18px] text-white/50 group-hover:text-[#ffb066]" aria-hidden />
            {a.manageAccount}
          </Link>
          {isTeamUser(user) ? (
            <Link href={teamPath(language)} role="menuitem" onClick={close} className={ITEM}>
              <IconLayoutDashboard className="size-[18px] text-white/50 group-hover:text-[#ffb066]" aria-hidden />
              {t.team.menu}
            </Link>
          ) : null}
          <span aria-hidden className="mx-2 my-1 h-px bg-white/10" />
          <button type="button" role="menuitem" onClick={() => void signOut()} className={ITEM}>
            <IconLogout className="size-[18px] text-white/50 group-hover:text-[#ffb066]" aria-hidden />
            {a.logout}
          </button>
        </div>
      </div>
          ,
          document.body
        )
        : null}
    </>
  );
}
