import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The Keplerbay planet as a loader: the logo's orange planet - banded, shaded, glowing - with a white orbit tilted round
 * it and a streak of light running along the orbit, behind the planet and then in front of it (the orbit is drawn in two
 * halves: the far half under the planet, the near half over it). The planet's bands drift slowly, so it reads as turning.
 * Pure SVG + two CSS keyframes (`planet-bands`, `orbit-run` in globals.css); still under reduced motion. Sized by its
 * width (`className`, e.g. `w-40`); `label` is read out (it is a status, "the film is being made").
 */
export function PlanetLoader({ className, label }: { className?: string; label?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ring = 2 * Math.PI * 80; // the orbit's length (radius 80, before the tilt flattens it)
  const orbit = "translate(100 70) rotate(-18) scale(1 0.3)";

  // One pass of the orbit: a faint full ring, a soft glow streak and its bright head.
  const pass = (
    <>
      <circle r="80" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <circle
        r="80"
        fill="none"
        stroke="#ffd2a1"
        strokeOpacity="0.35"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`110 ${ring - 110}`}
        vectorEffect="non-scaling-stroke"
        className="motion-safe:animate-[orbit-run_2.8s_linear_infinite]"
      />
      <circle
        r="80"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`70 ${ring - 70}`}
        strokeDashoffset="-20"
        vectorEffect="non-scaling-stroke"
        className="motion-safe:animate-[orbit-run-head_2.8s_linear_infinite]"
      />
    </>
  );

  return (
    <svg viewBox="0 0 200 140" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("h-auto overflow-visible", className)}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff7a1a" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ff6a14" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ff6a14" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-body`} cx="36%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffd3a3" />
          <stop offset="32%" stopColor="#ffa155" />
          <stop offset="68%" stopColor="#f26a1b" />
          <stop offset="100%" stopColor="#a8380b" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="34%" cy="28%" r="78%">
          <stop offset="55%" stopColor="#2a0a00" stopOpacity="0" />
          <stop offset="100%" stopColor="#2a0a00" stopOpacity="0.55" />
        </radialGradient>
        <clipPath id={`${id}-planet`}>
          <circle cx="100" cy="70" r="34" />
        </clipPath>
        {/* The near half of the orbit: the lower half of the circle, before the tilt. */}
        <clipPath id={`${id}-near`} clipPathUnits="userSpaceOnUse">
          <rect x="-120" y="0" width="240" height="120" />
        </clipPath>
      </defs>

      {/* The glow, then the far half of the orbit, behind the planet. */}
      <circle cx="100" cy="70" r="62" fill={`url(#${id}-glow)`} className="motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
      <g transform={orbit}>{pass}</g>

      {/* The planet: its body, the drifting bands, the shading toward its edge. */}
      <circle cx="100" cy="70" r="34" fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-planet)`}>
        <g className="motion-safe:animate-[planet-bands_9s_linear_infinite]">
          {[46, 56, 66, 76, 86, 96].map((y, i) => (
            <path
              key={y}
              d={`M 30 ${y} q 10 -6 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0`}
              fill="none"
              stroke={i % 2 ? "#c2410c" : "#ffd2a1"}
              strokeOpacity={i % 2 ? 0.55 : 0.35}
              strokeWidth={i % 2 ? 4.5 : 2.5}
              strokeLinecap="round"
            />
          ))}
        </g>
        <circle cx="100" cy="70" r="34" fill={`url(#${id}-shade)`} />
      </g>

      {/* The near half of the orbit, over the planet. */}
      <g transform={orbit}>
        <g clipPath={`url(#${id}-near)`}>{pass}</g>
      </g>
    </svg>
  );
}
