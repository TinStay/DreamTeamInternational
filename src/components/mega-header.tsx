"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { brandLogo } from "@/lib/brand-logo";

const EASE = [0.22, 1, 0.36, 1] as const;

export type MegaNavGroup = {
  label: string;
  href: string;
  items: { label: string; href: string }[];
};

/** A link's ink: the brand's red → violet gradient under the letters, showing as the colour fades out on hover. The
 * resting colour must be opaque, or the gradient shows through it. */
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
 * The English site's desktop header (the client's "FMI" reference): a glass bar across the whole width of the screen,
 * sliding away as the page scrolls down and back as soon as it scrolls up; hovering
 * (or tabbing into) the nav opens the whole bar into one panel with **every** section's links listed in a column under
 * its title - no per-item dropdowns - and it folds back up as the pointer leaves. The logo and the right-hand controls
 * stay on the top row. `/bg` keeps `SiteHeader`'s own desktop header.
 */
export function MegaHeader({
  logoHref,
  groups,
  controls,
}: {
  logoHref: string;
  groups: MegaNavGroup[];
  /** The right-hand controls (theme toggle, copy buttons, quote pill). */
  controls: ReactNode;
}) {
  const logo = brandLogo("en");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Slides away while the page scrolls down and comes back the moment it scrolls up (always shown near the top).
  // State only when the flag flips, like the scrolled flag in `SiteHeader`.
  useEffect(() => {
    let lastY = window.scrollY;
    let isHidden = false;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < 6) return; // ignore jitter (and Lenis's sub-pixel steps)
      lastY = y;
      const next = y > 120 && delta > 0;
      if (next === isHidden) return;
      isHidden = next;
      setHidden(next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        "fixed inset-x-0 top-0 z-50 hidden w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      )}
      // Hidden off screen: out of the tab order and the accessibility tree until it comes back.
      inert={hidden && !open}
      onMouseLeave={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {/* The whole width of the screen, edge to edge, in smoked glass (`.smoke-bar`, globals.css). */}
      <div
        className={cn(
          "smoke-bar overflow-hidden px-[clamp(1.5rem,3vw,3.5rem)] text-white",
          open && "is-open"
        )}
      >
        <div className="flex w-full items-start justify-between gap-6">
          {/* The IzI Video logo in white on the smoked bar (the file is dark ink, so always inverted). */}
          <Link href={logoHref} className="group flex h-[4.25rem] min-w-0 shrink-0 items-center pr-3">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              sizes="160px"
              priority
              className="h-7 w-auto invert xl:h-8"
            />
          </Link>

          {/* Each column: the section's title on the bar's row and, while open, its links right under it. */}
          {/* Left-aligned beside the logo, in equal columns (`--col`; a section without links only as wide as its title),
              so the titles sit evenly whatever their lists hold; a long link wraps inside its column. */}
          <nav
            className="grid min-w-0 flex-1 items-start justify-start gap-x-3 ps-4 text-base font-semibold text-[#ececee] [--col:6.25rem] xl:gap-x-4 xl:ps-6 xl:text-[1.0625rem] xl:[--col:7.25rem] 2xl:gap-x-5 2xl:ps-8 2xl:text-lg 2xl:[--col:8.5rem]"
            style={{ gridTemplateColumns: groups.map((g) => (g.items.length ? "minmax(0,var(--col))" : "auto")).join(" ") }}
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
                      className="flex flex-col gap-2.5 pb-7 text-sm font-medium text-[#a7abb2] xl:text-[0.9375rem]"
                    >
                      {group.items.map((item, i) => (
                        <motion.li
                          key={item.href}
                          initial={false}
                          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.25, delay: open ? 0.05 + i * 0.025 : 0, ease: EASE }}
                        >
                          <MegaLink href={item.href} className="whitespace-normal leading-snug hover:text-white">
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
