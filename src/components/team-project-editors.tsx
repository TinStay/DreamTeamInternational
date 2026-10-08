"use client";

import { IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import type { RevisionEntry, TimelineStep } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

const FIELD = "h-10 border-white/12 bg-black/30";
const ICON_BUTTON =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/60 transition-[transform,background-color,color] duration-200 ease-out hover:scale-105 hover:bg-white/10 hover:text-white";
const ADD_BUTTON =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/75 transition-[transform,background-color,color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff8a1f]/55 hover:bg-[#ff7a1a]/10 hover:text-[#ffb066]";

/** A round tick button: filled orange when done. */
function DoneToggle({ done, label, onToggle }: { done: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-[transform,background-color,border-color] duration-200 ease-out hover:scale-105",
        done ? "border-transparent bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "border-white/25 text-transparent hover:border-[#ff8a1f]/60"
      )}
    >
      <IconCheck className="size-4" stroke={3} aria-hidden />
    </button>
  );
}

/**
 * The project's timeline as the client sees it: `null` = the five standard stages (ticked off by the stage), or a custom
 * list of steps the team writes (title, date, note, done). "Customise" starts the custom list from the standard stages.
 */
export function TimelineEditor({ value, standard, onChange }: { value: TimelineStep[] | null; standard: TimelineStep[]; onChange: (next: TimelineStep[] | null) => void }) {
  const { t } = useLanguage();
  const d = t.team.timeline;

  if (value === null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-white/55">{d.standard}</p>
        <button type="button" onClick={() => onChange(standard.map((s) => ({ ...s })))} className={ADD_BUTTON}>
          {d.customise}
        </button>
      </div>
    );
  }

  const set = (i: number, patch: Partial<TimelineStep>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <ol className="flex flex-col gap-3">
        {value.map((step, i) => (
          <li key={i} className="grid gap-2 rounded-xl border border-white/8 bg-black/20 p-3 sm:grid-cols-[auto_1fr_10rem_auto] sm:items-center">
            <DoneToggle done={step.done} label={`${d.done}: ${step.title || d.step}`} onToggle={() => set(i, { done: !step.done })} />
            <Input value={step.title} onChange={(e) => set(i, { title: e.target.value })} placeholder={d.step} aria-label={d.step} className={FIELD} />
            <Input type="date" value={step.date?.slice(0, 10) ?? ""} onChange={(e) => set(i, { date: e.target.value || null })} aria-label={d.date} className={FIELD} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={d.remove} className={ICON_BUTTON}>
              <IconTrash className="size-4" aria-hidden />
            </button>
            <Input value={step.note ?? ""} onChange={(e) => set(i, { note: e.target.value || null })} placeholder={d.note} aria-label={d.note} className={cn(FIELD, "sm:col-span-4")} />
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => onChange([...value, { title: "", date: null, note: null, done: false }])} className={ADD_BUTTON}>
          <IconPlus className="size-4" aria-hidden />
          {d.add}
        </button>
        <button type="button" onClick={() => onChange(null)} className="cursor-pointer text-sm text-white/50 underline decoration-white/25 underline-offset-2 transition-colors duration-200 hover:text-[#ff8a1f]">
          {d.reset}
        </button>
      </div>
    </div>
  );
}

/** The client's revision requests: tick one off when it's done, add one the client asked for elsewhere, remove a mistake. */
export function RevisionLogEditor({ value, onChange }: { value: RevisionEntry[]; onChange: (next: RevisionEntry[]) => void }) {
  const { t } = useLanguage();
  const d = t.team.revisionLog;
  const set = (i: number, patch: Partial<RevisionEntry>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      {value.length === 0 ? <p className="text-sm text-white/45">{d.empty}</p> : null}
      <ul className="flex flex-col gap-2">
        {value.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <DoneToggle done={r.done} label={`${d.done}: ${r.title || d.placeholder}`} onToggle={() => set(i, { done: !r.done })} />
            <Input value={r.title} onChange={(e) => set(i, { title: e.target.value })} placeholder={d.placeholder} aria-label={d.placeholder} className={cn(FIELD, "flex-1")} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={d.remove} className={ICON_BUTTON}>
              <IconTrash className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...value, { title: "", date: new Date().toISOString().slice(0, 10), done: false }])}
        className={cn(ADD_BUTTON, "mt-3")}
      >
        <IconPlus className="size-4" aria-hidden />
        {d.add}
      </button>
    </div>
  );
}
