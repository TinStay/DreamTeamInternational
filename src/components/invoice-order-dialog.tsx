"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { IconMailFilled, IconX } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/components/invoice-list";
import { useLanguage } from "@/lib/i18n/language-context";
import { countryOptions } from "@/lib/countries";
import { formatDateDisplay } from "@/lib/dates";
import { refundsPath, termsPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** The billing details an order's invoice is addressed to (`lib/billing-details.ts`). */
export type OrderDetails = { name: string; address: { line1: string; city: string; state?: string; postal_code: string; country: string } };
/** The invoice that went out, as the order routes return it. */
export type SentInvoice = { number: string | null; email: string; totalCents: number; currency: string; dueAt: string | null };
export type OrderResult = { invoice?: SentInvoice; error?: string };

const FIELD =
  "h-11 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-[border-color,background-color] duration-200 focus:border-[#ff8a1f]/70 focus:bg-white/[0.06]";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-white/70";
const PILL =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-bold transition-[transform,box-shadow,background-color,filter] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0";

type Form = { name: string; line1: string; city: string; state: string; postal_code: string; country: string };
const EMPTY: Form = { name: "", line1: "", city: "", state: "", postal_code: "", country: "" };

/**
 * The order window of the **invoice flow** (`purchaseFlow()`, `lib/stripe.ts`): nothing is paid on the site - the client
 * confirms what they are ordering and who the invoice is for (name and billing address, filled in from what Stripe
 * already holds; a company saved on the account keeps its own name), and Stripe emails them the invoice. The second
 * screen says where it went and what happens once it is paid. Used by `/pricing` (packs and plans) and by a project's
 * paid change requests; `submit` is the caller's request to its own route.
 */
export function InvoiceOrderDialog({
  open,
  onOpenChange,
  title,
  price,
  renewal,
  afterPaid,
  submit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is being ordered, e.g. "Creator - monthly plan". */
  title: string;
  /** Its price before tax, e.g. "$389.00 / month". */
  price: string;
  /** The renewal sentence of a plan (subscriptions only). */
  renewal?: string | null;
  /** What happens once the invoice is paid. */
  afterPaid: string;
  submit: (details: OrderDetails) => Promise<OrderResult>;
}) {
  const { t, language } = useLanguage();
  const c = t.plans.invoiceOrder;
  const [form, setForm] = useState<Form>(EMPTY);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SentInvoice | null>(null);
  const countries = useMemo(() => countryOptions(), []);

  // Opened: start from what Stripe already holds for the client.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/checkout", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { email?: string; name?: string; company?: boolean; address?: Partial<Form> | null } | null) => {
        if (!alive) return;
        if (json) {
          setEmail(json.email ?? "");
          setCompany(Boolean(json.company));
          setForm({ ...EMPTY, name: json.name ?? "", ...(json.address ? { line1: json.address.line1 ?? "", city: json.address.city ?? "", state: json.address.state ?? "", postal_code: json.address.postal_code ?? "", country: json.address.country ?? "" } : {}) });
        }
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [open]);

  function close(next: boolean) {
    if (next || sending) return;
    onOpenChange(false);
    // Left as it was closed until the closing animation is over.
    window.setTimeout(() => {
      setSent(null);
      setError(null);
      setLoaded(false);
    }, 200);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    const { name, country, state, ...rest } = form;
    const result = await submit({ name, address: { ...rest, country, ...(state.trim() ? { state } : {}) } }).catch((): OrderResult => ({ error: "failed" }));
    setSending(false);
    if (result.invoice) {
      setSent(result.invoice);
      return;
    }
    setError((c.errors as Record<string, string>)[result.error ?? ""] ?? c.errors.failed);
  }

  const set = (key: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const usState = form.country === "US";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] w-[min(94vw,36rem)] max-w-none gap-0 overflow-y-auto rounded-3xl border border-white/10 bg-[linear-gradient(170deg,#2a1a10_0%,#141518_45%)] p-0 text-[#f4f4f5] ring-0 sm:max-w-none"
      >
        <button
          type="button"
          aria-label={c.close}
          onClick={() => close(false)}
          className="absolute top-4 right-4 z-[1] flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/85 transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/70"
        >
          <IconX className="size-[18px]" aria-hidden />
        </button>

        {sent ? (
          <div className="p-6 sm:p-8">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#ff7a1a]/15 text-[#ff8a1f]">
              <IconMailFilled className="size-7" aria-hidden />
            </span>
            <DialogTitle className="mt-5 font-heading text-3xl font-black uppercase leading-none">{c.sentTitle}</DialogTitle>
            <DialogDescription className="mt-3 text-[15px] leading-relaxed text-white/70">
              {c.sentText
                .replace("{number}", sent.number ?? "")
                .replace("{total}", formatMoney(sent.totalCents, sent.currency))
                .replace("{email}", sent.email)}
            </DialogDescription>
            <ol className="mt-5 flex flex-col gap-2.5 text-sm text-white/75">
              {[c.step1, c.step2, afterPaid].map((step, i) => (
                <li key={step} className="flex gap-3 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ff7a1a]/15 text-xs font-bold text-[#ff8a1f]">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {sent.dueAt ? <p className="mt-4 text-xs text-white/45">{c.due.replace("{date}", formatDateDisplay(sent.dueAt.slice(0, 10)))}</p> : null}
            <button type="button" onClick={() => close(false)} className={cn(PILL, "mt-6 bg-primary text-primary-foreground shadow-[0_10px_26px_-12px_var(--color-primary)] hover:brightness-110")}>
              {c.done}
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{c.eyebrow}</p>
            <DialogTitle className="mt-2 pr-12 font-heading text-3xl font-black uppercase leading-none">{title}</DialogTitle>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="font-heading text-2xl font-black tracking-[-0.01em]">{price}</span>
              <span className="text-[13px] text-[#9a9ba3]">{c.plusTax}</span>
            </p>
            <DialogDescription className="mt-4 rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white/75">
              {c.how.replace("{email}", email || c.yourEmail)} {afterPaid}
            </DialogDescription>

            <fieldset disabled={!loaded || sending} className="mt-6 grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{c.billTo}</legend>
              {company ? (
                <p className="text-sm text-white/60 sm:col-span-2">{c.companyNote.replace("{name}", form.name)}</p>
              ) : (
                <label className="sm:col-span-2">
                  <span className={LABEL}>{c.name}</span>
                  <input className={FIELD} value={form.name} onChange={set("name")} required minLength={2} maxLength={120} autoComplete="name" />
                </label>
              )}
              <label className="sm:col-span-2">
                <span className={LABEL}>{c.country}</span>
                <select className={cn(FIELD, "cursor-pointer")} value={form.country} onChange={set("country")} required autoComplete="country">
                  <option value="" disabled>
                    {c.chooseCountry}
                  </option>
                  {countries.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={LABEL}>{c.address}</span>
                <input className={FIELD} value={form.line1} onChange={set("line1")} required maxLength={120} autoComplete="address-line1" />
              </label>
              <label>
                <span className={LABEL}>{c.city}</span>
                <input className={FIELD} value={form.city} onChange={set("city")} required maxLength={120} autoComplete="address-level2" />
              </label>
              <label>
                <span className={LABEL}>{c.postalCode}</span>
                <input className={FIELD} value={form.postal_code} onChange={set("postal_code")} required maxLength={20} autoComplete="postal-code" />
              </label>
              {usState ? (
                <label className="sm:col-span-2">
                  <span className={LABEL}>{c.state}</span>
                  <input className={FIELD} value={form.state} onChange={set("state")} required maxLength={40} placeholder="NY" autoComplete="address-level1" />
                </label>
              ) : null}
            </fieldset>

            <p className="mt-5 text-xs leading-relaxed text-white/50">
              {renewal ? `${renewal} ` : ""}
              {c.consentBefore}{" "}
              <Link href={termsPath(language)} target="_blank" className="font-semibold text-white/75 underline decoration-white/30 underline-offset-4 transition-colors duration-200 hover:text-white">
                {c.terms}
              </Link>{" "}
              {c.and}{" "}
              <Link href={refundsPath(language)} target="_blank" className="font-semibold text-white/75 underline decoration-white/30 underline-offset-4 transition-colors duration-200 hover:text-white">
                {c.refunds}
              </Link>
              {c.consentAfter}
            </p>
            {error ? (
              <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" disabled={!loaded || sending} className={cn(PILL, "bg-primary text-primary-foreground shadow-[0_10px_26px_-12px_var(--color-primary)] hover:brightness-110")}>
                {sending ? c.sending : c.send}
              </button>
              <button type="button" disabled={sending} onClick={() => close(false)} className={cn(PILL, "border border-white/20 text-white/80 hover:bg-white/10")}>
                {c.cancel}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
