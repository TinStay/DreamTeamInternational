import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** The avatar's shape - every outline is rounded (a round-joined stroke in the avatar's edge tint). */
export type AvatarShape = "circle" | "octagon" | "square" | "hexagon" | "diamond" | "pentagon";
/** A varied run of shapes for a list of cards (`AVATAR_SHAPES[index % length]`) - some repeat, on purpose. */
export const AVATAR_SHAPES: AvatarShape[] = ["circle", "octagon", "square", "hexagon", "diamond", "circle", "pentagon", "octagon"];

export type TestimonialProps = {
  name: string;
  role?: string;
  text: string;
  /** 1-5 */
  rating?: number;
  /** Letters shown on the avatar (defaults to the name's initials). */
  initials?: string;
  /** The avatar's colour (hex) - its tint fills the shape, the colour itself inks the letters. Falls back to the brand violet. */
  color?: string;
  /** The avatar's shape; defaults to one picked from the name. */
  shape?: AvatarShape;
  /** Denser type and padding - for stacks where several cards share the viewport (the home conveyor). */
  compact?: boolean;
  className?: string;
};

/** Outlines in a 64 × 64 box (a 4px round-joined stroke rounds the corners; a wider one behind it is the halo). */
const SHAPE_PATHS: Record<Exclude<AvatarShape, "circle">, string> = {
  square: "M8 8 H56 V56 H8 Z",
  diamond: "M32 6 L58 32 L32 58 L6 32 Z",
  hexagon: "M32 6 L54.5 19 L54.5 45 L32 58 L9.5 45 L9.5 19 Z",
  pentagon: "M32 6 L56.7 24 L47.3 53 L16.7 53 L7.3 24 Z",
  octagon: "M42.3 7.1 L56.9 21.7 L56.9 42.3 L42.3 56.9 L21.7 56.9 L7.1 42.3 L7.1 21.7 L21.7 7.1 Z",
};

/** The site's card grounds (globals.css) and brand violet, for mixing the avatar tints. */
const CARD_LIGHT = "#ffffff";
const CARD_DARK = "#0c111e";
const BRAND_VIOLET = "#6b3f9a";

/** `amount` of `hex` over `base` (both hex) - a tint. */
function mix(hex: string, base: string, amount: number) {
  const c = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const a = hex.replace("#", "").padEnd(6, "0");
  const b = base.replace("#", "").padEnd(6, "0");
  const ch = (i: number) => Math.round(c(a, i) * amount + c(b, i) * (1 - amount));
  return `rgb(${ch(0)}, ${ch(2)}, ${ch(4)})`;
}

/**
 * The avatar's tints as CSS variables: a light tint of its colour with the letters in the colour itself (formal),
 * and, for the dark theme, a deeper tint over the dark card with a paler ink - the wrapper's `dark:` classes
 * pick the pair. (Mixed here, not with `color-mix()` in CSS: Tailwind rewrites that into a nested @supports.)
 */
function avatarTints(color: string): CSSProperties {
  return {
    "--avatar-fill-light": mix(color, CARD_LIGHT, 0.13),
    "--avatar-edge-light": mix(color, CARD_LIGHT, 0.2),
    "--avatar-ink-light": mix(color, "#000000", 0.88),
    "--avatar-fill-dark": mix(color, CARD_DARK, 0.26),
    "--avatar-edge-dark": mix(color, CARD_DARK, 0.36),
    "--avatar-ink-dark": mix(color, CARD_LIGHT, 0.55),
  } as CSSProperties;
}

/** A stable pick from the name, so a card keeps its shape wherever it appears. */
function shapeFor(name: string): AvatarShape {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_SHAPES[hash % AVATAR_SHAPES.length];
}

/** The shape: a tint of the review's colour (`--avatar-fill`) edged in a deeper tint, over a page-colour halo. */
function AvatarShapeSvg({ shape }: { shape: AvatarShape }) {
  const path = shape === "circle" ? undefined : SHAPE_PATHS[shape];
  return (
    <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      {path ? (
        <>
          <path d={path} fill="none" stroke="var(--background)" strokeWidth={10} strokeLinejoin="round" />
          <path d={path} fill="var(--avatar-fill)" stroke="var(--avatar-edge)" strokeWidth={4} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx={32} cy={32} r={27} fill="none" stroke="var(--background)" strokeWidth={6} />
          <circle cx={32} cy={32} r={26.5} fill="var(--avatar-fill)" stroke="var(--avatar-edge)" strokeWidth={1.5} />
        </>
      )}
    </svg>
  );
}

function computeInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10.525.464a.5.5 0 0 1 .95 0l2.107 6.482a.5.5 0 0 0 .475.346h6.817a.5.5 0 0 1 .294.904l-5.515 4.007a.5.5 0 0 0-.181.559l2.106 6.483a.5.5 0 0 1-.77.559l-5.514-4.007a.5.5 0 0 0-.588 0l-5.514 4.007a.5.5 0 0 1-.77-.56l2.106-6.482a.5.5 0 0 0-.181-.56L.832 8.197a.5.5 0 0 1 .294-.904h6.817a.5.5 0 0 0 .475-.346z"
        className={filled ? "fill-amber-400" : "fill-muted-foreground/25"}
      />
    </svg>
  );
}

export function Testimonial({
  name,
  role,
  text,
  rating = 5,
  initials,
  color,
  shape,
  compact = false,
  className,
}: TestimonialProps) {
  return (
    <div
      className={cn(
        "relative flex w-80 max-w-full flex-col items-center rounded-2xl border border-card-border bg-card/80 text-center shadow-[0_16px_40px_-14px_rgba(15,23,42,0.28)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_22px_50px_-14px_rgba(15,23,42,0.36)] dark:shadow-[0_18px_44px_-14px_rgba(0,0,0,0.7)] dark:hover:shadow-[0_24px_56px_-14px_rgba(0,0,0,0.8)]",
        compact ? "px-5 pb-3.5 pt-8" : "px-6 pb-6 pt-11",
        className
      )}
    >
      <div
        className={cn(
          "absolute flex items-center justify-center font-bold",
          "[--avatar-fill:var(--avatar-fill-light)] [--avatar-edge:var(--avatar-edge-light)] text-[var(--avatar-ink-light)]",
          "dark:[--avatar-fill:var(--avatar-fill-dark)] dark:[--avatar-edge:var(--avatar-edge-dark)] dark:text-[var(--avatar-ink-dark)]",
          compact ? "-top-7 h-14 w-14 text-base" : "-top-8 h-16 w-16 text-lg"
        )}
        style={avatarTints(color ?? BRAND_VIOLET)}
        aria-hidden
      >
        <AvatarShapeSvg shape={shape ?? shapeFor(name)} />
        <span className="relative">{initials ?? computeInitials(name)}</span>
      </div>

      <h3 className={cn("font-heading font-semibold text-foreground", compact ? "text-lg" : "text-xl")}>{name}</h3>
      {role ? <p className={cn("text-muted-foreground", compact ? "text-sm md:text-xs" : "text-sm")}>{role}</p> : null}

      {/* The stars twice their old size (the client's ask), a touch tighter between them. */}
      <div className={cn("flex gap-0.5", compact ? "mt-2" : "mt-2.5")} aria-label={`${rating} / 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} filled={i < rating} size={compact ? 38 : 44} />
        ))}
      </div>

      {/* The review itself a size up on phones (the compact card runs 13px only from md, where two sit side by side). */}
      <p className={cn("text-muted-foreground", compact ? "mt-2 text-[15px] leading-[1.5] md:text-[13px] md:leading-[1.45]" : "mt-2.5 text-base leading-relaxed")}>
        {text}
      </p>
    </div>
  );
}
