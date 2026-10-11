"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconSend, IconX } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { InvoiceList, formatMoney } from "@/components/invoice-list";
import type { InvoiceSummary } from "@/lib/invoices";
import { cn } from "@/lib/utils";

type Line = { description: string; amount: string };
const EMPTY_LINE: Line = { description: "", amount: "" };
const ADDRESS_KEYS = ["line1", "line2", "city", "state", "postal_code", "country"] as const;
type Address = Record<(typeof ADDRESS_KEYS)[number], string>;
const EMPTY_ADDRESS: Address = { line1: "", line2: "", city: "", state: "", postal_code: "", country: "US" };

const FIELD =
  "h-10 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/30 transition-[border-color,background-color] duration-200 focus:border-primary/70 focus:bg-white/[0.07] focus:outline-none";
const LABEL = "mb-1 block text-xs font-semibold text-white/55";
const PILL =
  "group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

const cents = (amount: string) => Math.round(Number.parseFloat(amount.replace(/[$,\s]/g, "")) * 100);

/**
 * The team's invoices for one client, in their client window: what they have been billed (`InvoiceList`), and a form to
 * bill a custom quote - lines in USD before tax, the days until it is due, a note, and the billing address when the client
 * has none on file (Stripe needs one to work out the tax). Sending goes through `/api/team/invoices`; Stripe emails it.
 */
export function TeamClientInvoices({ userId, sample = false }: { userId: string; sample?: boolean }) {
  const { t } = useLanguage();
  const v = t.team.clients.invoices;
  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(sample ? [] : null);
  const [hasAddress, setHasAddress] = useState(false);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([EMPTY_LINE]);
  const [days, setDays] = useState("14");
  const [memo, setMemo] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (sample) return;
    let live = true;
    fetch(`/api/team/invoices?userId=${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : { invoices: [], hasAddress: false }))
      .then((d: { invoices?: InvoiceSummary[]; hasAddress?: boolean }) => {
        if (!live) return;
        setInvoices(d.invoices ?? []);
        setHasAddress(Boolean(d.hasAddress));
      })
      .catch(() => live && setInvoices([]));
    return () => {
      live = false;
    };
  }, [userId, sample]);

  const subtotal = lines.reduce((s, l) => s + (cents(l.amount) || 0), 0);
  const setLine = (i: number, patch: Partial<Line>) => setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  async function send() {
    setBusy(true);
    setMessage(null);
    const filled = Object.entries(address).some(([k, val]) => k !== "country" && val.trim());
    const res = await fetch("/api/team/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        lines: lines.map((l) => ({ description: l.description, amountCents: cents(l.amount) })),
        daysUntilDue: Number.parseInt(days, 10),
        memo,
        ...(filled ? { address } : {}),
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { invoice?: InvoiceSummary; error?: string; message?: string } | undefined;
    setBusy(false);
    if (res?.ok && data?.invoice) {
      setInvoices((prev) => [data.invoice as InvoiceSummary, ...(prev ?? [])]);
      if (filled) setHasAddress(true);
      setLines([EMPTY_LINE]);
      setMemo("");
      setOpen(false);
      setMessage({ ok: true, text: v.sent });
      return;
    }
    const key = data?.error ?? "generic";
    setMessage({ ok: false, text: (v.errors[key] ?? v.errors.generic).replace("{message}", data?.message ?? "") });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-black uppercase tracking-wide text-white/90">{v.title}</h3>
        {!open && !sample ? (
          <button type="button" onClick={() => setOpen(true)} className={cn(PILL, "border border-white/25 text-white/85 hover:border-primary/70 hover:bg-white/10 hover:text-white")}>
            <IconPlus className="size-4 transition-transform duration-200 group-hover:rotate-90" aria-hidden />
            {v.newInvoice}
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm text-white/50">{v.hint}</p>

      {open ? (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          {lines.map((line, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
              <label>
                <span className={LABEL}>{v.line}</span>
                <input className={FIELD} value={line.description} maxLength={250} placeholder={v.linePlaceholder} onChange={(e) => setLine(i, { description: e.target.value })} />
              </label>
              <label>
                <span className={LABEL}>{v.amount}</span>
                <input className={FIELD} inputMode="decimal" value={line.amount} placeholder="0.00" onChange={(e) => setLine(i, { amount: e.target.value })} />
              </label>
              <button
                type="button"
                aria-label={v.removeLine}
                disabled={lines.length === 1}
                onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/60 transition-[transform,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                <IconX className="size-4" aria-hidden />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={lines.length >= 20}
              onClick={() => setLines((prev) => [...prev, EMPTY_LINE])}
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary transition-transform duration-200 ease-out hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconPlus className="size-4" aria-hidden />
              {v.addLine}
            </button>
            <span className="text-sm text-white/60">
              {v.subtotal}: <span className="font-semibold tabular-nums text-white">{formatMoney(subtotal)}</span>
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
            <label>
              <span className={LABEL}>{v.dueIn}</span>
              <input className={FIELD} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </label>
            <label>
              <span className={LABEL}>{v.memo}</span>
              <input className={FIELD} value={memo} maxLength={500} onChange={(e) => setMemo(e.target.value)} />
            </label>
          </div>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{v.address}</legend>
            <p className="mt-1 mb-3 text-xs text-white/45">{hasAddress ? v.addressHint : v.errors.address_required}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {ADDRESS_KEYS.map((key) => (
                <label key={key} className={key === "line1" ? "sm:col-span-2" : undefined}>
                  <span className={LABEL}>{v.addressFields[key]}</span>
                  <input
                    className={FIELD}
                    value={address[key]}
                    maxLength={key === "country" ? 2 : 120}
                    onChange={(e) => setAddress((prev) => ({ ...prev, [key]: key === "country" ? e.target.value.toUpperCase() : e.target.value }))}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || subtotal < 100}
              onClick={send}
              className={cn(PILL, "bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_var(--color-primary)] hover:shadow-[0_12px_30px_-10px_var(--color-primary)]")}
            >
              <IconSend className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              {busy ? v.sending : v.send}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={cn(PILL, "text-white/65 hover:text-white")}>
              {v.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p role="status" className={cn("mt-3 text-sm", message.ok ? "text-emerald-300" : "text-[#ffb066]")}>
          {message.text}
        </p>
      ) : null}

      {invoices === null ? <p className="mt-3 text-sm text-white/45">{t.team.clients.loading}</p> : <InvoiceList invoices={invoices} />}
    </div>
  );
}
