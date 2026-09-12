"use client";

import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PortfolioSection } from "@/components/portfolio-section";

export function PortfolioPageView() {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-20 pt-24 lg:pb-24 lg:pt-32">
        {/* Same gutters as the section below so the crumbs line up with its heading. */}
        <div className="mx-auto w-full max-w-none px-4 lg:px-6">
          <PageBreadcrumbs className="mb-2" />
        </div>
        <PortfolioSection headingLevel="h1" />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
