"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// React 19 + next-themes (0.4.x) triggers a dev-only warning overlay due to an inline <script>
// next-themes renders to prevent theme flashing. We suppress ONLY that exact warning in dev.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const original = console.error;
  console.error = (...args) => {
    const msg = args
      .map((a) => (typeof a === "string" ? a : a instanceof Error ? a.message : ""))
      .join(" ");

    if (msg.includes("Encountered a script tag while rendering React component")) {
      return;
    }

    original(...args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
