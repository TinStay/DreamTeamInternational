"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { SkyToggle } from "@/components/ui/sky-toggle";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn("inline-block h-6 w-[52px] shrink-0 rounded-full bg-border/30", className)}
        aria-hidden
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <SkyToggle
      className={className}
      checked={isDark}
      onCheckedChange={(next) => setTheme(next ? "dark" : "light")}
      aria-label="Toggle color theme"
    />
  );
}
