"use client";

import Link from "next/link";
import { IconCheck, IconDiamondFilled, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatPrice, oneTimeCost, planPricing, type Billing, type Plan, type PlanTint } from "@/lib/pricing";

/**
 * One plan's card, after the client's "AI Video Subscription Plans" file, on its dark palette: a black card washed
 * from the top-left with the plan's tint, the name in Archivo expanded (`font-heading` on the English site), its tags (the annual discount,
 * "Most popular", "One-time"), who it is for, the price (struck through and discounted on the annual toggle), the
 * yearly saving, the monthly volume in an inset box, what is and is not included (a tooltip on the scriptwriting
 * add-on) and the button. The accent is the file's "electric" orange pearl: the popular plan's edge, button and tags.
 */
const TINT: Record<PlanTint, string> = {
  gray: "#2a2b2f",
  olive: "#39432a",
  maroon: "#6a1233",
  navy: "#102d42",
};

/** The file's slanted tags; `pearl` is the orange pearl with its light sheen. */
const TAG = "inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-[7px] pt-1 pb-[3px] text-[11px] font-extrabold uppercase italic leading-none tracking-[0.02em] -skew-x-[8deg]";
export const PEARL_TAG = cn(
  TAG,
  "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] text-[#1f0b00] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_0_10px_rgba(255,110,20,0.35)]"
);
const RED_TAG = cn(TAG, "bg-[#ff1f5a] text-white");

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

export function PricingCard({ plan, billing, href }: { plan: Plan; billing: Billing; href: string }) {
  const { t } = useLanguage();
  const p = t.plans;
  const copy = p.tiers[plan.key];
  const subscription = !plan.oneTime && !plan.custom && plan.price !== undefined;
  const annual = billing === "annual" && subscription;
  const pricing = plan.price !== undefined ? planPricing(plan.price, billing) : null;

  return (
    <article
      className={cn(
        "flex flex-col rounded-[20px] border p-[22px] text-[#f4f4f5] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1",
        plan.popular
          ? "border-[#ff7a1a]/60 shadow-[0_0_0_1px_rgba(255,122,26,0.15),0_30px_70px_-30px_rgba(255,106,20,0.45)]"
          : "border-white/[0.09] shadow-[0_30px_70px_-34px_rgba(0,0,0,0.9)]"
      )}
      style={{ background: `linear-gradient(170deg, ${TINT[plan.tint]} 0%, #141518 58%)` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-heading text-[26px] font-black uppercase leading-none tracking-[-0.01em]">{copy.name}</h2>
        {annual && pricing ? <span className={RED_TAG}>{fill(p.off, { n: pricing.percent })}</span> : null}
        {plan.popular ? (
          <span className={PEARL_TAG}>
            <IconDiamondFilled className="size-2.5" aria-hidden />
            {p.mostPopular}
          </span>
        ) : null}
        {plan.oneTime ? <span className={PEARL_TAG}>{p.oneTimeTag}</span> : null}
      </div>
      <p className="mt-2 text-[13.5px] text-[#9a9ba3]">{copy.for}</p>

      {/* The price. */}
      <div className="mt-[22px] flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {plan.custom ? (
          <>
            <span className="font-heading text-4xl font-black leading-none tracking-[-0.02em]">{p.customPrice}</span>
            <span className="text-[13.5px] text-[#9a9ba3]">{p.customPer}</span>
          </>
        ) : plan.oneTime && plan.price !== undefined ? (
          <>
            <span className="font-heading text-4xl font-black leading-none tracking-[-0.02em]">{formatPrice(plan.price)}</span>
            <span className="text-[13.5px] text-[#9a9ba3]">{p.oneTimePer}</span>
          </>
        ) : pricing && plan.price !== undefined ? (
          <>
            {annual ? (
              <span className="font-heading text-[22px] font-extrabold text-[#ff1f5a] line-through decoration-2">
                {formatPrice(plan.price)}
              </span>
            ) : null}
            <span className="font-heading text-4xl font-black leading-none tracking-[-0.02em]">
              {formatPrice(pricing.perMonth)}
            </span>
            <span className="text-[13.5px] text-[#9a9ba3]">{annual ? p.perMonthAnnual : p.perMonth}</span>
          </>
        ) : null}
      </div>
      {subscription && pricing ? (
        <p className="mt-2 text-[13px] font-semibold text-[#9a9ba3]">
          {annual
            ? fill(p.savedAnnual, { amount: formatPrice(pricing.saved), total: formatPrice(pricing.annualTotal) })
            : fill(p.saveAnnual, { amount: formatPrice(pricing.saved), n: pricing.percent })}
        </p>
      ) : null}

      {/* The monthly volume. */}
      <div className="mt-[18px] rounded-xl border border-white/[0.09] bg-white/[0.05] px-3.5 py-3">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-heading text-2xl font-black uppercase leading-[1.1] tracking-[-0.015em]">{copy.volume}</span>
          <span className="text-[13.5px] font-medium text-[#9a9ba3]">{copy.volumeUnit}</span>
        </p>
        <p className="mt-1.5 text-[12.5px] text-[#9a9ba3]">{copy.volumeNote}</p>
        {plan.secs && pricing ? (
          <p className="mt-2">
            <span className={PEARL_TAG}>
              {fill(p.vsOneTime, { n: Math.round((1 - pricing.perMonth / oneTimeCost(plan.secs)) * 100) })}
            </span>
          </p>
        ) : null}
      </div>

      {/* Included, then not included. */}
      <ul className="mt-4 flex-1 text-[13.8px]">
        {copy.features.map((feature) => (
          <li key={feature} className="mb-[9px] flex items-start gap-2.5">
            <IconCheck className="mt-0.5 size-4 shrink-0" stroke={2.5} aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
        {copy.missing.map((feature) => (
          <li key={feature} className="mb-[9px] flex items-start gap-2.5 text-[#62636b]">
            <IconX className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">{p.notIncluded} </span>
              {feature}
              {feature === p.scriptAddon ? <ScriptTip /> : null}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={cn(
          "mt-[18px] flex w-full cursor-pointer items-center justify-center rounded-xl p-[13px] text-[15px] font-bold transition-[transform,filter,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
          plan.popular
            ? "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-[length:200%_100%] bg-[position:30%_0] text-[#1f0b00] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_28px_-10px_rgba(255,110,20,0.6)] transition-[transform,background-position,box-shadow] hover:bg-[position:70%_0] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_34px_-10px_rgba(255,110,20,0.75)]"
            : "bg-white text-[#0c0d0f] hover:brightness-95 hover:shadow-[0_12px_28px_-14px_rgba(255,255,255,0.35)]"
        )}
      >
        {plan.custom ? p.cta.custom : plan.oneTime ? p.cta.oneTime : p.cta.subscribe}
      </Link>
    </article>
  );
}

/** The "i" after the scriptwriting add-on: its price on hover / focus. */
function ScriptTip() {
  const { t } = useLanguage();
  const tip = t.plans.scriptTip;
  return (
    <span
      tabIndex={0}
      role="button"
      aria-label={tip.label}
      className="group/tip relative ml-1.5 inline-flex size-4 cursor-pointer items-center justify-center rounded-full bg-[#ff6a14] align-[1px] font-serif text-[11px] font-bold italic text-white outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141518]"
    >
      i
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute right-[-10px] bottom-[calc(100%+8px)] z-10 w-[210px] translate-y-1 rounded-[9px] bg-[#f4f4f5] px-[11px] py-[9px] text-left font-sans text-[12.5px] font-normal not-italic leading-[1.4] text-[#0c0d0f] opacity-0 shadow-[0_8px_22px_rgba(0,0,0,0.3)] transition-[opacity,transform] duration-150 group-hover/tip:visible group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus/tip:visible group-focus/tip:translate-y-0 group-focus/tip:opacity-100 after:absolute after:top-full after:right-3.5 after:border-[6px] after:border-transparent after:border-t-[#f4f4f5]"
      >
        <strong className="mb-0.5 block font-bold">{tip.title}</strong>
        {tip.text}
      </span>
    </span>
  );
}
