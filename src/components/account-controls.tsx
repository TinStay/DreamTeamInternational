"use client";

import { IconFolder } from "@tabler/icons-react";
import { AccountMenu } from "@/components/account-menu";
import { WaterButton } from "@/components/water-button";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { useLanguage } from "@/lib/i18n/language-context";
import { myProjectsPath, pricingPath } from "@/lib/routes";
import { openLogin, openSignup } from "@/lib/signup-dialog";
import { useAuthUser } from "@/lib/supabase/use-auth-user";

/**
 * The English header's right end: Log in + Sign up (the orange pearl pill) for a visitor, and once signed in the
 * account icon with its menu (`account-menu.tsx`). The big YOUR PROJECTS button sits before them either way: a link to
 * /my-projects for a signed-in client, and the log-in popup for a visitor (the page needs an account). Invisible until
 * Supabase has answered who is here, so a signed-in visitor never sees the wrong buttons flash.
 */
export function AccountControls() {
  const { t, language } = useLanguage();
  const user = useAuthUser();

  return (
    <div className={user === undefined ? "invisible flex items-center gap-1" : "flex items-center gap-1"}>
      {user ? (
        <>
          <WaterButton href={myProjectsPath(language)}>
            <IconFolder className="size-[18px]" stroke={1.8} aria-hidden />
            {t.account.projectsButton}
          </WaterButton>
          <span className="ml-1">
            <AccountMenu user={user} />
          </span>
        </>
      ) : (
        <>
          <WaterButton onClick={openLogin}>
            <IconFolder className="size-[18px]" stroke={1.8} aria-hidden />
            {t.account.projectsButton}
          </WaterButton>
          <button
            type="button"
            onClick={openLogin}
            className="inline-flex h-11 cursor-pointer items-center rounded-full px-4 text-[15px] font-semibold text-white/85 transition-[transform,background-color,color] duration-200 ease-out hover:-translate-y-px hover:bg-white/[0.08] hover:text-white"
          >
            {t.header.login}
          </button>
          <TigerCta href={pricingPath(language)} label={t.header.signup} className="tiger-cta--sm tiger-cta--orange" onClick={openSignup} />
        </>
      )}
    </div>
  );
}
