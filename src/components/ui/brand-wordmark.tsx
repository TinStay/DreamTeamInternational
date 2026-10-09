import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The Keplerbay wordmark, set as text in the heading face until a logo file exists. It takes the surrounding ink
 * (`currentColor`), so a caller sizes and colours it with plain text utilities.
 */
export function BrandWordmark({ className }: { className?: string }) {
  return <span className={cn("font-heading leading-none font-bold tracking-tight whitespace-nowrap", className)}>{BRAND_NAME}</span>;
}
