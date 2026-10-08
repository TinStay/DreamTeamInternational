import { IconLoader2, IconPlayerPlayFilled } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";

/**
 * Where a project's film will play, before there is one: the poster (if any) dimmed under a warm light, a faint grid and
 * a film strip's sprocket holes, a glowing play disc in a slowly turning dashed ring, the stage it is in and how far
 * along. Fills its (positioned) parent. `compact` is the project cards' size: a smaller disc, the stage only.
 * CSS animations only, still under reduced motion.
 */
export function FilmInTheMaking({
  poster = null,
  loading = false,
  stage,
  progress,
  label,
  compact = false,
}: {
  poster?: string | null;
  loading?: boolean;
  stage: string;
  progress: number;
  label?: string;
  compact?: boolean;
}) {
  const strip = "absolute inset-x-0 bg-[repeating-linear-gradient(90deg,transparent_0_14px,rgba(255,255,255,0.07)_14px_26px)] [mask-image:linear-gradient(90deg,transparent,black_20%,black_80%,transparent)]";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(70%_80%_at_50%_100%,rgba(255,110,20,0.22),transparent_70%),radial-gradient(60%_60%_at_15%_0%,rgba(255,176,102,0.08),transparent_70%),#0b0c0e]">
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- client / Bunny poster: referrer-gated, never optimised
        <img src={poster} alt="" referrerPolicy="origin" className="absolute inset-0 size-full object-cover opacity-25 blur-[2px]" />
      ) : null}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div aria-hidden className={cn(strip, "top-0", compact ? "h-3" : "h-5")} />
      <div aria-hidden className={cn(strip, "bottom-0", compact ? "h-3" : "h-5")} />

      <div className={cn("relative flex h-full flex-col items-center justify-center text-center", compact ? "gap-3 px-4" : "gap-5 px-8")}>
        <div className={cn("relative flex items-center justify-center", compact ? "size-16" : "size-24 sm:size-28")}>
          <span aria-hidden className="absolute inset-0 rounded-full border border-dashed border-[#ff8a1f]/45 motion-safe:animate-[spin_14s_linear_infinite]" />
          <span aria-hidden className={cn("absolute rounded-full bg-[#ff7a1a]/10 motion-safe:animate-pulse", compact ? "inset-2" : "inset-3")} />
          <span
            className={cn(
              "relative flex items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] shadow-[0_0_40px_rgba(255,122,26,0.55)]",
              compact ? "size-9" : "size-14 sm:size-16"
            )}
          >
            {loading ? (
              <IconLoader2 className={cn("animate-spin text-white", compact ? "size-4" : "size-6")} aria-hidden />
            ) : (
              <IconPlayerPlayFilled className={cn("ml-0.5 text-white", compact ? "size-4" : "size-6")} aria-hidden />
            )}
          </span>
        </div>
        <div>
          {stage && !loading ? <p className={cn("font-heading font-black uppercase tracking-[0.12em] text-[#ffb066]", compact ? "text-[11px]" : "text-sm")}>{stage}</p> : null}
          {label && !compact ? <p className="mt-1.5 max-w-[36ch] text-sm text-white/60">{label}</p> : null}
        </div>
        {!loading && !compact ? (
          <div className="flex w-full max-w-xs items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", PEARL_BAR)} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-white/55">{progress}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
