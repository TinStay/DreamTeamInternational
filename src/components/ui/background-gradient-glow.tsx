import { cn } from "@/lib/utils";

/** Light theme: aurora corner radials + soft lavender–pink base wash.
 *  Bottom corners carry the brand gradient — red on the left, purple on the right. */
export function LightAuroraPageBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 85% 65% at 8% 8%, rgba(175, 109, 255, 0.42), transparent 60%),
            radial-gradient(ellipse 75% 60% at 75% 35%, rgba(255, 235, 170, 0.55), transparent 62%),
            radial-gradient(ellipse 72% 62% at 10% 88%, rgba(219, 78, 78, 0.50), transparent 64%),
            radial-gradient(ellipse 72% 62% at 92% 92%, rgba(122, 71, 176, 0.48), transparent 64%),
            linear-gradient(180deg, #f7eaff 0%, #fbe6ef 100%)
          `,
        }}
      />
    </div>
  );
}
