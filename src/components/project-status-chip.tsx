import type { ProjectStatus } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

/** A project's stage as a small chip: orange while it is being made, green once delivered. */
export function StatusChip({ status, label }: { status: ProjectStatus; label: string }) {
  const done = status === "delivered";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm",
        done ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-[#ff8a1f]/45 bg-black/55 text-[#ffb066]"
      )}
    >
      <span className={cn("size-1.5 rounded-full", done ? "bg-emerald-400" : "bg-[#ff8a1f] shadow-[0_0_8px_#ff8a1f]")} aria-hidden />
      {label}
    </span>
  );
}
