import { cn } from "@/lib/utils";

/**
 * Dark theme decorative layer for {@link GradientBlurPageBg}.
 * Paint is defined in `globals.css` (`.page-dark-grid-layer` + `--page-dark-*` / `--background`).
 */
export function DarkMagentaOrbGridBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn("page-dark-grid-layer pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    />
  );
}
