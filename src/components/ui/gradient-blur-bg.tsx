import { cn } from "@/lib/utils";

import { LightAuroraPageBackground } from "@/components/ui/background-gradient-glow";
import { DarkMagentaOrbGridBackground } from "@/components/ui/grid-background";

export type GradientBlurPageBgProps = {
  className?: string;
};

/**
 * Site-wide fixed background: light = aurora wash; dark = `.page-dark-grid-layer` in `globals.css`.
 */
export function GradientBlurPageBg({ className }: GradientBlurPageBgProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)} aria-hidden>
      <LightAuroraPageBackground className="dark:hidden" />
      <DarkMagentaOrbGridBackground className="hidden dark:block" />
    </div>
  );
}
