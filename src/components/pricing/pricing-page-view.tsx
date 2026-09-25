"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PEARL_TAG, PricingCard } from "@/components/pricing/pricing-card";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { ANNUAL_PERCENT, PLANS, type Audience, type Billing } from "@/lib/pricing";
import { contactProcessPath } from "@/lib/routes";

const AUDIENCES: Audience[] = ["individual", "business"];
const BILLINGS: Billing[] = ["monthly", "annual"];

/** A pill of the file's segmented controls. */
function segButton(active: boolean) {
  return cn(
    "inline-flex cursor-pointer items-center gap-2 rounded-full px-[18px] py-[9px] text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6a14]",
    active ? "bg-[#f4f4f5] text-[#0c0d0f]" : "text-[#9a9ba3] hover:text-[#f4f4f5]"
  );
}

/**
 * `/pricing` - the client's "AI Video Subscription Plans" file on the site: a centred head (eyebrow, the title in
 * Archivo expanded, the audience's line), the two segmented controls (Individual / Business, Monthly / Annual with the
 * annual discount's tag), that audience's three cards, the "every plan includes" box with the revision and scriptwriting
 * definitions, and the audience's note. Dark whatever the theme - the file's palette. `initialAudience` comes from
 * `?for=` (the header's Pricing links, read by the route); every button opens the contact page until there is an order flow.
 */
export function PricingPageView({ initialAudience = "business" }: { initialAudience?: Audience }) {
  const { t, language } = useLanguage();
  const p = t.plans;
  const contactHref = contactProcessPath(language);
  const [audience, setAudience] = useState<Audience>(initialAudience);
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    // `theme-dark`: the page (its page background, header and footer too) is dark on the Bulgarian site's light theme
    // as well - the file's palette.
    <main className={cn(MAIN_WITH_FIXED_PAGE_BG_CLASS, "theme-dark")}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-8 pt-24 text-[#f4f4f5] lg:pt-32">
        <div className="mx-auto w-full max-w-[1120px] px-5">
          <PageBreadcrumbs className="mb-6" />

          <header className="mb-7 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9ba3]">{p.eyebrow}</p>
            <h1 className="mx-auto my-2.5 max-w-[18ch] font-heading text-[clamp(28px,4.4vw,44px)] font-black uppercase leading-[1.02] tracking-[-0.01em] text-balance">
              {p.title}
            </h1>
            <p className="mx-auto max-w-[580px] text-[15.5px] text-[#9a9ba3]">{p.subtitle[audience]}</p>
          </header>

          <div className="mb-[30px] flex flex-wrap justify-center gap-3">
            <div
              role="group"
              aria-label={p.audience.label}
              className="inline-flex gap-0.5 rounded-full border border-white/[0.09] bg-[#1b1c20] p-1"
            >
              {AUDIENCES.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={audience === key}
                  onClick={() => setAudience(key)}
                  className={segButton(audience === key)}
                >
                  {p.audience[key]}
                </button>
              ))}
            </div>
            <div
              role="group"
              aria-label={p.billing.label}
              className="inline-flex gap-0.5 rounded-full border border-white/[0.09] bg-[#1b1c20] p-1"
            >
              {BILLINGS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={billing === key}
                  onClick={() => setBilling(key)}
                  className={segButton(billing === key)}
                >
                  {p.billing[key]}
                  {key === "annual" ? <span className={PEARL_TAG}>{p.off.replace("{n}", String(ANNUAL_PERCENT))}</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
            {PLANS[audience].map((plan) => (
              <PricingCard key={plan.key} plan={plan} billing={billing} href={contactHref} />
            ))}
          </div>

          <section className="mt-7 rounded-[20px] border border-white/[0.09] bg-[#141518] px-[22px] py-5">
            <h2 className="mb-3 font-heading text-[17px] font-black uppercase">{p.everyPlan.title}</h2>
            <ul className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {p.everyPlan.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[#9a9ba3] before:text-[#ff6a14] before:content-['•']">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3.5 border-t border-white/[0.09] pt-3 text-[13px] text-[#9a9ba3]">
              <strong className="text-[#f4f4f5]">{p.everyPlan.revisionTerm}</strong> {p.everyPlan.revisionText}
            </p>
            <p className="mt-2.5 text-[13px] text-[#9a9ba3]">
              <strong className="text-[#f4f4f5]">{p.everyPlan.scriptTerm}</strong> {p.everyPlan.scriptText}
            </p>
          </section>
          <p className="mt-[18px] text-center text-[13px] text-[#62636b]">{p.note[audience]}</p>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </main>
  );
}
