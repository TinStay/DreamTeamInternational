import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { AccountSideNav } from "@/components/account-side-nav";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";

/**
 * The frame the account pages share (your projects, account & subscription, the team dashboard): the site chrome,
 * breadcrumbs, and the side menu (`AccountSideNav`) beside the page's column from `lg` - above it, as a row of pills,
 * on smaller screens. `sideNav={false}` drops the menu - for the public pages that share the frame (About, Careers,
 * Customers), which are not part of the account area.
 */
export function AccountShell({ children, sideNav = true }: { children: ReactNode; sideNav?: boolean }) {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>
      <SiteHeader />
      <div className={`relative z-10 mx-auto w-full max-w-[110rem] flex-1 px-[max(1.25rem,3vw)] pt-28 pb-16 text-white`}>
        <PageBreadcrumbs />
        {sideNav ? (
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12 2xl:grid-cols-[20rem_minmax(0,1fr)]">
            <AccountSideNav />
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          <div className="mt-6 min-w-0">{children}</div>
        )}
      </div>
      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}

export const ACCOUNT_CARD =
  "rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_60%)] shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)]";

/** A label / value row inside an account card. */
export function AccountRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/8 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-white/55">{label}</span>
      <span className="font-semibold break-all">{children}</span>
    </div>
  );
}
