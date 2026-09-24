"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export type MegaNavGroup = {
  label: string;
  href: string;
  items: { label: string; href: string }[];
};

/** A link's ink: the brand's red → violet gradient under the letters, showing as the colour fades out on hover. */
const INK =
  "bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] bg-clip-text transition-colors duration-200 ease-out group-hover/link:text-transparent group-focus-visible/link:text-transparent";

/** A menu link: the label, and a small ↗ that slides in beside it on hover. */
function MegaLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "group/link relative inline-block cursor-pointer whitespace-nowrap outline-none transition-transform duration-200 ease-out hover:translate-x-0.5",
        className
      )}
    >
      <span className={INK}>{children}</span>
      {/* Out of the flow (hanging after the text's end), so the hidden arrow never takes room from the label. */}
      <IconArrowUpRight
        className="absolute bottom-[0.2em] left-full ml-1 size-3.5 -translate-x-1 text-[var(--primary-gradient-end)] opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100"
        aria-hidden
      />
    </Link>
  );
}

/**
 * The English site's desktop header (the client's "FMI" reference): the site's floating glass pill at rest; hovering
 * (or tabbing into) the nav opens the whole bar into one panel with **every** section's links listed in a column under
 * its title - no per-item dropdowns - and it folds back up as the pointer leaves. The logo and the right-hand controls
 * stay on the top row. `/bg` keeps `SiteHeader`'s own desktop header.
 */
export function MegaHeader({
  logoHref,
  groups,
  controls,
  isScrolled,
}: {
  logoHref: string;
  groups: MegaNavGroup[];
  /** The right-hand controls (theme toggle, copy buttons, quote pill). */
  controls: ReactNode;
  isScrolled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // A short delay so a pointer grazing the edge does not snap it shut.
  const hide = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-4 z-50 mx-auto hidden w-[96%] transition-transform duration-300 lg:block",
        isScrolled && !open ? "scale-[0.985]" : "scale-100"
      )}
      onMouseLeave={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div
        className={cn(
          "overflow-hidden ps-7 pe-3.5 transition-[border-radius,background-color,box-shadow] duration-300 ease-out",
          open
            ? "rounded-[2rem] border border-card-border bg-card shadow-[0_34px_80px_-20px_rgba(2,6,23,0.6)]"
            : cn(
                "liquid-glass-header rounded-[2rem]",
                isScrolled
                  ? "shadow-[0_18px_50px_-12px_rgba(2,6,23,0.45)]"
                  : "shadow-[0_12px_36px_-14px_rgba(2,6,23,0.3)]"
              )
        )}
      >
        <div className="flex w-full items-start justify-between gap-6">
          <Link href={logoHref} className="group flex h-[4.25rem] min-w-0 shrink-0 items-center pr-3">
            <Image
              src="/logo-1.png"
              alt="DreamTeam"
              width={1024}
              height={416}
              sizes="130px"
              priority
              className="h-10 w-auto grayscale transition-all group-hover:grayscale-0 dark:invert md:h-11"
            />
          </Link>

          {/* Each column: the section's title on the bar's row and, while open, its links right under it. */}
          {/* Equal columns across the bar (a section without links only as wide as its title), so the titles are
              evenly spread whatever their lists hold; a long link wraps inside its column rather than widening it. */}
          <nav
            className="grid min-w-0 flex-1 items-start gap-x-4 px-2 text-base font-semibold text-foreground/85 xl:gap-x-8 xl:px-6 xl:text-[1.0625rem] 2xl:gap-x-10 2xl:px-10 2xl:text-lg"
            style={{ gridTemplateColumns: groups.map((g) => (g.items.length ? "minmax(0,1fr)" : "auto")).join(" ") }}
            onMouseEnter={show}
            onFocus={show}
          >
            {groups.map((group) => (
              <div key={group.href} className="flex min-w-0 flex-col">
                <div className="flex h-[4.25rem] items-center">
                  <MegaLink href={group.href}>{group.label}</MegaLink>
                </div>
                {group.items.length ? (
                  <motion.div
                    initial={false}
                    animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: open ? 0.32 : 0.2, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <ul
                      aria-label={group.label}
                      className="flex flex-col gap-2.5 pb-7 text-sm font-medium text-foreground/70 xl:text-[0.9375rem]"
                    >
                      {group.items.map((item, i) => (
                        <motion.li
                          key={item.href}
                          initial={false}
                          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.25, delay: open ? 0.05 + i * 0.025 : 0, ease: EASE }}
                        >
                          <MegaLink href={item.href} className="whitespace-normal leading-snug hover:text-foreground">
                            {item.label}
                          </MegaLink>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="flex h-[4.25rem] shrink-0 items-center justify-end gap-3">{controls}</div>
        </div>
      </div>
    </header>
  );
}
