"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const WAVES = (
  <>
    <span className="water-btn__wave water-btn__wave--b" aria-hidden />
    <span className="water-btn__wave water-btn__wave--a" aria-hidden />
  </>
);

/**
 * An outlined orange pill that fills with water on hover / focus and glows while it is held (the look is `.water-btn` in
 * `globals.css`). A link when it has an `href`, a button when it has an `onClick`.
 */
export function WaterButton({
  href,
  onClick,
  className,
  children,
}: {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn("water-btn font-heading text-[13px] font-black tracking-[0.06em] uppercase", className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {WAVES}
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {WAVES}
      {children}
    </button>
  );
}
