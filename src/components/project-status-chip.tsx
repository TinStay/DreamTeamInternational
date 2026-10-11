import { IconCircleCheckFilled } from "@tabler/icons-react";
import type { ProjectStatus } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

/**
 * A project's stage as a small chip: orange while it is being made, green once delivered - and a fuller green with a
 * tick once the client has approved the film (`approved`, the label then reads "Approved").
 */
export function StatusChip({ status, label, approved = false }: { status: ProjectStatus; label: string; approved?: boolean }) {
  const done = status === "delivered";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm",
        approved
          ? "border-emerald-300/60 bg-emerald-500/25 text-emerald-100"
          : done
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
            : "border-[#ff8a1f]/45 bg-black/55 text-[#ffb066]"
      )}
    >
      {approved ? (
        <IconCircleCheckFilled className="size-3.5 text-emerald-300" aria-hidden />
      ) : (
        <span className={cn("size-1.5 rounded-full", done ? "bg-emerald-400" : "bg-[#ff8a1f] shadow-[0_0_8px_#ff8a1f]")} aria-hidden />
      )}
      {label}
    </span>
  );
}
