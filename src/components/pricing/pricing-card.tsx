"use client";

import Link from "next/link";
import { IconCheck, IconSparkles, IconStack2, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Plan, PlanKey } from "@/lib/pricing";

/**
 * One plan's card (the client's reference: the Higgsfield plan cards) - a dark card washed with the plan's colour,
 * the name in big uppercase with a badge, a short line, an inset panel with the monthly volume, the price, a full-width
 * button in the plan's colour, an inset "what's included" panel (label + value rows, the value on a chip), and a
 * checklist (what the plan does not have, struck in muted ink).
 */
const TONE: Record<
  PlanKey,
  { card: string; button: string; chip: string; accent: string; badge: string }
> = {
  // Neutral graphite, a white button.
  local: {
    card: "border-white/10 bg-[linear-gradient(180deg,#1d1e22_0%,#141518_100%)]",
    button: "bg-white text-neutral-950 hover:bg-neutral-100",
    chip: "bg-white/10 text-white/85",
    accent: "text-white/70",
    badge: "",
  },
  // Olive, a lime button (the "Plus" card) - the most popular plan.
  brand: {
    card: "border-[#d8f24a]/25 bg-[linear-gradient(180deg,#2a2f18_0%,#1a1d12_45%,#141518_100%)]",
    button: "bg-[#e4f53a] text-neutral-950 hover:bg-[#ecfa62]",
    chip: "bg-[#e4f53a] text-neutral-950",
    accent: "text-[#e4f53a]",
    badge: "bg-[#e4f53a] text-neutral-950",
  },
  // Wine / magenta, a pink button (the "Ultra" card).
  premium: {
    card: "border-[#ff2d8a]/30 bg-[linear-gradient(180deg,#4a0f2b_0%,#2a0d1c_45%,#141518_100%)]",
    button: "bg-[linear-gradient(180deg,#ff4fa0_0%,#ff1f7a_100%)] text-white hover:brightness-110",
    chip: "bg-[#ff2d8a] text-white",
    accent: "text-[#ff6fb0]",
    badge: "bg-[#ff2d8a] text-white",
  },
};

const ROWS = ["quality", "script", "voiceover", "revisions"] as const;

export function PricingCard({ plan, href }: { plan: Plan; href: string }) {
  const { t, language } = useLanguage();
  const p = t.plans;
  const copy = p.tiers[plan.key];
  const tone = TONE[plan.key];
  const price = `€${plan.price.toLocaleString("en-US")}`;
  // "2.5" in English, "2,5" in Bulgarian.
  const minutes = plan.minutes.toLocaleString(language === "bg" ? "bg-BG" : "en-US");

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-[1.75rem] border p-3 text-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]",
        tone.card
      )}
    >
      <div className="px-3 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-3xl font-extrabold uppercase tracking-tight">{copy.name}</h2>
          {plan.popular ? (
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold uppercase italic", tone.badge)}>
              {p.mostPopular}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-white/60">{copy.tagline}</p>
      </div>

      {/* The monthly volume. */}
      <div className="mt-4 rounded-2xl bg-white/[0.06] p-4">
        <p className="flex items-center gap-2 font-semibold">
          <IconSparkles className={cn("size-4 shrink-0", tone.accent)} aria-hidden />
          {minutes} {p.videoPerMonth}
        </p>
        <p className="mt-1 ps-6 text-sm text-white/55">{p.clipsApprox.replace("{n}", String(plan.clips))}</p>
      </div>

      <div className="mt-5 flex items-baseline gap-2 px-3">
        <span className="font-heading text-5xl font-extrabold tracking-tight">{price}</span>
        <span className="text-sm text-white/55">{p.perMonth}</span>
      </div>

      <Link
        href={href}
        className={cn(
          "mt-4 flex h-12 cursor-pointer items-center justify-center rounded-xl text-base font-semibold shadow-[0_6px_0_-2px_rgba(255,255,255,0.14),0_14px_30px_-12px_rgba(0,0,0,0.8)] transition-[transform,filter,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
          tone.button
        )}
      >
        {p.choose} {copy.name}
      </Link>

      {/* What's included - label + value rows. */}
      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
        <p className="flex items-center gap-2 font-heading text-sm font-extrabold uppercase tracking-wide">
          <IconStack2 className="size-4 shrink-0" aria-hidden />
          {p.included}
        </p>
        <dl className="mt-3 divide-y divide-white/[0.07]">
          {ROWS.map((row) => (
            <div key={row} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-sm text-white/60">{p.rows[row]}</dt>
              <dd className={cn("rounded-md px-2 py-0.5 text-right text-xs font-semibold", tone.chip)}>{copy[row]}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* The checklist - what this plan lacks in muted ink. */}
      <ul className="mt-4 flex flex-col gap-2 px-3 pb-3 text-sm">
        {p.checklist.map((item, i) => {
          const has = plan.checklist[i];
          return (
            <li key={item} className={cn("flex items-center gap-2", has ? "text-white/90" : "text-white/35")}>
              {has ? (
                <IconCheck className="size-4 shrink-0" aria-hidden />
              ) : (
                <IconX className="size-4 shrink-0" aria-hidden />
              )}
              <span className={cn(!has && "line-through decoration-white/20")}>{item}</span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
