"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatVideoTime } from "@/lib/account-info";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const FIELD = "h-11 border-white/12 bg-black/30";

/**
 * The team's "add or take back video seconds" control: minutes + seconds, add / take back, a note, Apply - one
 * `credit_ledger` row (`adjustment` or `refund`, the team's only kinds - supabase/credits.sql). Used in a project's window
 * (the row carries that project) and in a client's window. `onApplied` gets the signed amount and the row.
 */
export function TeamCreditAdjuster({
  userId,
  projectId = null,
  sample,
  onApplied,
}: {
  userId: string;
  projectId?: string | null;
  sample: boolean;
  onApplied: (seconds: number, row: { id: string; kind: string; note: string | null; createdAt: string }) => void;
}) {
  const { t } = useLanguage();
  const d = t.team.credits;
  const [min, setMin] = useState("");
  const [sec, setSec] = useState("");
  const [take, setTake] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Minutes and seconds together, added or taken back (a negative amount).
  const amount = (Math.max(0, Number.parseInt(min, 10) || 0) * 60 + Math.max(0, Number.parseInt(sec, 10) || 0)) * (take ? -1 : 1);

  async function apply() {
    if (!amount || busy) return;
    setBusy(true);
    setMessage(null);
    const kind = amount > 0 ? "adjustment" : "refund";
    let row = { id: `local-${Date.now()}`, kind, note: note.trim() || null, createdAt: new Date().toISOString() };
    if (!sample) {
      const { data, error } = await createClient()
        .from("credit_ledger")
        .insert({ user_id: userId, seconds: amount, kind, note: row.note, project_id: projectId })
        .select("id, created_at")
        .single();
      if (error || !data) {
        setMessage(d.error);
        setBusy(false);
        return;
      }
      row = { ...row, id: String(data.id), createdAt: String(data.created_at) };
    }
    onApplied(amount, row);
    setMin("");
    setSec("");
    setNote("");
    setMessage(d.done);
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex overflow-hidden rounded-full border border-white/15 text-sm font-semibold" role="radiogroup" aria-label={d.action}>
          {[false, true].map((x) => (
            <button
              key={String(x)}
              type="button"
              role="radio"
              aria-checked={take === x}
              onClick={() => setTake(x)}
              className={cn("cursor-pointer px-4 py-2.5 transition-colors duration-200", take === x ? "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "text-white/60 hover:text-white")}
            >
              {x ? d.take : d.add}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60">
          <Input type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" aria-label={d.minutes} className={cn(FIELD, "w-24")} />
          {d.minutes}
        </label>
        <label className="flex items-center gap-2 text-sm text-white/60">
          <Input type="number" min={0} max={59} value={sec} onChange={(e) => setSec(e.target.value)} placeholder="0" aria-label={d.seconds} className={cn(FIELD, "w-24")} />
          {d.seconds}
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={d.notePlaceholder} aria-label={d.note} className={FIELD} />
        <button
          type="button"
          onClick={() => void apply()}
          disabled={!amount || busy}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-[#ff8a1f]/55 px-5 text-sm font-semibold text-[#ffb066] transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#ff7a1a]/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {amount ? `${take ? d.take : d.add} ${formatVideoTime(Math.abs(amount))}` : d.apply}
        </button>
      </div>
      {message ? (
        <p role="status" className="mt-3 text-sm text-[#ffb066]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
