"use client";

import { useEffect, useState } from "react";
import { IconBuildingStore } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type Details = { taxId: { type: string; value: string; country: string | null } | null; business?: string | null; keep: boolean };

/**
 * The account page's "Business details" box: the business name and tax ID saved from the client's last checkout, and a
 * switch - keep them for the next checkout, or be asked "business or person" every time (the default).
 */
export function BusinessDetailsCard({ titleClassName }: { titleClassName: string }) {
  const { t } = useLanguage();
  const c = t.account.businessDetails;
  const [details, setDetails] = useState<Details | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

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

  async function toggle() {
    if (!details?.taxId || saving) return;
    const keep = !details.keep;
    setSaving(true);
    setError(false);
    try {
      const res = await fetch("/api/account/business-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keep }) });
      if (!res.ok) throw new Error("failed");
      setDetails({ ...details, keep });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const hasTaxId = Boolean(details?.taxId);

  return (
    <div>
      <h2 className={titleClassName}>{c.title}</h2>
      <p className="mt-1.5 max-w-[75ch] text-sm leading-relaxed text-white/50">{c.hint}</p>
      {details === null ? null : hasTaxId ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ff7a1a]/12 text-[#ff8a1f]">
              <IconBuildingStore className="size-6" aria-hidden />
            </span>
            <span className="min-w-0">
              {details.business ? <span className="block text-base font-semibold break-words">{details.business}</span> : null}
              <span className="block text-sm text-white/60">{c.taxIdLabel.replace("{id}", details.taxId!.value)}</span>
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={details.keep}
            onClick={toggle}
            disabled={saving}
            className="group inline-flex cursor-pointer items-center gap-3 rounded-full py-1 text-left text-sm font-semibold text-white/85 transition-[transform,color] duration-200 ease-out hover:-translate-y-px hover:text-white disabled:cursor-wait disabled:opacity-70"
          >
            <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200", details.keep ? "bg-primary" : "bg-white/15")}>
              <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-200", details.keep ? "left-[1.375rem]" : "left-0.5")} />
            </span>
            {c.keep}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">{c.none}</p>
      )}
      {details?.taxId ? <p className="mt-3 text-xs text-white/45">{details.keep ? c.keepOn : c.keepOff}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-300">{c.error}</p> : null}
    </div>
  );
}
