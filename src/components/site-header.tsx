"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { IconChevronDown } from "@tabler/icons-react";
import { EmailCopyButton, EmailIconLink, PhoneCopyButton, PhoneIconLink } from "@/components/phone-copy-button";
import { ThemeToggle } from "./theme-toggle";
// import { LanguageDropdown } from "./language-dropdown";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { GlassShell } from "@/components/ui/glass-shell";
import { MegaHeader, type MegaNavGroup } from "@/components/mega-header";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { useTrainingCards } from "@/components/training/use-training-cards";
import { cn } from "@/lib/utils";
import { brandLogo } from "@/lib/brand-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS, PARTNER_ICON_BASE } from "@/lib/partners";
import { PROJECTS } from "@/lib/projects";
import { getServiceSlug } from "@/lib/services/constants";
import {
  contactProcessPath,
  homePath,
  portfolioPath,
  pricingPath,
  projectPath,
  projectsPath,
  servicePath,
  servicesPath,
  trainingPath,
} from "@/lib/routes";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The portfolio's categories in its menu's order (`portfolio-section.tsx` - "All" is off the menu). */
const PORTFOLIO_CATEGORY_KEYS = ["construction", "mascots", "tv", "cars", "product", "services", "animated"] as const;

/**
 * The nav links' ink: the brand's red → violet gradient sits under the letters, clipped to them, and shows as the
 * text colour fades out on hover (`text-transparent`) - a plain link lifts a pixel with it; a dropdown's label
 * does the same while its menu is open.
 */
const NAV_INK = "bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] bg-clip-text transition-[color,transform] duration-200 ease-out";
const NAV_LINK = cn(NAV_INK, "inline-block whitespace-nowrap hover:-translate-y-px hover:text-transparent");

type DropdownItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** The tile behind the icon: a square in the theme's tint, or a wide white one for a client's logo (marks are wide). */
  tile?: "tint" | "wide";
};

/**
 * Desktop-only nav item with a hover/focus dropdown. The label itself stays a
 * link to the hub page; the panel lists the child pages. No exit animation on
 * purpose (AnimatePresence exit gating hangs with the current motion version).
 */
function NavDropdown({
  label,
  href,
  items,
}: {
  label: string;
  href: string;
  items: DropdownItem[];
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // Small delay so the pointer can travel from the label into the panel.
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Link
        href={href}
        aria-expanded={open}
        aria-haspopup="menu"
        className="group/nav inline-flex items-center gap-1 whitespace-nowrap transition-transform duration-200 ease-out hover:-translate-y-px"
      >
        {/* The gradient on the letters only - the chevron keeps its ink. */}
        <span className={cn(NAV_INK, "group-hover/nav:text-transparent group-aria-expanded/nav:text-transparent")}>{label}</span>
        <IconChevronDown
          className={cn("size-4 transition-[transform,color] duration-200 group-hover/nav:text-primary", open && "rotate-180 text-primary")}
          aria-hidden
        />
      </Link>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3"
        >
          {/* Opaque card surface (never see-through over page content), lifted with a deep shadow. */}
          <div
            role="menu"
            className="rounded-2xl border border-card-border bg-card p-2 shadow-[0_28px_70px_-18px_rgba(2,6,23,0.55)]"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                role="menuitem"
                href={item.href}
                className="group/item flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-foreground/85 transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-1 hover:bg-foreground/[0.07] hover:text-foreground"
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-card-border transition-shadow duration-200 group-hover/item:shadow-[0_10px_24px_-8px_rgba(2,6,23,0.45)]",
                    item.tile === "wide" ? "h-12 w-24 bg-white px-2" : "size-14 bg-foreground/[0.05]"
                  )}
                >
                  <span className="flex size-full items-center justify-center transition-transform duration-300 ease-out group-hover/item:scale-110">
                    {item.icon}
                  </span>
                </span>
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, language } = useLanguage();
  const homeHref = homePath(language);
  const trainingCards = useTrainingCards();
  const logo = brandLogo(language);

  useEffect(() => {
    // State only when the flag flips - a set on every scroll event scheduled React work per event for nothing.
    let scrolled = false; // mirrors the state
    const handleScroll = () => {
      const next = window.scrollY > 20;
      if (next === scrolled) return;
      scrolled = next;
      setIsScrolled(next);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const serviceItems: DropdownItem[] = t.services.items.flatMap((item) => {
    const slug = getServiceSlug(item.imgSrc);
    if (!slug) return [];
    return [
      {
        href: servicePath(language, slug),
        label: item.title,
        // Source is requested at 224px so the 56px tile stays crisp on 2-3x screens.
        icon: (
          <Image src={item.imgSrc} alt="" width={256} height={256} sizes="224px" className="size-12 object-contain" />
        ),
      },
    ];
  });

  // The case studies, each with the client's logo on a wide white tile (a white-ink-only mark is inverted for it).
  const projectItems: DropdownItem[] = PROJECTS.flatMap((project) => {
    const partner = project.partnerId ? PARTNERS.find((candidate) => candidate.id === project.partnerId) : undefined;
    const file = partner?.light ?? partner?.dark;
    return [
      {
        href: projectPath(language, project.id),
        label: t.projects.items[project.id].name,
        tile: "wide" as const,
        icon: file ? (
          <Image
            src={`${PARTNER_ICON_BASE}${file}`}
            alt=""
            width={400}
            height={140}
            sizes="160px"
            className={cn("h-8 w-auto max-w-[80px] object-contain", partner?.invertOnLight && !partner.light && "invert")}
          />
        ) : (
          <span className="font-heading text-lg font-bold text-neutral-900">{t.projects.items[project.id].name.charAt(0)}</span>
        ),
      },
    ];
  });

  // Same card list as the training page, so hidden trainings stay hidden here too.
  const trainingItems: DropdownItem[] = trainingCards.map((card) => ({
    href: `${trainingPath(language)}/${card.id}`,
    label: card.title,
    icon: (
      <Image src={card.src} alt="" width={256} height={256} sizes="224px" className="size-full object-cover" />
    ),
  }));

  // The English mega menu's columns: each section and the pages under it (Contact has none).
  const megaGroups: MegaNavGroup[] = [
    {
      label: t.header.about,
      href: `${homeHref}#stats`,
      items: (["stats", "reviews", "process", "faq"] as const).map((key) => ({
        label: t.header.aboutItems[key],
        href: `${homeHref}#${key}`,
      })),
    },
    { label: t.header.projects, href: projectsPath(language), items: projectItems },
    {
      label: t.header.portfolio,
      href: portfolioPath(language),
      items: PORTFOLIO_CATEGORY_KEYS.map((key) => ({
        label: t.portfolio.categories[key],
        href: `${portfolioPath(language)}?category=${key}`,
      })),
    },
    { label: t.header.services, href: servicesPath(language), items: serviceItems },
    { label: t.header.training, href: trainingPath(language), items: trainingItems },
    { label: t.header.pricingPage, href: pricingPath(language), items: [] },
    { label: t.header.contact, href: contactProcessPath(language), items: [] },
  ];

  const desktopControls = (
    <>
      {/* <LanguageDropdown /> */}
      <ThemeToggle className="shrink-0" />
      {/* Plain round icon buttons: copy the email / phone with a "copied" tag as the only feedback. */}
      <EmailCopyButton />
      <PhoneCopyButton />
      {/* The site's main CTA - the projects' arrow-disc pill at the slim header size, hugging the bar's right end
          (the bar's end padding equals its vertical one) under a faint brand-gradient glow - opens the services
          page (its cards carry the quote pills). */}
      <ButtonWithIcon href={servicesPath(language)} surface="auto" size="sm" glow className="h-10 shrink-0">
        {t.header.quoteCta}
      </ButtonWithIcon>
    </>
  );

  return (
    <>
      {/* Mobile: glass bar — DT logo left, theme toggle right. Wider and taller than the bottom dock (96%, a 2.5rem
          logo, 2.5rem round buttons) so the brand reads at a glance. */}
      <header
        className={`fixed left-1/2 z-50 w-[96%] max-w-lg -translate-x-1/2 transition-all duration-300 lg:hidden top-[max(0.5rem,env(safe-area-inset-top))] ${
          isScrolled ? "scale-[0.98]" : "scale-100"
        }`}
      >
        <GlassShell className="flex items-center justify-between gap-3 px-5 py-2.5">
          <Link href={homeHref} className="group flex min-w-0 shrink items-center py-1 pr-2">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              sizes="160px"
              className={cn(
                "w-auto grayscale transition-all group-hover:grayscale-0 dark:invert",
                language === "en" ? "h-7" : "h-10"
              )}
            />
          </Link>
          <div className="flex shrink-0 items-center gap-2.5">
            {/* English has one theme (`forcedTheme` in the layout), so no toggle there. */}
            {language === "en" ? null : <ThemeToggle className="shrink-0" />}
            <EmailIconLink className="size-10" />
            <PhoneIconLink className="size-10" />
          </div>
        </GlassShell>
      </header>

      {/* Desktop, English: the mega menu - every section's links in one panel (`mega-header.tsx`). */}
      {language === "en" ? (
        <MegaHeader
          logoHref={homeHref}
          groups={megaGroups}
          // English: one theme (no theme toggle, `forcedTheme` in the layout), no copy buttons - just the hero's
          // amber "Let's talk" pill.
          controls={<TigerCta href={contactProcessPath(language)} label={t.hero.tiger.cta} className="tiger-cta--sm" />}
        />
      ) : (
      /* Desktop: floating pill (like the mobile bar) - 96% wide, detached from the top and the corners. */
      <header
        className={cn(
          "fixed inset-x-0 top-4 z-50 mx-auto hidden w-[96%] transition-all duration-300 lg:block",
          isScrolled ? "scale-[0.985]" : "scale-100"
        )}
      >
        <div
          className={cn(
            "liquid-glass-header rounded-full ps-7 pe-3.5 transition-shadow duration-300",
            isScrolled
              ? "shadow-[0_18px_50px_-12px_rgba(2,6,23,0.45)]"
              : "shadow-[0_12px_36px_-14px_rgba(2,6,23,0.3)]"
          )}
        >
          <div className="relative flex w-full items-center justify-between gap-4 py-2.5 lg:gap-6">
            {/* Logo — breathing room via padding so it never touches the bar edges. */}
            <Link href={homeHref} className="group flex min-w-0 items-center justify-self-start py-1 pr-3">
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

            {/* Absolutely centred from xl up; below that it flows from the left.
                Never `overflow-x-auto` — that clips the dropdown panels. */}
            <nav className="flex min-w-0 flex-1 items-center gap-6 overflow-visible whitespace-nowrap px-2 text-base font-semibold text-foreground/80 xl:gap-9 xl:text-[1.0625rem] 2xl:pointer-events-none 2xl:absolute 2xl:left-1/2 2xl:w-auto 2xl:flex-none 2xl:-translate-x-1/2 2xl:px-0 2xl:text-lg 2xl:[&>*]:pointer-events-auto">
              {/* The case studies first: a dropdown of the clients (logo + name), the label itself the listing. */}
              <NavDropdown label={t.header.projects} href={projectsPath(language)} items={projectItems} />
              <Link href={portfolioPath(language)} className={NAV_LINK}>
                {t.header.portfolio}
              </Link>
              <NavDropdown label={t.header.services} href={servicesPath(language)} items={serviceItems} />
              <NavDropdown label={t.header.training} href={trainingPath(language)} items={trainingItems} />
              {/* The contact page (the form, the details, the wizard) - as the dock and the sheet link it. */}
              <Link href={contactProcessPath(language)} className={NAV_LINK}>
                {t.header.contact}
              </Link>
            </nav>

            {/* Right controls */}
            <div className="flex flex-shrink-0 items-center justify-end gap-3">{desktopControls}</div>
          </div>
        </div>
      </header>
      )}
    </>
  );
}
