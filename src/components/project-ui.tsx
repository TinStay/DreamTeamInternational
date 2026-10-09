import type { ReactNode } from "react";
import { IconCheck } from "@tabler/icons-react";
import { formatDateDisplay } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * The building blocks the client's project page (`project-detail-view.tsx`) and the team's project window
 * (`team-project-popup.tsx`) share, so the two read as one design: the small orange section titles, the section headings
 * with their icon tile, the drawer's fact tiles and the timeline's step markers. The type is a size up from the first
 * cut (labels 13-14px, values 16px) - the client asked for bigger labels in both views.
 */

export const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";
export const PEARL_DISC = "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)]";

/** A small orange uppercase title over a block (the drawer's sections, the next step). */
export function SideTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-[13px] font-semibold uppercase tracking-[0.14em] text-[#ff8a1f]", className)}>{children}</h3>;
}

/** A content section's heading: the icon on an orange tile, the title, an optional count. */
export function SectionHead({ id, title, count, icon }: { id: string; title: string; count?: number; icon: ReactNode }) {
  return (
    <h2 id={id} className="mb-4 flex items-center gap-3 font-heading text-xl font-black uppercase">
      <span className="flex size-9 items-center justify-center rounded-lg bg-[#ff7a1a]/12 text-[#ff8a1f]">{icon}</span>
      {title}
      {count ? <span className="text-base font-semibold text-white/40">{count}</span> : null}
    </h2>
  );
}

/** One key fact as a tile; with `onEdit` it is a button (the client's change requests). */
export function Fact({ icon, label, value, onEdit, editLabel }: { icon: ReactNode; label: string; value: string; onEdit?: () => void; editLabel?: string }) {
  const body = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ff7a1a]/12 text-[#ff8a1f] transition-transform duration-200 ease-out group-hover:scale-105">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-white/50">{label}</span>
        <span className="block text-base font-semibold break-words">{value}</span>
      </span>
    </>
  );
  const box = "flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left";
  if (!onEdit) return <div className={box}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`${editLabel ?? ""}: ${label} - ${value}`}
      className={cn(box, "group cursor-pointer transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]")}
    >
      {body}
    </button>
  );
}

/** A step's marker: filled and ticked when done (green for the closing Approved step), glowing with a pulse when current, an empty ring ahead. */
export function StepDot({ done, current, approved = false }: { done: boolean; current: boolean; approved?: boolean }) {
  return (
    <span
      className={cn(
        "relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full border",
        approved
          ? "border-transparent bg-[linear-gradient(135deg,#34d399,#059669)] text-white shadow-[0_0_16px_rgba(52,211,153,0.55)]"
          : done
            ? cn("border-transparent text-white", PEARL_DISC)
            : current ? "border-[#ff8a1f] bg-[#ff8a1f]/15 shadow-[0_0_14px_rgba(255,138,31,0.55)]" : "border-white/20 bg-[#141518]"
      )}
    >
      {done ? <IconCheck className="size-3.5" stroke={3} aria-hidden /> : current ? <span className="size-2 animate-pulse rounded-full bg-[#ff8a1f]" aria-hidden /> : null}
    </span>
  );
}

/** A project's timeline, drawn: across the content when there is room (`@3xl`), down it otherwise. */
export function TimelineView({ steps }: { steps: { title: string; date: string | null; note: string | null; done: boolean; current: boolean; approved?: boolean }[]; }) {
  const date = (iso: string) => formatDateDisplay(iso.slice(0, 10));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 @3xl:p-7">
      <ol className="hidden @3xl:flex">
        {steps.map((step, i) => (
          <li key={`${step.title}-${i}`} className="relative min-w-0 flex-1 pr-4">
            {i < steps.length - 1 ? (
              <span aria-hidden className={cn("absolute top-[13px] left-[27px] h-px w-[calc(100%-27px)]", steps[i + 1]?.approved ? "bg-emerald-400/60" : step.done ? "bg-[#ff8a1f]/60" : "bg-white/12")} />
            ) : null}
            <StepDot done={step.done} current={step.current} approved={step.approved} />
            <p className={cn("mt-3 text-base font-semibold", step.approved ? "text-emerald-300" : step.done || step.current ? "text-white" : "text-white/45")}>{step.title}</p>
            {step.date ? <p className="mt-0.5 text-sm text-white/45">{date(step.date)}</p> : null}
            {step.note ? <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/55">{step.note}</p> : null}
          </li>
        ))}
      </ol>
      <ol className="@3xl:hidden">
        {steps.map((step, i) => (
          <li key={`${step.title}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 ? <span aria-hidden className={cn("absolute top-7 bottom-0 left-[13px] w-px", steps[i + 1]?.approved ? "bg-emerald-400/60" : step.done ? "bg-[#ff8a1f]/60" : "bg-white/12")} /> : null}
            <StepDot done={step.done} current={step.current} approved={step.approved} />
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-lg font-semibold", step.approved ? "text-emerald-300" : step.done || step.current ? "text-white" : "text-white/45")}>{step.title}</p>
              {step.date ? <p className="mt-0.5 text-sm text-white/45">{date(step.date)}</p> : null}
              {step.note ? <p className="mt-1.5 text-[15px] leading-relaxed text-white/60">{step.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
