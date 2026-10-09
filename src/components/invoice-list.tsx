"use client";

import { IconDownload, IconExternalLink } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import type { InvoiceSummary } from "@/lib/invoices";
import { cn } from "@/lib/utils";

/** An invoice amount to the cent (tax rarely comes out whole). */
export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

const LINK =
  "group inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-white/20 px-3 text-xs font-semibold text-white/80 transition-[transform,border-color,background-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/70 hover:bg-white/10 hover:text-white";

/**
 * A client's Stripe invoices, newest first - the number, date, total with its tax, the status (a due one shows its due
 * date and a Pay link), and links to Stripe's hosted page and the PDF. The account page and the team's client window
 * both show it.
 */
export function InvoiceList({ invoices }: { invoices: InvoiceSummary[] }) {
  const { t } = useLanguage();
  const v = t.account.invoices;
  if (invoices.length === 0) return <p className="mt-2 text-sm text-white/55">{v.empty}</p>;
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
            <th className="py-2 pr-4 font-semibold">{v.cols.number}</th>
            <th className="py-2 pr-4 font-semibold">{v.cols.date}</th>
            <th className="py-2 pr-4 font-semibold">{v.cols.amount}</th>
            <th className="py-2 pr-4 font-semibold">{v.cols.tax}</th>
            <th className="py-2 pr-4 font-semibold">{v.cols.status}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="py-3 pr-4">
                <span className="font-semibold">{inv.number ?? "-"}</span>
                {inv.description ? <span className="block max-w-[28ch] truncate text-xs text-white/45">{inv.description}</span> : null}
              </td>
              <td className="py-3 pr-4 text-white/60">{formatDateDisplay(inv.createdAt.slice(0, 10))}</td>
              <td className="py-3 pr-4 font-semibold tabular-nums">{formatMoney(inv.totalCents, inv.currency)}</td>
              <td className="py-3 pr-4 tabular-nums text-white/60">{formatMoney(inv.taxCents, inv.currency)}</td>
              <td className="py-3 pr-4">
                <span className={cn(inv.status === "paid" ? "text-emerald-300" : inv.status === "open" ? "text-[#ffb066]" : "text-white/50")}>{v.status[inv.status] ?? inv.status}</span>
                {inv.status === "open" && inv.dueAt ? <span className="block text-xs text-white/45">{v.due.replace("{date}", formatDateDisplay(inv.dueAt.slice(0, 10)))}</span> : null}
              </td>
              <td className="py-3">
                <span className="flex justify-end gap-2">
                  {inv.hostedUrl ? (
                    <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
                      {inv.status === "open" ? v.pay : v.view}
                      <IconExternalLink className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  ) : null}
                  {inv.pdfUrl ? (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
                      {v.pdf}
                      <IconDownload className="size-3.5 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden />
                    </a>
                  ) : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
