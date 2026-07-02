"use client";

import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { useLanguage } from "@/lib/i18n/language-context";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { TrainingCardsGrid } from "./training-cards-grid";

export function TrainingPageView() {
  const { t } = useLanguage();
  const tr = t.training;

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 px-4 pb-28 pt-24 lg:pb-32 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl xl:max-w-[86rem] 2xl:max-w-[96rem]">
          <PageBreadcrumbs className="mb-6" />

          <header className="mb-10 lg:mb-12">
            <h1 className="mb-6 font-heading text-4xl font-bold text-foreground md:text-5xl">
              <span className="text-section-accent">{tr.title1}</span> {tr.title2}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{tr.subtitle}</p>
          </header>

          <TrainingCardsGrid />
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
