import Image from "next/image";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** The logo file: the ringed orange planet, then KEPLER in white and BAY in the orange gradient, on transparency. */
export const BRAND_LOGO = { src: "/keplerbay-logo-v2.png", width: 990, height: 192 } as const;

/**
 * The Keplerbay logo (`public/keplerbay-logo-v2.png` - made from the brand file: its near-black ground lifted to
 * transparency so the planet's glow fades into whatever is behind it, cropped to the artwork, 192px tall). Its letters are
 * white, so it belongs on the site's dark surfaces - the English site is dark-only. A caller sizes it by height
 * (`h-*`); the width follows the file's 5.16 : 1. `priority` for the header, where it is above the fold.
 */
export function BrandWordmark({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={BRAND_LOGO.src}
      alt={BRAND_NAME}
      width={BRAND_LOGO.width}
      height={BRAND_LOGO.height}
      sizes="240px"
      priority={priority}
      className={cn("w-auto select-none", className)}
    />
  );
}
