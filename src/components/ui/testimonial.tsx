import { cn } from "@/lib/utils";

export type TestimonialProps = {
  name: string;
  role?: string;
  text: string;
  /** 1-5 */
  rating?: number;
  /** Letters shown on the avatar circle (defaults to the name's initials). */
  initials?: string;
  /** Avatar circle background color (hex). Falls back to the brand gradient. */
  color?: string;
  /** Denser type and padding - for stacks where several cards share the viewport (the home conveyor). */
  compact?: boolean;
  className?: string;
};

function computeInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
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
  compact = false,
  className,
}: TestimonialProps) {
  return (
    <div
      className={cn(
        "relative flex w-80 max-w-full flex-col items-center rounded-2xl border border-card-border bg-card/80 text-center shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg",
        compact ? "px-5 pb-3.5 pt-8" : "px-6 pb-6 pt-11",
        className
      )}
    >
      <div
        className={cn(
          "absolute flex items-center justify-center rounded-full font-bold text-white shadow-lg ring-4 ring-background",
          compact ? "-top-7 h-14 w-14 text-base" : "-top-8 h-16 w-16 text-lg",
          !color &&
            "bg-gradient-to-br from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)]"
        )}
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden
      >
        {initials ?? computeInitials(name)}
      </div>

      <h3 className={cn("font-heading font-semibold text-foreground", compact ? "text-base" : "text-lg")}>{name}</h3>
      {role ? <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>{role}</p> : null}

      <div className={cn("flex gap-0.5", compact ? "mt-1.5" : "mt-2")} aria-label={`${rating} / 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} filled={i < rating} />
        ))}
      </div>

      <p className={cn("text-muted-foreground", compact ? "mt-1.5 text-[13px] leading-[1.45]" : "mt-2 text-sm leading-relaxed")}>
        {text}
      </p>
    </div>
  );
}
