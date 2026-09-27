"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBuildingSkyscraper,
  IconBulb,
  IconDeviceMobile,
  IconDeviceTv,
  IconHome,
  IconMoodSmile,
  IconMusic,
  IconPackage,
  IconRocket,
  IconShape,
  IconUserSquareRounded,
  IconUsers,
} from "@tabler/icons-react";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { useLanguage } from "@/lib/i18n/language-context";
import { contactProcessPath, pricingPath } from "@/lib/routes";

/** The kinds of video in the grid, in order: the header's tabs first, then the rest. Words in `packages.items`. */
const PACKAGES: { key: string; Icon: ComponentType<{ className?: string; stroke?: number }> }[] = [
  { key: "socialAds", Icon: IconDeviceMobile },
  { key: "corporate", Icon: IconBuildingSkyscraper },
  { key: "tvAds", Icon: IconDeviceTv },
  { key: "productVideos", Icon: IconPackage },
  { key: "brandMascots", Icon: IconMoodSmile },
  { key: "motionGraphics", Icon: IconShape },
  { key: "launchVideos", Icon: IconRocket },
  { key: "explainerVideos", Icon: IconBulb },
  { key: "avatarVideos", Icon: IconUserSquareRounded },
  { key: "ugcAds", Icon: IconUsers },
  { key: "realEstate", Icon: IconHome },
  { key: "musicVideos", Icon: IconMusic },
];

/**
 * The English home page's "Find the package that fits your needs" (in place of the services + quote wizard): a
 * left-aligned heading on the page margin, a grid of the kinds of video we make - dark cards, an icon in an orange
 * pearl ring, the name in Archivo, a line, and a "See packages" hint that slides in on hover (the whole card opens the
 * plans) - then the two ways on: compare the packages (the orange pill) or ask for something custom.
 */
export function PackagesSection() {
  const { t, language } = useLanguage();
  const p = t.packages;
  const items = p.items as Record<string, { title: string; line: string }>;
  const plansHref = `${pricingPath(language)}?for=business`;

  return (
    <section id="packages" className="relative px-[max(1.25rem,3vw)] py-20 text-white sm:py-28">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{p.eyebrow}</p>
        <h2 className="mt-3 font-heading text-[clamp(30px,3.8vw,60px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance">
          {p.title1} <span className="text-section-accent">{p.title2}</span>
        </h2>
        <p className="mt-4 max-w-[62ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/65">{p.subtitle}</p>
      </header>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 xl:grid-cols-4">
        {PACKAGES.map(({ key, Icon }) => (
          <li key={key}>
            <Link
              href={plansHref}
              className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_60%)] p-6 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[#ff7a1a]/45 hover:shadow-[0_30px_60px_-28px_rgba(255,106,20,0.35)]"
            >
              {/* A warm glow that wakes in the card's corner on hover. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.28),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span className="relative flex size-12 items-center justify-center rounded-xl bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] p-px shadow-[0_0_18px_rgba(255,110,20,0.25)]">
                <span className="flex size-full items-center justify-center rounded-[11px] bg-[#141518]">
                  <Icon className="size-6 text-[#ffb066]" stroke={1.6} />
                </span>
              </span>
              <h3 className="relative mt-5 font-heading text-lg font-black uppercase leading-tight tracking-tight transition-colors duration-200 group-hover:text-[#ff8a1f] xl:text-xl">
                {items[key].title}
              </h3>
              <p className="relative mt-2 flex-1 text-sm leading-relaxed text-white/60">{items[key].line}</p>
              <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white/45 transition-[color,transform] duration-200 group-hover:translate-x-1 group-hover:text-[#ff8a1f]">
                {p.seePlans}
                <IconArrowUpRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <TigerCta href={plansHref} label={p.compare} className="tiger-cta--orange" />
        <Link
          href={contactProcessPath(language)}
          className="group inline-flex items-center gap-1.5 text-[15px] text-white/65 transition-colors duration-200 hover:text-white"
        >
          {p.custom}
          <IconArrowRight
            className="size-4 text-[#ff8a1f] transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
