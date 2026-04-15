"use client";

import React from 'react';

export const Star = ({ className = "" }: { className?: string }) => (
  <div className={`iridescent-shape shape-star ${className}`} />
);

export const Diamond = ({ className = "" }: { className?: string }) => (
  <div className={`iridescent-shape shape-diamond ${className}`} />
);

export const Sphere = ({ className = "" }: { className?: string }) => (
  <div className={`iridescent-shape shape-sphere ${className}`} />
);

// Deterministic pseudo-random to avoid SSR/client hydration mismatch
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export const FloatingOrbs = ({ count = 5 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: count }).map((_, i) => {
        const size = seededRandom(i * 5 + 0) * 26 + 4;
        const left = seededRandom(i * 5 + 1) * 100;
        const top = seededRandom(i * 5 + 2) * 100;
        const delay = seededRandom(i * 5 + 3) * 5;
        const duration = seededRandom(i * 5 + 4) * 4 + 4;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-accent blur-[2px] opacity-40 animate-float"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Full-page ambient layer: pulsing geometric shapes + radiating lines.
 * Rendered once in layout.tsx behind everything.
 */
export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* ── SVG Lines radiating from corners & sides ── */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.10]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* top-left fan */}
        <line x1="0" y1="0"    x2="60vw" y2="100vh" stroke="url(#lg1)" strokeWidth="1" />
        <line x1="0" y1="0"    x2="100vw" y2="55vh"  stroke="url(#lg1)" strokeWidth="0.8" />
        <line x1="0" y1="0"    x2="35vw" y2="100vh"  stroke="url(#lg1)" strokeWidth="0.5" />
        {/* top-right fan */}
        <line x1="100vw" y1="0" x2="0"      y2="70vh"  stroke="url(#lg2)" strokeWidth="1" />
        <line x1="100vw" y1="0" x2="20vw"   y2="100vh" stroke="url(#lg2)" strokeWidth="0.7" />
        {/* bottom-left */}
        <line x1="0" y1="100vh" x2="80vw" y2="0"       stroke="url(#lg3)" strokeWidth="0.8" />
        {/* bottom-right */}
        <line x1="100vw" y1="100vh" x2="10vw" y2="20vh" stroke="url(#lg3)" strokeWidth="0.6" />
        {/* horizontals across middle */}
        <line x1="0" y1="40vh" x2="100vw" y2="60vh" stroke="url(#lg4)" strokeWidth="0.5" />
        <line x1="0" y1="70vh" x2="100vw" y2="30vh" stroke="url(#lg4)" strokeWidth="0.4" />

        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#c084fc" stopOpacity="1" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#e879f9" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0" />
            <stop offset="50%"  stopColor="#c084fc" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Floating geometric shapes ── */}

      {/* Large ring top-right */}
      <div
        className="absolute border border-purple-500/20 rounded-full animate-float"
        style={{ width: 480, height: 480, top: "-80px", right: "-80px", animationDuration: "14s" }}
      />
      <div
        className="absolute border border-fuchsia-500/10 rounded-full animate-float"
        style={{ width: 320, height: 320, top: "-20px", right: "-20px", animationDuration: "18s", animationDelay: "2s" }}
      />

      {/* Diamond grid bottom-left */}
      <div
        className="absolute border border-violet-500/15 rotate-45 animate-float"
        style={{ width: 200, height: 200, bottom: 80, left: -40, animationDuration: "12s", animationDelay: "1s" }}
      />
      <div
        className="absolute border border-purple-400/10 rotate-45 animate-float"
        style={{ width: 120, height: 120, bottom: 140, left: 40, animationDuration: "9s", animationDelay: "3s" }}
      />

      {/* Cross shape center-left */}
      <div
        className="absolute opacity-10 animate-float"
        style={{ left: "8%", top: "42%", animationDuration: "16s", animationDelay: "5s" }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <line x1="30" y1="0" x2="30" y2="60" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="0" y1="30" x2="60" y2="30" stroke="#c084fc" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Hexagon center-right */}
      <div
        className="absolute opacity-[0.08] animate-float"
        style={{ right: "10%", top: "55%", animationDuration: "20s", animationDelay: "4s" }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" stroke="#a78bfa" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Small scattered dots */}
      {[
        { x: "15%", y: "20%", r: 3, d: "6s", dl: "0s" },
        { x: "82%", y: "15%", r: 4, d: "8s", dl: "2s" },
        { x: "70%", y: "80%", r: 3, d: "7s", dl: "1s" },
        { x: "25%", y: "75%", r: 5, d: "10s", dl: "3s" },
        { x: "50%", y: "10%", r: 3, d: "9s",  dl: "4s" },
        { x: "90%", y: "50%", r: 4, d: "11s", dl: "1.5s" },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/30 animate-float"
          style={{
            left: dot.x, top: dot.y,
            width: dot.r * 2, height: dot.r * 2,
            animationDuration: dot.d,
            animationDelay: dot.dl,
          }}
        />
      ))}

      {/* Triangle bottom-right */}
      <div
        className="absolute opacity-[0.07] animate-float"
        style={{ right: "5%", bottom: "15%", animationDuration: "13s", animationDelay: "6s" }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <polygon points="40,5 75,70 5,70" stroke="#e879f9" strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}
