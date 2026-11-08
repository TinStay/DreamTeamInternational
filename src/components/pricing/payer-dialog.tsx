"use client";

import { useState } from "react";
import { IconBuilding, IconBuildingSkyscraper, IconCheck, IconUser } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/language-context";
import { PAYER_TYPES, type PayerType } from "@/lib/payer";
import { cn } from "@/lib/utils";

const ICONS = { person: IconUser, company_bg: IconBuilding, company_abroad: IconBuildingSkyscraper } as const;
const LAST_KEY = "kb-last-payer";

function lastPayer(): PayerType {
  try {
    const v = localStorage.getItem(LAST_KEY);
    return (PAYER_TYPES as readonly string[]).includes(v ?? "") ? (v as PayerType) : "person";
  } catch {
    return "person";
  }
}

/**
 * "Who is paying?" - asked right before Stripe's checkout opens, every time: a person, a company in Bulgaria or a company
 * outside Bulgaria. It decides the VAT (`lib/payer.ts`): a company outside Bulgaria pays none, the others pay Bulgarian
 * VAT. The last answer is preselected (this browser only).
 */
export function PayerDialog({ open, onOpenChange, onChoose, busy }: { open: boolean; onOpenChange: (open: boolean) => void; onChoose: (payer: PayerType) => void; busy: boolean }) {
  const { t } = useLanguage();
  const c = t.plans.payer;
  const [choice, setChoice] = useState<PayerType>(() => (typeof window === "undefined" ? "person" : lastPayer()));

  function go() {
    try {
      localStorage.setItem(LAST_KEY, choice);
    } catch {
      /* private mode */
    }
    onChoose(choice);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-lenis-prevent
        className="w-[min(94vw,30rem)] max-w-none gap-0 rounded-3xl border border-white/10 bg-[linear-gradient(170deg,#2a1a10_0%,#141518_45%)] p-6 text-[#f4f4f5] ring-0 sm:max-w-none sm:p-7"
      >
        <DialogTitle className="font-heading text-2xl font-black uppercase leading-tight">{c.title}</DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-relaxed text-white/60">{c.text}</DialogDescription>
        <div role="radiogroup" aria-label={c.title} className="mt-5 flex flex-col gap-2.5">
          {PAYER_TYPES.map((key) => {
            const Icon = ICONS[key];
            const on = choice === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setChoice(key)}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5",
                  on ? "border-primary/70 bg-primary/10" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                )}
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105", on ? "bg-primary text-primary-foreground" : "bg-white/[0.06] text-[#ff8a1f]")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{c.options[key].label}</span>
                  <span className="block text-xs text-white/55">{c.options[key].note}</span>
                </span>
                {on ? <IconCheck className="size-5 shrink-0 text-primary" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={go}
          disabled={busy}
          className="mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-primary text-[15px] font-bold text-primary-foreground shadow-[0_14px_34px_-14px_var(--color-primary)] transition-[transform,box-shadow,filter] duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {busy ? c.opening : c.continue}
        </button>
      </DialogContent>
    </Dialog>
  );
}
