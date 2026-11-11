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
import { PricingFaq } from "@/components/pricing/pricing-faq";
import { ANNUAL_PERCENT, AUDIENCES, PLANS, type Audience, type Billing, type Plan } from "@/lib/pricing";
import { openSignup } from "@/lib/signup-dialog";
import { useAuthUser } from "@/lib/supabase/use-auth-user";
import { emailHref } from "@/lib/contact-info";
import Link from "next/link";
import { accountPath } from "@/lib/routes";
import { InvoiceOrderDialog, type OrderDetails, type OrderResult } from "@/components/invoice-order-dialog";
import { formatMoney } from "@/components/invoice-list";
import { checkoutFor } from "@/lib/checkout";

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
 * definitions, the audience's note, and the pricing questions (`PricingFaq` - every plan's price in the page's HTML,
 * whichever audience is on screen, for search engines and AI assistants). Dark whatever the theme - the file's palette. `initialAudience` comes from
 * `?for=` (the header's Pricing links, read by the route). A pack's button starts the order (`/api/checkout` - a client
 * with a live subscription is not sold a second one): by `purchaseFlow`, the order window (`InvoiceOrderDialog` - the
 * invoice is emailed and paid from the email) or Stripe's checkout; the Enterprise one opens the contact page.
 */
export function PricingPageView({ initialAudience = "individual", purchaseFlow = "invoice" }: { initialAudience?: Audience; purchaseFlow?: "invoice" | "checkout" }) {
  const { t, language } = useLanguage();
  const p = t.plans;
  const contactHref = emailHref();
  const [audience, setAudience] = useState<Audience>(initialAudience);
  const [billing, setBilling] = useState<Billing>("monthly");
  const user = useAuthUser();
  const [buying, setBuying] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  // The order window's subject (the invoice flow): the plan and, for a one-time video, its length.
  const [order, setOrder] = useState<{ plan: Plan; seconds?: number; billing: Billing } | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);

  // Buying a pack: a signed-out visitor is asked to sign up first. Then, by the purchase flow, the order window opens (the
  // invoice goes to their email) or Stripe's checkout does; once the payment is confirmed the seconds appear in the
  // account (see /api/stripe/webhook).
  async function buy(plan: Plan, seconds?: number) {
    setBuyError(null);
    if (!user) {
      openSignup();
      return;
    }
    if (purchaseFlow === "invoice") {
      setOrder({ plan, seconds, billing });
      setOrderOpen(true);
      return;
    }
    setBuying(plan.key);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan.key, billing, ...(seconds ? { seconds } : {}) }) });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && json.url) {
        window.location.assign(json.url);
        return;
      }
      setBuyError(json.error === "not_configured" ? p.buy.notConfigured : json.error === "already_subscribed" ? p.buy.alreadySubscribed : p.buy.error);
    } catch {
      setBuyError(p.buy.error);
    }
    setBuying(null);
  }

  async function sendOrder(details: OrderDetails): Promise<OrderResult> {
    if (!order) return { error: "failed" };
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: order.plan.key, billing: order.billing, ...(order.seconds ? { seconds: order.seconds } : {}), details }),
    });
    const json = (await res.json().catch(() => ({}))) as OrderResult;
    return res.ok && json.invoice ? { invoice: json.invoice } : { error: json.error ?? "failed" };
  }

  // What the order window shows: the plan's name, and its price before tax as the server will invoice it.
  const o = p.invoiceOrder;
  const spec = order ? checkoutFor(order.plan.key, order.billing, order.seconds) : null;
  const orderName = order ? ((p.tiers as Record<string, { name: string }>)[order.plan.key]?.name ?? order.plan.key) : "";
  const period = order?.billing === "annual" ? "year" : "month";

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
            {/* The keyword-rich `h1` is for search engines and assistants; the file's title stays the visible one. */}
            <h1 className="sr-only">{p.seoHeading}</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9ba3]">{p.eyebrow}</p>
            <p className="mx-auto my-2.5 max-w-[18ch] font-heading text-[clamp(28px,4.4vw,44px)] font-black uppercase leading-[1.02] tracking-[-0.01em] text-balance">
              {p.title}
            </p>
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
              <PricingCard key={plan.key} plan={plan} billing={billing} href={contactHref} onBuy={(x, secs) => void buy(x, secs)} busy={buying === plan.key} />
            ))}
          </div>
          {buyError ? (
            <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
              {buyError}
            </p>
          ) : null}

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
          {/* A company has to be saved on its account before it orders - that is how Stripe knows it is one. */}
          {audience === "business" ? (
            <p className="mt-2 text-center text-[13px] text-[#9a9ba3]">
              {p.companyFirst.text}{" "}
              <Link href={accountPath(language)} className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors duration-200 hover:text-white">
                {p.companyFirst.link}
              </Link>
            </p>
          ) : null}

          <PricingFaq className="mt-14" />
        </div>
      </div>

      {order && spec ? (
        <InvoiceOrderDialog
          open={orderOpen}
          onOpenChange={setOrderOpen}
          title={spec.oneTime ? o.packTitle.replace("{name}", orderName).replace("{seconds}", String(spec.seconds)) : o.planTitle.replace("{name}", orderName).replace("{billing}", p.billing[order.billing].toLowerCase())}
          price={`${formatMoney(spec.amountCents)} ${spec.oneTime ? o.oneTime : spec.interval === "year" ? o.perYear : o.perMonth}`}
          renewal={spec.oneTime ? null : o.renewal.replace("{period}", period)}
          afterPaid={spec.oneTime ? o.afterPaid.pack : o.afterPaid.plan}
          submit={sendOrder}
        />
      ) : null}

      <Footer />
      <MobileNav />
    </main>
  );
}
