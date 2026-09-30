"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconFolder, IconLayoutDashboard, IconLogout, IconSettings, IconUser } from "@tabler/icons-react";
import { AccountMenu } from "@/components/account-menu";
import { useLanguage } from "@/lib/i18n/language-context";
import { accountPath, homePath, myProjectsPath, profilePath, teamPath } from "@/lib/routes";
import { openLogin, openSignup } from "@/lib/signup-dialog";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/lib/supabase/use-auth-user";
import { isTeamUser } from "@/lib/team";
import { cn } from "@/lib/utils";

/**
 * The English phone top bar's right end: Log in and an orange Sign up pill for a visitor; once signed in, a Your Projects
 * icon button and the account icon with its menu (`account-menu.tsx`). Invisible until Supabase has answered who is here.
 */
export function MobileTopControls() {
  const { t, language } = useLanguage();
  const user = useAuthUser();

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", user === undefined && "invisible")}>
      {user ? (
        <>
          <Link
            href={myProjectsPath(language)}
            aria-label={t.account.yourProjects}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#ff8a1f]/60 bg-[#ff7a1a]/[0.1] text-[#ff8a1f] transition-transform active:scale-95"
          >
            <IconFolder className="size-5" stroke={1.8} aria-hidden />
          </Link>
          <AccountMenu user={user} />
        </>
      ) : (
        <>
          <button type="button" onClick={openLogin} className="h-10 cursor-pointer rounded-full px-3 text-sm font-semibold text-white/90 transition-colors active:bg-white/10">
            {t.header.login}
          </button>
          <button
            type="button"
            onClick={openSignup}
            className="h-10 cursor-pointer rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-4 text-sm font-bold text-[#1f0b00] shadow-[0_8px_22px_-10px_rgba(255,106,20,0.8)] transition-transform active:scale-95"
          >
            {t.header.signup}
          </button>
        </>
      )}
    </div>
  );
}

const ROW = "group flex select-none items-center gap-4 text-foreground/80 transition-colors";

/** The account block of the phone menu sheet: Log in / Sign up buttons, or the signed-in links and Sign out. */
export function MobileMenuAccount({ onNavigate }: { onNavigate: () => void }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const user = useAuthUser();
  const a = t.account;

  if (user === undefined) return null;

  if (!user) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            onNavigate();
            openLogin();
          }}
          className="h-14 cursor-pointer rounded-full border border-border/40 text-base font-semibold text-foreground transition-transform active:scale-95"
        >
          {t.header.login}
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            openSignup();
          }}
          className="h-14 cursor-pointer rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] text-base font-bold text-[#1f0b00] shadow-[0_10px_26px_-12px_rgba(255,106,20,0.8)] transition-transform active:scale-95"
        >
          {t.header.signup}
        </button>
      </div>
    );
  }

  const signOut = async () => {
    onNavigate();
    await createClient().auth.signOut();
    router.push(homePath(language));
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5 text-lg font-heading font-semibold">
      <Link href={myProjectsPath(language)} onClick={onNavigate} className={cn(ROW, "text-[#ff8a1f] uppercase")}>
        <IconFolder className="size-6 shrink-0" aria-hidden />
        {a.yourProjects}
      </Link>
      <Link href={profilePath(language)} onClick={onNavigate} className={ROW}>
        <IconUser className="size-6 shrink-0" aria-hidden />
        {a.viewProfile}
      </Link>
      <Link href={accountPath(language)} onClick={onNavigate} className={ROW}>
        <IconSettings className="size-6 shrink-0" aria-hidden />
        {a.manageAccount}
      </Link>
      {isTeamUser(user) ? (
        <Link href={teamPath(language)} onClick={onNavigate} className={ROW}>
          <IconLayoutDashboard className="size-6 shrink-0" aria-hidden />
          {t.team.menu}
        </Link>
      ) : null}
      <button type="button" onClick={() => void signOut()} className={cn(ROW, "cursor-pointer text-left")}>
        <IconLogout className="size-6 shrink-0" aria-hidden />
        {a.logout}
      </button>
    </div>
  );
}
