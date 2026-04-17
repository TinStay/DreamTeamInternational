"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-12 h-6 rounded-full bg-border/20 ${className}`} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out shrink-0 cursor-pointer
        ${isDark
          ? "bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500/30"
          : "bg-gradient-to-r from-amber-200 to-yellow-300 border border-amber-400/40"
        }
        ${className}
      `}
      aria-label="Toggle theme"
    >
      {/* Sliding thumb */}
      <span className={`
        absolute top-1 w-4 h-4 rounded-full flex items-center justify-center
        transition-all duration-300 ease-in-out shadow-lg
        ${isDark
          ? "left-1 bg-indigo-900 text-purple-300 translate-x-0"
          : "left-1 bg-white text-amber-500 translate-x-6"
        }
      `}>
        {isDark
          ? <Moon size={10} className="transition-all duration-300 animate-morph" />
          : <Sun size={10} className="transition-all duration-300 animate-morph" />
        }
      </span>
    </button>
  );
}
