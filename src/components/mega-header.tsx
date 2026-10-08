"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { brandLogo } from "@/lib/brand-logo";

const EASE = [0.22, 1, 0.36, 1] as const;

/** How far the tabs may be set smaller to fit (1 = their size): below this tabs fold into the last one. */
const MIN_FIT = 0.87;

export type MegaNavItem = { label: string; href: string; /** A short line under the label (the Explore Videos list). */ hint?: string };

export type MegaNavGroup = {
  label: string;
  href: string;
  items: MegaNavItem[];
  /**
   * Every tab is kept on the bar, set smaller to fit; when even that is not enough (a narrow window) tabs fold into
   * the last tab's drop-down, the higher number first; no number = the tab never folds. What folds is measured, so
   * nothing is ever cut off.
   */
  collapse?: number;
  /** A thin vertical line before this tab, starting a new group. */
  divideBefore?: boolean;
  /** The "More" tab: on the bar only while other tabs are folded into it - its list is those tabs (plus its own `items`). */
  overflow?: boolean;
  /** The glowing orange "Explore Videos" tab: never folds, and its list opens as a wide card under it. */
  cta?: boolean;
  /** A link at the foot of the glowing tab's list ("Browse all videos"). */
  footerLink?: { label: string; href: string };
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

/** The "Explore Videos" tab (`.nav-explore`, globals.css): the other tabs' size, but in capitals with wide letter-spacing, orange
 * letters that glow and a band of light sliding across them. The ruler measures this same text. */
const CTA_TEXT = "nav-explore inline-block whitespace-nowrap uppercase tracking-[0.09em] font-extrabold";

/**
 * The English site's desktop header: a glass bar across the whole width of the screen, sliding away as the page
 * scrolls down and back as soon as it scrolls up. One row of tabs beside the logo - Home, the glowing orange "EXPLORE
 * VIDEOS" tab, About Us, Customers, Pricing, Careers and "More". "Explore Videos" and "More" hold
 * a list: hovering or tabbing into one drops a floating card under it - the bar does not unfold, the other tabs are
 * plain links - and it folds away as the pointer leaves. The logo and the right-hand controls stay on the top row.
 * `/bg` keeps `SiteHeader`'s own desktop header.
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
  /** The href of the group whose list is open, if any. */
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  /** The hrefs of the tabs folded into the last tab's drop-down at the current width. */
  const [folded, setFolded] = useState<string[]>([]);
  /** The size the tabs are set at, 1 → `MIN_FIT`: the letters shrink (the gaps with them, they are in `em`) to fit. */
  const [fit, setFit] = useState(1);
  /** False in the server HTML and until the first measurement: the tabs are not shown before they are fitted. */
  const [fitted, setFitted] = useState(false);
  const groupsKey = groups.map((g) => `${g.href}|${g.label}|${g.collapse ?? ""}${g.cta ? "b" : ""}${g.overflow ? "o" : ""}`).join("~");

  // Fit the tabs to the room there is: an invisible copy of the whole row (`ruler`) gives every tab's natural width;
  // while the row is wider than the nav, the not-main tabs fold into the last tab's list and the main ones shrink.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const ruler = rulerRef.current;
    if (!nav || !ruler) return;
    const measure = () => {
      const widths = Array.from(ruler.children, (el) => (el as HTMLElement).offsetWidth).slice(0, groups.length);
      const gap = parseFloat(getComputedStyle(ruler).columnGap) || 0;
      const room = nav.clientWidth - (parseFloat(getComputedStyle(nav).paddingInlineStart) || 0);
      const moreIdx = groups.findIndex((g) => g.overflow);
      const tabHidden = widths.map(() => false);
      // "More" is on the bar only while something is folded into it.
      const present = (i: number) => (i === moreIdx ? tabHidden.some((f) => f) : !tabHidden[i]);
      // The least room the row needs: the tabs on the bar, each thin line between two groups (an item of its own,
      // 1px wide) and a gap between every two items. The tabs are then spread over whatever room is left (`justify-between`).
      const total = () => {
        let sum = 0;
        let items = 0;
        let shownCount = 0;
        groups.forEach((g, i) => {
          if (!present(i)) return;
          if (g.divideBefore && shownCount > 0) {
            sum += 1;
            items += 1;
          }
          sum += widths[i];
          items += 1;
          shownCount += 1;
        });
        return sum + gap * Math.max(0, items - 1);
      };
      // Every tab stays on the bar, set smaller to fit - down to `MIN_FIT`. Only when even that is not enough do tabs
      // fold into "More", the higher `collapse` first.
      const order = groups
        .map((g, i) => ({ i, c: g.collapse }))
        .filter((x): x is { i: number; c: number } => x.c !== undefined)
        .sort((x, y) => y.c - x.c);
      for (const { i } of order) {
        if (room / total() >= MIN_FIT) break;
        tabHidden[i] = true;
      }
      let size = Math.min(1, room / total());
      // A hair under, so rounding in the text never pushes the last tab over the edge.
      size = size < 1 ? Math.max(MIN_FIT, Math.floor(size * 985) / 1000) : 1;
      const next = groups.filter((_, i) => tabHidden[i]).map((g) => g.href);
      setFolded((prev) => (prev.length === next.length && prev.every((h, k) => h === next[k]) ? prev : next));
      setFit(size);
      setFitted(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
    // `groups` is rebuilt on every render of the parent; its content is what matters (`groupsKey`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsKey]);

  // The tabs on the bar, and "More" - there only while something is folded into it - with the folded tabs in its list.
  const bar = useMemo(() => {
    const foldedGroups = groups.filter((g) => folded.includes(g.href));
    return groups
      .filter((g) => (g.overflow ? foldedGroups.length > 0 : !folded.includes(g.href)))
      .map((g): MegaNavGroup =>
        g.overflow
          ? {
              ...g,
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

  const show = (key: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenKey(key);
  };
  // A short delay so a pointer grazing the edge does not snap it shut.
  const hide = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenKey(null), 140);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const anyOpen = openKey !== null;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 hidden w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
        hidden && !anyOpen ? "-translate-y-full" : "translate-y-0"
      )}
      // Under the announcement bar while it is on screen (`--promo-h`, set by `PromoBar`).
      style={{ top: "var(--promo-h, 0px)" }}
      // Hidden off screen: out of the tab order and the accessibility tree until it comes back.
      inert={hidden && !anyOpen}
      onMouseLeave={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpenKey(null);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenKey(null);
      }}
    >
      {/* The whole width of the screen, edge to edge, in smoked glass (`.smoke-bar`, globals.css). */}
      <div className="smoke-bar px-[clamp(1rem,2.2vw,3.5rem)] text-white">
        <div className="flex w-full items-start justify-between gap-3 xl:gap-4 min-[1700px]:gap-6">
          {/* The KeplerBay logo (planet + name, white and orange - made for the dark bar, so no inversion). */}
          <Link href={logoHref} className="group flex h-[4.25rem] min-w-0 shrink-0 items-center pr-1 xl:pr-3">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              sizes="160px"
              priority
              className="h-5 w-auto xl:h-7"
            />
          </Link>

          {/* Left-aligned beside the logo, one row of tabs at an even gap, the groups split by thin vertical lines. The
              "Explore Videos" and the last tab hold a list - hovering or tabbing into one opens its panel; the other tabs are
              plain links and close it. */}
          <nav
            ref={navRef}
            // The server HTML carries every tab, and only the measurement (client side) knows how many fit - until then
            // the row is clear, so a tab is never seen cut off at the edge for the moment before the page hydrates.
            className={cn(
              "relative flex min-w-0 flex-1 items-start justify-between gap-x-[1em] overflow-x-clip text-[length:calc(15px*var(--nav-fit,1))] font-semibold text-[#ececee] transition-opacity duration-200 xl:gap-x-[1.16em] xl:ps-4 min-[1900px]:gap-x-[1.55em] min-[1900px]:ps-8 min-[1900px]:text-[length:calc(16px*var(--nav-fit,1))]",
              !fitted && "opacity-0"
            )}
            style={fit < 1 ? ({ "--nav-fit": fit } as CSSProperties) : undefined}
          >
            {/* The ruler: an invisible copy of the whole row, only for measuring (always at full size). */}
            <div
              ref={rulerRef}
              aria-hidden
              className="pointer-events-none invisible absolute top-0 left-0 flex w-max items-start gap-x-[1em] whitespace-nowrap text-[length:calc(15px*var(--nav-fit))] [--nav-fit:1] xl:gap-x-[1.16em] min-[1900px]:gap-x-[1.55em] min-[1900px]:text-[length:calc(16px*var(--nav-fit))]"
            >
              {groups.map((group) => (
                <div key={group.href} className="flex shrink-0 flex-row">
                  <span className="flex h-[4.25rem] items-center">
                    {group.cta ? <span className={CTA_TEXT}>{group.label}</span> : group.label}
                  </span>
                </div>
              ))}
            </div>

            {bar.map((group, barIndex) => {
              const isOpen = openKey === group.href;
              const isLast = barIndex === bar.length - 1;
              return (
                <Fragment key={group.href}>
                  {/* A thin line between two groups: an item of its own, so the spread-out tabs sit evenly around it. */}
                  {group.divideBefore && barIndex > 0 ? <span aria-hidden className="mt-[1.625rem] h-4 w-px shrink-0 bg-white/20" /> : null}
                  {/* Each tab as wide as its title (or its list, if wider) - never narrower, so titles never overlap. */}
                  <div
                    className="flex shrink-0 flex-row"
                    onMouseEnter={group.items.length ? () => show(group.href) : hide}
                    onFocus={group.items.length ? () => show(group.href) : () => setOpenKey(null)}
                  >
                    <div className="relative flex flex-col">
                      <div className="flex h-[4.25rem] items-center">
                        {group.cta ? (
                          <Link
                            href={group.href}
                            className={cn(CTA_TEXT, "cursor-pointer outline-none transition-transform duration-200 ease-out hover:translate-x-0.5")}
                          >
                            {group.label}
                          </Link>
                        ) : group.overflow ? (
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={isOpen}
                            onClick={() => (isOpen ? setOpenKey(null) : show(group.href))}
                            className="group/link relative inline-block cursor-pointer whitespace-nowrap outline-none transition-transform duration-200 ease-out hover:translate-x-0.5"
                          >
                            <span className={INK}>{group.label}</span>
                          </button>
                        ) : (
                          <MegaLink href={group.href}>{group.label}</MegaLink>
                        )}
                      </div>
                      {group.items.length ? (
                        // The drop-down: a floating glass card under this tab alone (the bar itself stays as it is), right-aligned
                        // under the last tab so it never runs off the screen.
                        <motion.div
                          initial={false}
                          animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                          transition={{ duration: isOpen ? 0.24 : 0.16, ease: EASE }}
                          inert={!isOpen}
                          className={cn(
                            "absolute top-full z-10 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,28,0.96)_0%,rgba(10,10,13,0.96)_100%)] p-2 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl",
                            group.cta ? "w-[min(38rem,calc(100vw-3rem))] p-3" : "min-w-[15rem]",
                            isLast ? "right-0" : "left-0",
                            !isOpen && "pointer-events-none"
                          )}
                        >
                          <ul
                            aria-label={group.label}
                            className={cn(
                              "text-[0.9375rem] font-medium text-[#c9ccd2]",
                              group.cta ? "grid grid-cols-2 gap-x-1" : "flex flex-col"
                            )}
                          >
                            {group.items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="block cursor-pointer rounded-xl px-3.5 py-2.5 transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-0.5 hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary focus-visible:outline-none"
                                >
                                  <span className={cn("block", !group.cta && "whitespace-nowrap")}>{item.label}</span>
                                  {item.hint ? <span className="mt-0.5 block text-[0.8125rem] leading-snug font-normal text-white/45">{item.hint}</span> : null}
                                </Link>
                              </li>
                            ))}
                          </ul>
                          {group.footerLink ? (
                            <Link
                              href={group.footerLink.href}
                              className="mt-2 flex cursor-pointer items-center justify-between rounded-xl border-t border-white/10 px-3.5 pt-3 pb-1.5 text-[0.9375rem] font-semibold text-[#ffb066] transition-colors duration-200 hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                            >
                              {group.footerLink.label}
                              <span aria-hidden>→</span>
                            </Link>
                          ) : null}
                        </motion.div>
                      ) : null}
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </nav>

          <div className="flex h-[4.25rem] shrink-0 items-center justify-end gap-3">{controls}</div>
        </div>
      </div>
    </header>
  );
}
