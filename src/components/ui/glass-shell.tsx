import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Dock / pill glass panel (matches mobile header + bottom nav treatment). */
export const glassShellClassName =
  "border border-border/30 bg-background/90 backdrop-blur-md ring-1 ring-black/10 dark:ring-white/10 shadow-[0_22px_60px_rgba(0,0,0,0.42),0_10px_28px_rgba(0,0,0,0.28)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.65),0_12px_36px_rgba(0,0,0,0.45)] liquid-glass";

export function GlassShell({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[2.25rem]", glassShellClassName, className)} {...props} />;
}
