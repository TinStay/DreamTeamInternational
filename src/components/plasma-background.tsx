"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function PlasmaBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Render only after mount so server and first client render agree (null),
  // avoiding a hydration mismatch from theme/window-dependent output.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background transition-colors duration-500">
      {/* Subtle Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] z-10" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>

      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ 
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` 
        }}
      >
        {isDark ? (
        <>
            <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-700/40 blur-[140px] mix-blend-screen animate-float" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[65%] h-[65%] rounded-full bg-violet-800/35 blur-[160px] mix-blend-screen animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[35%] left-[55%] w-[40%] h-[40%] rounded-full bg-fuchsia-700/25 blur-[120px] mix-blend-screen animate-float" style={{ animationDelay: '4s' }} />
            <div className="absolute top-[5%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-600/20 blur-[100px] mix-blend-screen animate-float" style={{ animationDelay: '1s' }} />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/30 blur-[120px] mix-blend-multiply animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/40 blur-[150px] mix-blend-multiply animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-teal-100/40 blur-[100px] mix-blend-multiply animate-float" style={{ animationDelay: '4s' }} />
          </>
        )}
      </div>
    </div>
  );
}
