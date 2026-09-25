"use client";

import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PricingCard } from "@/components/pricing/pricing-card";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { PLANS } from "@/lib/pricing";
import { contactProcessPath } from "@/lib/routes";

/**
 * `/pricing`: the three monthly plans as cards in a row (stacked on phones), then a line for a one-off video that leads
 * to the contact page. A plan's button opens the contact page too, until there is an order flow.
 */
export function PricingPageView() {
  const { t, language } = useLanguage();
  const p = t.plans;
  const contactHref = contactProcessPath(language);

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-8 pt-24 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl px-4">
          <PageBreadcrumbs className="mb-6" />

          <header className="mb-10 lg:mb-14">
            <h1 className="mb-5 font-heading text-4xl font-bold text-foreground md:text-5xl">
              {p.title1} <span className="text-section-accent">{p.title2}</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{p.subtitle}</p>
          </header>

          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3 lg:gap-6">
            {PLANS.map((plan) => (
              <PricingCard key={plan.key} plan={plan} href={contactHref} />
            ))}
          </div>

          <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-muted-foreground">
            {p.oneOff}
            <Link
              href={contactHref}
              className="group inline-flex cursor-pointer items-center gap-1 font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-px"
            >
              {p.oneOffCta}
              <IconArrowRight
                className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </p>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </main>
  );
}
