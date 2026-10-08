"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { brandLogo } from "@/lib/brand-logo";

const EASE = [0.22, 1, 0.36, 1] as const;

export type MegaNavGroup = {
  label: string;
  href: string;
  items: { label: string; href: string }[];
  /**
   * When the bar runs out of room (a smaller laptop, a narrow window) tabs fold into the last tab's drop-down, the
   * higher number first; no number = the tab never folds. What folds is measured, so nothing is ever cut off.
   */
  collapse?: number;
  /** A thin vertical line before this tab, starting a new group. */
  divideBefore?: boolean;
  /** On the last tab: its label while other tabs are folded into it ("More"). */
  foldedLabel?: string;
};

/** A link's ink: it turns the site's orange primary on hover / keyboard focus. */
const INK =
  "transition-colors duration-200 ease-out group-hover/link:text-primary group-focus-visible/link:text-primary";

/** A menu link: the label, its ink turning the orange primary on hover. */
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
    </Link>
  );
}

/**
 * The English site's desktop header (the client's "FMI" reference): a glass bar across the whole width of the screen,
 * sliding away as the page scrolls down and back as soon as it scrolls up; hovering
 * the one tab that holds a list (Custom Services) drops a floating card under itself - the bar does not unfold, the
 * other tabs are plain links - and it folds away as the pointer leaves. The logo and the right-hand controls stay on
 * the top row. `/bg` keeps `SiteHeader`'s own desktop header.
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
  const navRef = useRef<HTMLElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  /** The hrefs of the tabs folded into the last tab's drop-down at the current width. */
  const [folded, setFolded] = useState<string[]>([]);
  const groupsKey = groups.map((g) => `${g.href}|${g.label}|${g.collapse ?? ""}`).join("~");

  // Fit the tabs to the room there is: an invisible copy of the whole row (`ruler`) gives every tab's natural width;
  // while the row is wider than the nav, the tab with the highest `collapse` folds into the last tab's list.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const ruler = rulerRef.current;
    if (!nav || !ruler) return;
    const fit = () => {
      const measured = Array.from(ruler.children, (el) => (el as HTMLElement).offsetWidth);
      const widths = measured.slice(0, groups.length);
      // The last tab is narrower ("More") as soon as anything is folded into it.
      const foldedLast = measured.length > groups.length ? measured[groups.length] : widths[widths.length - 1];
      const gap = parseFloat(getComputedStyle(ruler).columnGap) || 0;
      const room = nav.clientWidth - (parseFloat(getComputedStyle(nav).paddingInlineStart) || 0);
      const shown = widths.map(() => true);
      const total = () => {
        const anyFolded = shown.some((v) => !v);
        return widths.reduce((sum, w, i) => (shown[i] ? sum + (anyFolded && i === widths.length - 1 ? foldedLast : w) + gap : sum), -gap);
      };
      const order = groups
        .map((g, i) => ({ i, c: g.collapse }))
        .filter((x): x is { i: number; c: number } => x.c !== undefined)
        .sort((x, y) => y.c - x.c);
      for (const { i } of order) {
        if (total() <= room) break;
        shown[i] = false;
      }
      const next = groups.filter((_, i) => !shown[i]).map((g) => g.href);
      setFolded((prev) => (prev.length === next.length && prev.every((h, k) => h === next[k]) ? prev : next));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(nav);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
    // `groups` is rebuilt on every render of the parent; its content is what matters (`groupsKey`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsKey]);

  // The tabs on the bar, and the last tab's list with the folded tabs put in front of its own items.
  const bar = useMemo(() => {
    const last = groups[groups.length - 1];
    const foldedGroups = groups.filter((g) => folded.includes(g.href));
    return groups
      .filter((g) => !folded.includes(g.href))
      .map((g) =>
        g === last
          ? {
              ...g,
              label: foldedGroups.length && g.foldedLabel ? g.foldedLabel : g.label,
              items: [
                ...foldedGroups.map((f) => ({ label: f.label, href: f.href })),
                ...g.items.filter((item) => !foldedGroups.some((f) => f.href === item.href)),
              ],
            }
          : g
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsKey, folded]);

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
      // Under the announcement bar while it is on screen (`--promo-h`, set by `PromoBar`).
      style={{ top: "var(--promo-h, 0px)" }}
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
          "smoke-bar px-[clamp(1.5rem,3vw,3.5rem)] text-white"
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

          {/* Left-aligned beside the logo, one row of tabs at an even gap, the groups split by thin vertical lines. Only a
              tab with a list (Custom Services) opens the panel - hovering or tabbing into it; the other tabs are plain
              links and close it. */}
          <nav
            ref={navRef}
            className="relative flex min-w-0 flex-1 items-start justify-start gap-x-3 overflow-x-clip ps-4 text-[13px] font-semibold text-[#ececee] xl:gap-x-3.5 2xl:gap-x-5 2xl:ps-8 2xl:text-sm"
          >
            {/* The ruler: an invisible copy of the whole row (the last tab with its long label), only for measuring. */}
            <div
              ref={rulerRef}
              aria-hidden
              className="pointer-events-none invisible absolute top-0 left-0 flex w-max items-start gap-x-3 whitespace-nowrap xl:gap-x-3.5 2xl:gap-x-5"
            >
              {groups.map((group) => (
                <div key={group.href} className="flex shrink-0 flex-row">
                  {group.divideBefore ? <span className="me-3 h-4 w-px xl:me-4 2xl:me-6" /> : null}
                  <span className="flex h-[4.25rem] items-center">{group.label}</span>
                </div>
              ))}
              {/* ... and the last tab as it reads once something is folded into it. */}
              {groups[groups.length - 1]?.foldedLabel ? (
                <div className="flex shrink-0 flex-row">
                  {groups[groups.length - 1].divideBefore ? <span className="me-3 h-4 w-px xl:me-4 2xl:me-6" /> : null}
                  <span className="flex h-[4.25rem] items-center">{groups[groups.length - 1].foldedLabel}</span>
                </div>
              ) : null}
            </div>

            {bar.map((group, barIndex) => (
              // Each tab as wide as its title (or its list, if wider) - never narrower, so titles never overlap.
              <div
                key={group.href}
                className="flex shrink-0 flex-row"
                onMouseEnter={group.items.length ? show : hide}
                onFocus={group.items.length ? show : () => setOpen(false)}
              >
                {group.divideBefore && barIndex > 0 ? (
                  <span aria-hidden className="me-3 mt-[1.625rem] h-4 w-px bg-white/20 xl:me-4 2xl:me-6" />
                ) : null}
                <div className="relative flex flex-col">
                  <div className="flex h-[4.25rem] items-center">
                    <MegaLink href={group.href}>{group.label}</MegaLink>
                  </div>
                  {group.items.length ? (
                    // The drop-down: a floating glass card under this tab alone (the bar itself stays as it is), right-aligned
                    // under the last tab so it never runs off the screen.
                    <motion.div
                      initial={false}
                      animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: open ? 0.24 : 0.16, ease: EASE }}
                      inert={!open}
                      className={cn(
                        "absolute top-full z-10 min-w-[15rem] rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,28,0.94)_0%,rgba(10,10,13,0.94)_100%)] p-2 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl",
                        barIndex === bar.length - 1 ? "right-0" : "left-0",
                        !open && "pointer-events-none"
                      )}
                    >
                      <ul aria-label={group.label} className="flex flex-col text-[0.9375rem] font-medium text-[#c9ccd2]">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="block cursor-pointer rounded-xl px-3.5 py-2.5 whitespace-nowrap transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-0.5 hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary focus-visible:outline-none"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex h-[4.25rem] shrink-0 items-center justify-end gap-3">{controls}</div>
        </div>
      </div>
    </header>
  );
}
