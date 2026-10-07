import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** The avatar's shape - every outline is rounded (a round-joined stroke in the avatar's edge tint). */
export type AvatarShape = "circle" | "octagon" | "square" | "hexagon" | "diamond" | "pentagon";
/** A varied run of shapes for a list of cards (`AVATAR_SHAPES[index % length]`) - some repeat, on purpose. */
export const AVATAR_SHAPES: AvatarShape[] = ["circle", "octagon", "square", "hexagon", "diamond", "circle", "pentagon", "octagon"];

export type TestimonialProps = {
<<<<<<< Updated upstream
=======
  /** The client's mark (a white-ink PNG for the dark ground): shown at the end of the reviewer row. */
  logo?: string;
>>>>>>> Stashed changes
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

/** The card grounds and brand violet, for mixing the avatar tints. */
const CARD_LIGHT = "#ffffff";
const CARD_DARK = "#121317";
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

/** The shape: a tint of the review's colour (`--avatar-fill`) edged in a deeper tint. */
function AvatarShapeSvg({ shape }: { shape: AvatarShape }) {
  const path = shape === "circle" ? undefined : SHAPE_PATHS[shape];
  return (
    <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      {path ? (
        <path d={path} fill="var(--avatar-fill)" stroke="var(--avatar-edge)" strokeWidth={4} strokeLinejoin="round" />
      ) : (
        <circle cx={32} cy={32} r={27} fill="var(--avatar-fill)" stroke="var(--avatar-edge)" strokeWidth={1.5} />
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
    <svg width={size} height={size} viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M10.525.464a.5.5 0 0 1 .95 0l2.107 6.482a.5.5 0 0 0 .475.346h6.817a.5.5 0 0 1 .294.904l-5.515 4.007a.5.5 0 0 0-.181.559l2.106 6.483a.5.5 0 0 1-.77.559l-5.514-4.007a.5.5 0 0 0-.588 0l-5.514 4.007a.5.5 0 0 1-.77-.56l2.106-6.482a.5.5 0 0 0-.181-.56L.832 8.197a.5.5 0 0 1 .294-.904h6.817a.5.5 0 0 0 .475-.346z"
        className={filled ? "fill-primary" : "fill-muted-foreground/25"}
      />
    </svg>
  );
}

/**
 * The reviews' quote mark: a big, soft serif opening quote in the faint primary, set absolutely - the caller places and
 * sizes it (`right-5 -top-2 text-[7rem]`). The review cards and the MindGuard spotlight above them share it.
 */
export function QuoteMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute font-serif leading-none text-primary/15 select-none", className)}>
      &ldquo;
    </span>
  );
}

/**
 * A review card: a glass panel inside a 1px gradient edge (orange fading through white at the corners), the rating in
 * orange stars and a large soft quote mark up top, the review filling the middle (so cards in a row line up), and along
 * the bottom under a hairline who wrote it - the client's mark alone when there is one (its name is the alt text), else
 * the avatar, name and role. It lifts a little on hover with an orange glow. Stretch it (`h-full` comes with it) and
 * the cards in a row match in height.
 */
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
    <figure
      className={cn(
<<<<<<< Updated upstream
        "relative flex w-80 max-w-full flex-col items-center rounded-2xl border border-card-border bg-card/80 text-center shadow-[0_16px_40px_-14px_rgba(15,23,42,0.28)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_22px_50px_-14px_rgba(15,23,42,0.36)] dark:shadow-[0_18px_44px_-14px_rgba(0,0,0,0.7)] dark:hover:shadow-[0_24px_56px_-14px_rgba(0,0,0,0.8)]",
        compact ? "px-5 pb-3.5 pt-8" : "px-6 pb-6 pt-11",
=======
        "group/review relative flex h-full w-80 max-w-full flex-col rounded-3xl p-px text-left",
        // The 1px gradient edge is the wrapper's own background, the card sits inside it.
        "bg-[linear-gradient(150deg,rgba(255,138,31,0.55)_0%,rgba(255,255,255,0.10)_28%,rgba(255,255,255,0.04)_62%,rgba(255,138,31,0.28)_100%)]",
        "shadow-[0_18px_44px_-18px_rgba(15,23,42,0.35)] dark:shadow-[0_22px_50px_-20px_rgba(0,0,0,0.85)]",
        "transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_26px_60px_-22px_rgba(255,106,20,0.55)] dark:hover:shadow-[0_26px_60px_-22px_rgba(255,106,20,0.5)]",
>>>>>>> Stashed changes
        className
      )}
    >
      <div
        className={cn(
<<<<<<< Updated upstream
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
=======
          "relative flex flex-1 flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-white/90 backdrop-blur-md dark:bg-[linear-gradient(160deg,rgba(26,27,32,0.92)_0%,rgba(12,13,16,0.94)_100%)]",
          compact ? "p-5 md:p-6" : "p-6 sm:p-7"
        )}
      >
        {/* A faint orange light in the top corner, brighter on hover. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[radial-gradient(circle,rgba(255,106,20,0.18)_0%,transparent_70%)] opacity-60 transition-opacity duration-300 ease-out group-hover/review:opacity-100"
        />
        <QuoteMark className={compact ? "right-5 -top-1 text-[5.5rem]" : "right-5 -top-2 text-[7rem]"} />

        <div className="relative flex gap-1" aria-label={`${rating} / 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} filled={i < rating} size={compact ? 17 : 19} />
          ))}
        </div>
>>>>>>> Stashed changes

        <blockquote
          className={cn(
            "relative flex-1 text-foreground/85 dark:text-white/80",
            compact ? "mt-3.5 text-[15px] leading-[1.6] md:text-sm md:leading-[1.6]" : "mt-4 text-base leading-relaxed"
          )}
        >
          {text}
        </blockquote>

        <figcaption
          className={cn(
            "relative flex items-center gap-3 border-t border-foreground/10 dark:border-white/10",
            compact ? "mt-4 pt-4" : "mt-6 pt-5"
          )}
        >
          {logo ? (
            // The client's mark says who it is - no avatar, name or role beside it (the name is its alt text).
            <Image
              src={logo}
              alt={name}
              width={240}
              height={96}
              unoptimized
              className={cn(
                "w-auto shrink-0 object-contain opacity-85 transition-opacity duration-300 group-hover/review:opacity-100",
                compact ? "h-8 max-w-[8rem]" : "h-9 max-w-[9rem]"
              )}
            />
          ) : (
            <>
              <div
                className={cn(
                  "relative flex shrink-0 items-center justify-center font-bold",
                  "[--avatar-fill:var(--avatar-fill-light)] [--avatar-edge:var(--avatar-edge-light)] text-[var(--avatar-ink-light)]",
                  "dark:[--avatar-fill:var(--avatar-fill-dark)] dark:[--avatar-edge:var(--avatar-edge-dark)] dark:text-[var(--avatar-ink-dark)]",
                  compact ? "size-10 text-sm" : "size-11 text-sm"
                )}
                style={avatarTints(color ?? BRAND_VIOLET)}
                aria-hidden
              >
                <AvatarShapeSvg shape={shape ?? shapeFor(name)} />
                <span className="relative">{initials ?? computeInitials(name)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-heading font-semibold text-foreground", compact ? "text-base" : "text-[17px]")}>{name}</p>
                {role ? <p className="truncate text-[13px] text-muted-foreground">{role}</p> : null}
              </div>
            </>
          )}
        </figcaption>
      </div>
    </figure>
  );
}
