"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconBellFilled, IconExternalLink, IconX } from "@tabler/icons-react";
import { formatMoney } from "@/components/invoice-list";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { cn } from "@/lib/utils";

type DueInvoice = {
  id: string;
  number: string | null;
  totalCents: number;
  currency: string;
  dueAt: string | null;
  description: string | null;
  hostedUrl: string;
};

// The invoices this browser has already been shown, so a new one opens the panel once and an old one never again.
const SEEN_KEY = "kb-seen-invoices";
// Ask again when the window regains focus, at most this often.
const REFRESH_MS = 60_000;

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
    /* private mode - the panel just opens again next time */
  }
}

/**
 * The header's invoice notice, for a signed-in client: nothing while there is nothing to pay; with an invoice waiting
 * (one the team sent from the Clients tab, or a renewal that did not go through), a bell with the count, and its panel -
 * each invoice's number, total, due date and a **Pay now** button to Stripe's page. A new invoice opens the panel by
 * itself the first time this browser sees it. It asks `/api/invoices/due` on load and when the window regains focus.
 */
export function InvoiceNotice({ align = "right" }: { align?: "right" | "left" }) {
  const { t } = useLanguage();
  const c = t.account.invoiceNotice;
  const [invoices, setInvoices] = useState<DueInvoice[]>([]);
  const [open, setOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const lastFetch = useRef(0);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    lastFetch.current = Date.now();
    try {
      const res = await fetch("/api/invoices/due", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { invoices?: DueInvoice[] };
      const list = json.invoices ?? [];
      setInvoices(list);
      const seen = readSeen();
      const fresh = list.filter((inv) => !seen.includes(inv.id));
      if (fresh.length) {
        setIsNew(true);
        setOpen(true);
        writeSeen([...seen, ...fresh.map((inv) => inv.id)]);
      }
    } catch {
      /* offline - try again on the next focus */
    }
  }, []);

  useEffect(() => {
    // The first ask runs off the effect's own tick, so no state is set while the effect itself runs.
    const first = window.setTimeout(load, 0);
    const onFocus = () => {
      if (Date.now() - lastFetch.current > REFRESH_MS) void load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!invoices.length) return null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setIsNew(false);
        }}
        aria-expanded={open}
        aria-label={c.label.replace("{count}", String(invoices.length))}
        className="group relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/[0.06] text-white transition-[transform,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-white/[0.12]"
      >
        <IconBellFilled className="size-5 transition-transform duration-200 group-hover:rotate-[-12deg] group-hover:scale-110" aria-hidden />
        <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-primary-foreground shadow-[0_0_0_2px_#0b0c0f]">
          {invoices.length}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={c.title}
          className={cn(
            "absolute top-[calc(100%+0.75rem)] z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#141518]/95 p-4 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{isNew ? c.newTitle : c.title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.close}
              className="-mt-1 -mr-1 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-white/55 transition-[transform,background-color,color] duration-200 hover:scale-110 hover:bg-white/10 hover:text-white"
            >
              <IconX className="size-4" aria-hidden />
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {invoices.map((inv) => (
              <li key={inv.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xl font-bold tabular-nums">{formatMoney(inv.totalCents, inv.currency)}</span>
                  {inv.number ? <span className="text-xs text-white/45">#{inv.number}</span> : null}
                </div>
                {inv.description ? <p className="mt-1 line-clamp-2 text-sm text-white/70">{inv.description}</p> : null}
                {inv.dueAt ? <p className="mt-1 text-xs text-white/50">{c.due.replace("{date}", formatDateDisplay(inv.dueAt.slice(0, 10)))}</p> : null}
                <a
                  href={inv.hostedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[0_10px_26px_-12px_var(--color-primary)] transition-[transform,box-shadow,filter] duration-200 ease-out hover:-translate-y-px hover:brightness-110"
                >
                  {c.pay}
                  <IconExternalLink className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
