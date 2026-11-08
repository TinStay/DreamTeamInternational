"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { IconBuildingStore } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { countryName, countryOptions } from "@/lib/countries";
import { EU_COUNTRIES } from "@/lib/invoice-profiles";
import { cn } from "@/lib/utils";

type Company = { name: string; country: string; number: string };
type Details = { company: Company | null; keep: boolean };

const FIELD =
  "h-11 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-[border-color,background-color] duration-200 focus:border-[#ff8a1f]/70 focus:bg-white/[0.06]";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-white/70";
const PILL =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-5 text-sm font-bold transition-[transform,box-shadow,background-color,filter] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0";

/**
 * The account page's "Business details" box. A company enters its name, country and company / VAT number here **before**
 * ordering - Stripe can only tell a company from a person by it (`lib/company-details.ts`): a company outside Bulgaria is
 * then charged no VAT, a company in Bulgaria pays 20%. With no company saved, each checkout asks again, and the switch
 * keeps a tax ID given at checkout for next time.
 */
export function BusinessDetailsCard({ titleClassName }: { titleClassName: string }) {
  const { t } = useLanguage();
  const c = t.account.businessDetails;
  const [details, setDetails] = useState<Details | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Company>({ name: "", country: "", number: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const countries = useMemo(() => countryOptions(), []);

  useEffect(() => {
    let alive = true;
    fetch("/api/account/business-details", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Details>) : null))
      .then((json) => {
        if (alive && json) setDetails(json);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function send(method: "POST" | "DELETE", body?: unknown) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/business-details", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const json = (await res.json().catch(() => ({}))) as Partial<Details> & { error?: string };
      if (!res.ok) {
        setError((c.errors as Record<string, string>)[json.error ?? ""] ?? c.errors.failed);
        return false;
      }
      setDetails((prev) => ({ company: json.company !== undefined ? json.company ?? null : prev?.company ?? null, keep: json.keep ?? prev?.keep ?? false }));
      return true;
    } catch {
      setError(c.errors.failed);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (await send("POST", { company: form })) setEditing(false);
  }

  const company = details?.company ?? null;
  const inEu = EU_COUNTRIES.has(form.country);
  const numberLabel = form.country === "BG" || inEu ? c.vatNumber : c.companyNumber;
  const numberRequired = form.country !== "BG";

  return (
    <div>
      <h2 className={titleClassName}>{c.title}</h2>
      <p className="mt-1.5 max-w-[75ch] text-sm leading-relaxed text-white/50">{c.hint}</p>

      {details === null ? null : editing ? (
        <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={LABEL}>{c.companyName}</span>
            <input className={FIELD} value={form.name} maxLength={120} required autoComplete="organization" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            <span className={LABEL}>{c.country}</span>
            <select className={cn(FIELD, "cursor-pointer")} value={form.country} required onChange={(e) => setForm({ ...form, country: e.target.value })}>
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
          <label>
            <span className={LABEL}>
              {numberLabel}
              {numberRequired ? "" : ` (${c.optional})`}
            </span>
            <input className={FIELD} value={form.number} maxLength={40} required={numberRequired} placeholder={inEu ? `${form.country === "GR" ? "EL" : form.country}123456789` : ""} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </label>
          {form.country ? <p className="text-xs text-white/50 sm:col-span-2">{form.country === "BG" ? c.vatBg : inEu ? c.vatEu : c.vatAbroad}</p> : null}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className={cn(PILL, "bg-primary text-primary-foreground shadow-[0_10px_26px_-12px_var(--color-primary)] hover:brightness-110")}>
              {saving ? c.saving : c.save}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={cn(PILL, "border border-white/20 text-white/80 hover:bg-white/10")}>
              {c.cancel}
            </button>
          </div>
        </form>
      ) : company ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ff7a1a]/12 text-[#ff8a1f]">
              <IconBuildingStore className="size-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold break-words">{company.name}</span>
              <span className="block text-sm text-white/60">
                {company.country ? `${countryName(company.country)} · ` : ""}
                {company.number}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setForm(company);
                setEditing(true);
              }}
              className={cn(PILL, "border border-white/20 text-white/80 hover:bg-white/10")}
            >
              {c.edit}
            </button>
            <button type="button" disabled={saving} onClick={() => void send("DELETE")} className={cn(PILL, "border border-white/20 text-white/80 hover:bg-white/10")}>
              {c.remove}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[60ch] text-sm text-white/60">{c.none}</p>
          <button
            type="button"
            onClick={() => {
              setForm({ name: "", country: "", number: "" });
              setEditing(true);
            }}
            className={cn(PILL, "shrink-0 bg-primary text-primary-foreground shadow-[0_10px_26px_-12px_var(--color-primary)] hover:brightness-110")}
          >
            {c.add}
          </button>
        </div>
      )}
      {company && !editing ? <p className="mt-3 text-xs text-white/45">{company.country === "BG" ? c.savedBg : EU_COUNTRIES.has(company.country) ? c.savedEu : c.savedAbroad}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
