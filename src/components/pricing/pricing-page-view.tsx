"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconUser } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PricingCard } from "@/components/pricing/pricing-card";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { BUSINESS_PLANS, INDIVIDUAL_PLANS, type Audience, type Billing } from "@/lib/pricing";
import { contactProcessPath } from "@/lib/routes";

const AUDIENCES: Audience[] = ["individual", "business"];

/**
 * `/pricing`: the audience tabs (Individual / Business) on the left and the Monthly / Annual switch on the right (the
 * client's reference), then that audience's plans as cards in a row (stacked on phones) - or, while an audience has no
 * plans yet, a "coming soon - ask for a quote" card - and a line for a one-off video. Business is selected first, the
 * one with plans today. Every button opens the contact page until there is an order flow.
 */
export function PricingPageView() {
  const { t, language } = useLanguage();
  const p = t.plans;
  const contactHref = contactProcessPath(language);
  const [audience, setAudience] = useState<Audience>("business");
  const [billing, setBilling] = useState<Billing>("monthly");
  const plans = audience === "business" ? BUSINESS_PLANS : INDIVIDUAL_PLANS;
  const annual = billing === "annual";

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-8 pt-24 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl px-4">
          <PageBreadcrumbs className="mb-6" />

          <header className="mb-8 lg:mb-10">
            <h1 className="mb-5 font-heading text-4xl font-bold text-foreground md:text-5xl">
              {p.title1} <span className="text-section-accent">{p.title2}</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{p.subtitle}</p>
          </header>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {/* Individual / Business - a segmented control. */}
            <div
              role="tablist"
              aria-label={`${p.audience.individual} / ${p.audience.business}`}
              className="inline-flex rounded-xl border border-white/10 bg-[#141518] p-1 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.7)]"
            >
              {AUDIENCES.map((key) => {
                const active = audience === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setAudience(key)}
                    className={cn(
                      "cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-[background-color,color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px sm:px-6",
                      active
                        ? "bg-white/[0.1] text-white shadow-[0_6px_16px_-8px_rgba(0,0,0,0.8)]"
                        : "text-white/50 hover:text-white/80"
                    )}
                  >
                    {p.audience[key]}
                  </button>
                );
              })}
            </div>

            {/* Monthly / Annual - a switch between the two words. */}
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-[#141518] px-4 py-2 text-sm font-semibold shadow-[0_10px_30px_-16px_rgba(0,0,0,0.7)]">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={cn("cursor-pointer transition-colors duration-200", annual ? "text-white/50 hover:text-white/80" : "text-white")}
              >
                {p.billing.monthly}
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                aria-label={p.billing.annual}
                onClick={() => setBilling(annual ? "monthly" : "annual")}
                className={cn(
                  "relative h-6 w-11 cursor-pointer rounded-full transition-[background-color,transform] duration-200 ease-out hover:scale-105",
                  annual ? "bg-[#c9f03a]" : "bg-white/20"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform duration-200 ease-out",
                    annual && "translate-x-5"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={cn("cursor-pointer transition-colors duration-200", annual ? "text-white" : "text-white/50 hover:text-white/80")}
              >
                {p.billing.annual}
              </button>
            </div>
          </div>

          {plans.length ? (
            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 lg:gap-6">
              {plans.map((plan) => (
                <PricingCard key={plan.key} plan={plan} billing={billing} href={contactHref} />
              ))}
            </div>
          ) : (
            // No plans for this audience yet.
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#1d1e22_0%,#141518_100%)] px-6 py-12 text-center text-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)]">
              <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/[0.08]">
                <IconUser className="size-6" aria-hidden />
              </span>
              <h2 className="font-heading text-2xl font-extrabold">{p.individualSoon.title}</h2>
              <p className="mt-3 max-w-md text-white/60">{p.individualSoon.text}</p>
              <Link
                href={contactHref}
                className="mt-7 flex h-12 cursor-pointer items-center justify-center rounded-xl bg-white px-8 font-semibold text-neutral-950 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.8)] transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-neutral-100"
              >
                {p.individualSoon.cta}
              </Link>
            </div>
          )}

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
