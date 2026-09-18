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
import { useTrainingCards } from "@/components/training/use-training-cards";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS, PARTNER_ICON_BASE } from "@/lib/partners";
import { PROJECTS } from "@/lib/projects";
import { getServiceSlug } from "@/lib/services/constants";
import {
  contactProcessPath,
  homePath,
  portfolioPath,
  projectPath,
  projectsPath,
  servicePath,
  servicesPath,
  trainingPath,
} from "@/lib/routes";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The nav links' ink: the brand's red → violet gradient sits under the letters, clipped to them, and shows as the
 * text colour fades out on hover (`text-transparent`) - a plain link lifts a pixel with it; a dropdown's label
 * does the same while its menu is open.
 */
const NAV_INK = "bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] bg-clip-text transition-[color,transform] duration-200 ease-out";
const NAV_LINK = cn(NAV_INK, "inline-block whitespace-nowrap hover:-translate-y-px hover:text-transparent");

type DropdownItem = { href: string; label: string; icon: ReactNode; /** The tile behind the icon: the theme's tint, or white for a client's logo. */ tile?: "tint" | "white" };

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
          className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3"
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
                    "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-card-border transition-shadow duration-200 group-hover/item:shadow-[0_10px_24px_-8px_rgba(2,6,23,0.45)]",
                    item.tile === "white" ? "bg-white" : "bg-foreground/[0.05]"
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
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

  // The case studies, each with the client's logo on a white tile (a white-ink-only mark is inverted for it).
  const projectItems: DropdownItem[] = PROJECTS.flatMap((project) => {
    const partner = project.partnerId ? PARTNERS.find((candidate) => candidate.id === project.partnerId) : undefined;
    const file = partner?.light ?? partner?.dark;
    return [
      {
        href: projectPath(language, project.id),
        label: t.projects.items[project.id].name,
        tile: "white" as const,
        icon: file ? (
          <Image
            src={`${PARTNER_ICON_BASE}${file}`}
            alt=""
            width={400}
            height={140}
            sizes="120px"
            className={cn("h-7 w-auto max-w-[46px] object-contain", partner?.invertOnLight && !partner.light && "invert")}
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
              src="/logo-1.png"
              alt="DreamTeam"
              width={1024}
              height={416}
              sizes="128px"
              className="h-10 w-auto grayscale transition-all group-hover:grayscale-0 dark:invert"
            />
          </Link>
          <div className="flex shrink-0 items-center gap-2.5">
            <ThemeToggle className="shrink-0" />
            <EmailIconLink className="size-10" />
            <PhoneIconLink className="size-10" />
          </div>
        </GlassShell>
      </header>

      {/* Desktop: floating pill (like the mobile bar) - 96% wide, detached from the top and the corners. */}
      <header
        className={cn(
          "fixed inset-x-0 top-4 z-50 mx-auto hidden w-[96%] transition-all duration-300 lg:block",
          isScrolled ? "scale-[0.985]" : "scale-100"
        )}
      >
        <div
          className={cn(
            "liquid-glass-header rounded-full ps-6 pe-3 transition-shadow duration-300",
            isScrolled
              ? "shadow-[0_18px_50px_-12px_rgba(2,6,23,0.45)]"
              : "shadow-[0_12px_36px_-14px_rgba(2,6,23,0.3)]"
          )}
        >
          <div className="relative flex w-full items-center justify-between gap-4 py-1.5 lg:gap-6">
            {/* Logo — breathing room via padding so it never touches the bar edges. */}
            <Link href={homeHref} className="group flex min-w-0 items-center justify-self-start py-1 pr-3">
              <Image
                src="/logo-1.png"
                alt="DreamTeam"
                width={1024}
                height={416}
                sizes="130px"
                priority
                className="h-9 w-auto grayscale transition-all group-hover:grayscale-0 dark:invert md:h-10"
              />
            </Link>

            {/* Absolutely centred from xl up; below that it flows from the left.
                Never `overflow-x-auto` — that clips the dropdown panels. */}
            <nav className="flex min-w-0 flex-1 items-center gap-5 overflow-visible whitespace-nowrap px-2 text-[0.9375rem] font-semibold text-foreground/80 xl:gap-8 xl:text-base 2xl:pointer-events-none 2xl:absolute 2xl:left-1/2 2xl:w-auto 2xl:flex-none 2xl:-translate-x-1/2 2xl:px-0 2xl:text-lg 2xl:[&>*]:pointer-events-auto">
              <Link href={portfolioPath(language)} className={NAV_LINK}>
                {t.header.portfolio}
              </Link>
              {/* The case studies: a dropdown of the clients (logo + name), the label itself the listing. */}
              <NavDropdown label={t.header.projects} href={projectsPath(language)} items={projectItems} />
              <NavDropdown label={t.header.services} href={servicesPath(language)} items={serviceItems} />
              <NavDropdown label={t.header.training} href={trainingPath(language)} items={trainingItems} />
              {/* The contact page (the form, the details, the wizard) - as the dock and the sheet link it. */}
              <Link href={contactProcessPath(language)} className={NAV_LINK}>
                {t.header.contact}
              </Link>
            </nav>

            {/* Right controls */}
            <div className="flex flex-shrink-0 items-center justify-end gap-3">
              {/* <LanguageDropdown /> */}
              <ThemeToggle className="shrink-0" />
              {/* Plain round icon buttons: copy the email / phone with a "copied" tag as the only feedback. */}
              <EmailCopyButton />
              <PhoneCopyButton />
              {/* The site's main CTA - the projects' arrow-disc pill at the slim header size, hugging the bar's right end
                  (the bar's end padding equals its vertical one) under a faint brand-gradient glow. */}
              <ButtonWithIcon href={`${homeHref}#quote`} surface="auto" size="sm" glow className="shrink-0">
                {t.header.quoteCta}
              </ButtonWithIcon>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
