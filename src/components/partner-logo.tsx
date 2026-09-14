"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { PARTNER_ICON_BASE, type Partner } from "@/lib/partners";

export function PartnerLogo({
  p,
  imgClass,
  sizes,
}: {
  p: Partner;
  imgClass: string;
  sizes: string;
}) {
  if (p.light && p.dark) {
    /* Grid stack: both images stay in layout so the strip keeps width in dark mode (absolute+hidden collapsed before). */
    return (
      <span className="inline-grid place-items-center [grid-template-columns:1fr] [grid-template-rows:1fr]">
        <Image
          src={`${PARTNER_ICON_BASE}${p.light}`}
          alt={p.ariaLabel}
          width={400}
          height={140}
          sizes={sizes}
          className={cn(
            imgClass,
            "col-start-1 row-start-1 opacity-100 dark:pointer-events-none dark:opacity-0"
          )}
        />
        <Image
          src={`${PARTNER_ICON_BASE}${p.dark}`}
          alt=""
          width={400}
          height={140}
          sizes={sizes}
          className={cn(
            imgClass,
            "col-start-1 row-start-1 opacity-0 pointer-events-none dark:pointer-events-auto dark:opacity-100"
          )}
          aria-hidden
        />
      </span>
    );
  }

  const single = p.light ?? p.dark;
  if (!single) return null;

  return (
    <Image
      src={`${PARTNER_ICON_BASE}${single}`}
      alt={p.ariaLabel}
      width={400}
      height={140}
      sizes={sizes}
      className={cn(imgClass, p.invertOnLight && "invert dark:invert-0")}
    />
  );
}
