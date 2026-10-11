import { PlanetLoader } from "@/components/ui/planet-loader";
import { cn } from "@/lib/utils";

const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";

/**
 * Where a project's film will play, before there is one: the poster (if any) dimmed under a warm light, a faint grid and
 * a film strip's sprocket holes, the **planet loader** (`ui/planet-loader.tsx` - the logo's planet with a light running
 * round its white orbit), the stage it is in and how far along. Fills its (positioned) parent. `compact` is the project
 * cards' size: a smaller planet, the stage only. CSS animations only, still under reduced motion.
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
        <PlanetLoader label={label ?? stage} className={compact ? "w-28" : "w-44 sm:w-52"} />
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
