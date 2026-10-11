"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowUpRight, IconCheck, IconDiamondFilled, IconX } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PEARL_TAG } from "@/components/pricing/pricing-card";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { EMAIL_PRIMARY } from "@/lib/contact-info";
import { PLANS, formatPrice, planPricing } from "@/lib/pricing";
import { pricingPath } from "@/lib/routes";
import { notifyPlanChanged, type MyPlan } from "@/lib/supabase/use-my-plan";
import { cn } from "@/lib/utils";

const ALL_PLANS = [...PLANS.individual, ...PLANS.business];
const DISABLED = "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none";

/**
 * The client's plan in full, like its card on the pricing page: the name and what kind of purchase it is (subscription,
 * monthly or annual - or a one-time video), the price as bought, the status and the renewal / end date, the video time
 * it gives, everything included and not, and what a revision is. Then the way up: **Upgrade plan** (to support, until
 * plan changes are self-serve) and Compare plans - or, without a subscription, See plans / Order another video. Under it,
 * **Cancel subscription** (asked to confirm, then `/api/subscription`: it ends with the paid period, never refunds or
 * cuts it short) and, once cancelled, **Resume subscription**.
 */
export function PlanDetailsDialog({ plan, open, onOpenChange }: { plan: MyPlan | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t, language } = useLanguage();
  const d = t.account.planDetails;
  const p = t.plans;
  const statusLabels = t.team.clients.subscription;
  const tiers = p.tiers as Record<string, (typeof p.tiers)["personal"]>;
  const copy = plan && plan.kind !== "none" ? tiers[plan.planKey] : null;
  const def = plan && plan.kind !== "none" ? ALL_PLANS.find((x) => x.key === plan.planKey) : undefined;
  const audience = def && PLANS.business.some((x) => x.key === def.key) ? "business" : "individual";

  const router = useRouter();
  // The cancellation as the server last confirmed it, until the plan is read again.
  const [override, setOverride] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const cancelled = plan?.kind === "subscription" ? (override ?? plan.cancelAtPeriodEnd) : false;
  const endDate = plan?.kind === "subscription" && plan.periodEnd ? formatDateDisplay(plan.periodEnd.slice(0, 10)) : null;

  const close = (next: boolean) => {
    if (!next) {
      setConfirming(false);
      setFailed(false);
    }
    onOpenChange(next);
  };

  const change = async (action: "cancel" | "resume") => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { cancelAtPeriodEnd?: boolean };
      setOverride(Boolean(data.cancelAtPeriodEnd));
      setConfirming(false);
      notifyPlanChanged();
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  // The price as bought - the mirrored amount, else the plan's list price for that billing.
  let price: string | null = null;
  let per = "";
  if (plan?.kind === "subscription") {
    const billing = plan.billing ?? "monthly";
    const list = def?.price != null ? (billing === "annual" ? planPricing(def.price, "annual").annualTotal : def.price) : null;
    const cents = plan.amountCents ?? (list != null ? list * 100 : null);
    price = cents != null ? formatPrice(cents / 100) : null;
    per = d.perPeriod[billing];
  } else if (plan?.kind === "one_time") {
    price = formatPrice(plan.amountCents / 100);
    per = d.oneTimePaid;
  }

  const pill =
    "group inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-5 text-sm font-bold transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5";
  const primary = cn(pill, "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,1)]");
  const secondary = cn(pill, "border border-white/25 font-semibold text-white/85 hover:border-primary/70 hover:bg-white/10 hover:text-white");

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        data-lenis-prevent
        className="max-h-[calc(100dvh-2rem)] w-[min(94vw,40rem)] max-w-none gap-0 overflow-y-auto rounded-3xl border border-white/10 bg-[linear-gradient(170deg,#2a1a10_0%,#141518_45%)] p-0 text-[#f4f4f5] ring-0 sm:max-w-none"
      >
        <button
          type="button"
          onClick={() => close(false)}
          aria-label={d.close}
          className="absolute top-4 right-4 z-[1] flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/85 transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/70"
        >
          <IconX className="size-[18px]" aria-hidden />
        </button>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{d.title}</p>

          {!plan || plan.kind === "none" || !copy ? (
            <>
              <DialogTitle className="mt-2 font-heading text-3xl font-black uppercase">{d.noneTitle}</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-white/60">{d.noneText}</DialogDescription>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`${pricingPath(language)}?for=business`} className={primary} onClick={() => close(false)}>
                  {d.seePlans}
                  <IconArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Link>
                <Link href={`${pricingPath(language)}?for=individual`} className={secondary} onClick={() => close(false)}>
                  {d.orderAnother}
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2.5 pr-12">
                <DialogTitle className="font-heading text-3xl font-black uppercase leading-none">{copy.name}</DialogTitle>
                {plan.kind === "subscription" ? (
                  <span className={PEARL_TAG}>
                    <IconDiamondFilled className="size-2.5" aria-hidden />
                    {d.subscription}
                  </span>
                ) : (
                  <span className={PEARL_TAG}>{d.oneTime}</span>
                )}
              </div>
              <DialogDescription className="mt-2 text-[13.5px] text-[#9a9ba3]">{copy.for}</DialogDescription>

              {price ? (
                <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-heading text-4xl font-black leading-none tracking-[-0.02em]">{price}</span>
                  <span className="text-[13.5px] text-[#9a9ba3]">{per}</span>
                </p>
              ) : null}

              {/* The facts of the purchase. */}
              <dl className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
                {(plan.kind === "subscription"
                  ? [
                      [d.status, statusLabels[plan.status] ?? plan.status],
                      [d.billingLabel, plan.billing ? d.billing[plan.billing] : "-"],
                      ...(plan.periodEnd ? [[cancelled ? d.ends : d.renews, formatDateDisplay(plan.periodEnd.slice(0, 10))]] : []),
                      [d.videoTime, d.videoTimeMonthly.replace("{volume}", copy.volume).replace("{unit}", copy.volumeUnit)],
                    ]
                  : [
                      [d.videoTime, d.videoTimeOneTime.replace("{n}", formatVideoTime(plan.seconds))],
                      ...(plan.paidAt ? [[d.bought, formatDateDisplay(plan.paidAt.slice(0, 10))]] : []),
                    ]
                ).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-3.5 py-3">
                    <dt className="text-xs text-white/45">{k}</dt>
                    <dd className="mt-0.5 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* Included, then not. */}
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{d.included}</p>
              <ul className="mt-3 text-[13.8px]">
                {copy.features.map((feature) => (
                  <li key={feature} className="mb-[9px] flex items-start gap-2.5">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-[#ff8a1f]" stroke={2.5} aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
                {copy.missing.map((feature) => (
                  <li key={feature} className="mb-[9px] flex items-start gap-2.5 text-[#62636b]">
                    <IconX className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      <span className="sr-only">{d.notIncluded}: </span>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* What a revision is (the pricing page's definition). */}
              <p className="mt-4 rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[12.5px] leading-relaxed text-[#9a9ba3]">
                <strong className="text-[#f4f4f5]">{p.everyPlan.revisionTerm}</strong> {p.everyPlan.revisionText}
              </p>

              {/* The way up. */}
              <div className="mt-6 flex flex-wrap gap-3">
                {plan.kind === "subscription" ? (
                  <>
                    <a href={`${EMAIL_PRIMARY.href}?subject=${encodeURIComponent(`${d.upgradeSubject} (${copy.name})`)}`} className={primary}>
                      {d.upgrade}
                      <IconArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                    </a>
                    <Link href={`${pricingPath(language)}?for=${audience}`} className={secondary} onClick={() => close(false)}>
                      {d.compare}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={`${pricingPath(language)}?for=business`} className={primary} onClick={() => close(false)}>
                      {d.seePlans}
                      <IconArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                    </Link>
                    <Link href={`${pricingPath(language)}?for=individual`} className={secondary} onClick={() => close(false)}>
                      {d.orderAnother}
                    </Link>
                  </>
                )}
              </div>
              {plan.kind === "subscription" ? <p className="mt-3 text-xs leading-relaxed text-white/45">{d.upgradeNote}</p> : null}

              {/* Cancel at the end of the paid period - or take that back. */}
              {plan.kind === "subscription" ? (
                <div className="mt-6 border-t border-white/10 pt-5">
                  {cancelled ? (
                    <>
                      <p className="text-sm leading-relaxed text-white/70">{endDate ? d.cancelledNote.replace("{date}", endDate) : d.cancelledNoteNoDate}</p>
                      <button type="button" disabled={busy} onClick={() => change("resume")} className={cn(secondary, "mt-3", DISABLED)}>
                        {busy ? d.resuming : d.resume}
                      </button>
                    </>
                  ) : confirming ? (
                    <div role="group" aria-labelledby="cancel-plan-title" className="rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-4">
                      <p id="cancel-plan-title" className="font-semibold">
                        {d.cancelTitle}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-white/65">{endDate ? d.cancelText.replace("{date}", endDate) : d.cancelTextNoDate}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => change("cancel")}
                          className={cn(pill, "border border-red-400/50 font-semibold text-red-200 hover:border-red-400 hover:bg-red-500/15 hover:shadow-[0_10px_26px_-12px_rgba(248,113,113,0.7)]", DISABLED)}
                        >
                          {busy ? d.cancelling : d.cancelConfirm}
                        </button>
                        <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={cn(secondary, DISABLED)}>
                          {d.cancelKeep}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="cursor-pointer text-sm font-semibold text-white/55 underline-offset-4 transition-[transform,color] duration-200 ease-out hover:translate-x-0.5 hover:text-red-300 hover:underline"
                    >
                      {d.cancel}
                    </button>
                  )}
                  {failed ? (
                    <p role="alert" className="mt-3 text-sm text-red-300">
                      {d.cancelError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
