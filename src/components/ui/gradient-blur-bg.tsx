import { cn } from "@/lib/utils";

import { DarkMagentaOrbGridBackground } from "@/components/ui/grid-background";

export type GradientBlurPageBgProps = {
  className?: string;
};

/**
 * Site-wide fixed background. Light = the "Bloom Field" mesh gradient
 * (`.bloom-field-gradient` in `globals.css`); dark = `.page-dark-grid-layer`.
 */
export function GradientBlurPageBg({ className }: GradientBlurPageBgProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)} aria-hidden>
      <div className="bloom-field-gradient absolute inset-0 dark:hidden" />
      <DarkMagentaOrbGridBackground className="hidden dark:block" />
    </div>
  );
}
