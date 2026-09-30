"use client";

import Link from "next/link";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { portfolioPath, pricingPath } from "@/lib/routes";

/** `/about` - who we are, what we make and how we work, in the site's dark dress (the copy is in the dictionary under `about`). */
export function AboutPageView() {
  const { t, language } = useLanguage();
  const a = t.about;

  return (
    <AccountShell>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.eyebrow}</p>
      <h1 className="mt-3 font-heading text-[clamp(30px,4vw,56px)] leading-[0.98] font-black uppercase text-balance">
        {a.title1} <span className="text-section-accent">{a.title2}</span>
      </h1>
      <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-white/70">{a.lead}</p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {a.blocks.map((block) => (
          <section key={block.title} className={`${ACCOUNT_CARD} p-6`}>
            <h2 className="font-heading text-base font-black uppercase text-[#ff8a1f]">{block.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{block.text}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href={portfolioPath(language)}
          className="inline-flex h-12 cursor-pointer items-center rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5"
        >
          {a.ctaWork}
        </Link>
        <Link
          href={pricingPath(language)}
          className="inline-flex h-12 cursor-pointer items-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white/85 transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
        >
          {a.ctaPricing}
        </Link>
      </div>
    </AccountShell>
  );
}
