"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { AccountShell } from "@/components/account-shell";
import { ProjectRowMedia, ProjectThumbnail } from "@/components/projects-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS, PARTNER_ICON_BASE, type Partner } from "@/lib/partners";
import { PROJECTS, type Project } from "@/lib/projects";
import { portfolioPath, pricingPath, projectPath } from "@/lib/routes";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** More clients than the case studies: the logos of the hero's "Trusted by" strip that are not already partners (white-ink files). */
const EXTRA_LOGOS = [
  { file: "valtcan", name: "Valtcan" },
  { file: "iceheart", name: "Iceheart" },
  { file: "sneedspeed", name: "Sneedspeed Powertrain Systems" },
  { file: "together-local", name: "Together Local" },
  { file: "streetlight-taco", name: "Streetlight Taco" },
  { file: "raibranch", name: "Raibranch" },
  { file: "sinisco", name: "Sinisco" },
  { file: "chargecloud", name: "chargecloud" },
  { file: "pointrn", name: "PointRN" },
  { file: "senko", name: "Senkō" },
  { file: "hanstaiger", name: "Hanstaiger" },
];

type Logo = { key: string; name: string; src: string };

function allLogos(): Logo[] {
  const fromPartners = PARTNERS.flatMap((p: Partner) => {
    const file = p.light ?? p.dark;
    return file ? [{ key: p.id, name: p.ariaLabel, src: `${PARTNER_ICON_BASE}${file}` }] : [];
  });
  const extra = EXTRA_LOGOS.map((l) => ({ key: l.file, name: l.name, src: `/hero-tiger/logos/${l.file}.png` }));
  return [...fromPartners, ...extra];
}

/**
 * Every client's mark as one white silhouette on a dark tile (`brightness-0 invert` turns dark-ink and white-ink files
 * alike into the same white, so the wall reads as one), dim until hovered.
 */
function LogoWall() {
  const logos = allLogos();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {logos.map((logo, i) => (
        <motion.li
          key={logo.key}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: Math.min(i % 6, 5) * 0.05, ease: EASE }}
          className="group flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_70%)] px-6 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[#ff7a1a]/45 hover:shadow-[0_20px_40px_-24px_rgba(255,106,20,0.5)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small brand marks in mixed formats, shown as one white silhouette */}
          <img src={logo.src} alt={logo.name} loading="lazy" className="max-h-10 w-auto max-w-[8.5rem] object-contain opacity-65 brightness-0 invert transition-opacity duration-300 group-hover:opacity-100" />
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * A case study as a window: the film (or its poster) in a 16:9 frame that plays while hovered - or, on a touch screen,
 * while mostly on screen - the client's mark and name over a black gradient, then the headline and the way in below.
 */
function CaseStudyWindow({ project, index }: { project: Project; index: number }) {
  const { t, language } = useLanguage();
  const p = t.projects;
  const copy = p.items[project.id];
  const partner = PARTNERS.find((c) => c.id === project.partnerId);
  const file = partner ? (partner.light ?? partner.dark) : null;
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [hover, setHover] = useState(false);
  const onScreen = useInView(ref, { amount: 0.6 });
  const playing = !reduceMotion && (fine ? hover : onScreen);

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay: Math.min(index, 2) * 0.1, ease: EASE }}
    >
      <Link
        ref={ref}
        href={projectPath(language, project.id)}
        className="group block cursor-pointer outline-none"
        onPointerEnter={(e) => e.pointerType !== "touch" && setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <div
          className="relative aspect-video transform-gpu overflow-hidden rounded-2xl border border-white/10 bg-[#141518] transition-[transform,border-color] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:-translate-y-1.5 group-hover:border-[#ff7a1a]/50 group-focus-visible:border-[#ff7a1a]/70"
          style={{ boxShadow: `0 28px 60px -30px color-mix(in srgb, ${project.glow} 55%, transparent)` }}
        >
          {project.clip ? (
            <ProjectRowMedia clip={project.clip} playing={playing} />
          ) : (
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              <ProjectThumbnail project={project} alt={copy.name} sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.5)_45%,transparent_100%)]" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffb066]">{copy.industry}</p>
              <h3 className="mt-1 font-heading text-2xl leading-none font-black uppercase tracking-tight text-white transition-colors duration-300 group-hover:text-[#ff8a1f]">{copy.name}</h3>
            </div>
            {file ? (
              <Image
                src={`${PARTNER_ICON_BASE}${file}`}
                alt=""
                width={160}
                height={56}
                unoptimized
                className="h-8 w-auto max-w-[6.5rem] shrink-0 object-contain opacity-90 brightness-0 invert"
              />
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-lg leading-snug font-semibold text-white">{copy.headline}</p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/55">{copy.description}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff8a1f] transition-transform duration-300 group-hover:translate-x-1">
          {p.viewProject}
          <IconArrowUpRight className="size-4" aria-hidden />
        </span>
      </Link>
    </motion.li>
  );
}

/** `/projects`, now "Customers": first a wall of the logos of the clients we have made video for, then the case studies as windows. */
export function CustomersPageView() {
  const { t, language } = useLanguage();
  const c = t.projects.customers;

  return (
    <AccountShell wide>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{c.eyebrow}</p>
      <h1 className="mt-3 font-heading text-[clamp(30px,4vw,56px)] leading-[0.98] font-black uppercase text-balance">
        {c.title1} <span className="text-section-accent">{c.title2}</span>
      </h1>
      <p className="mt-4 max-w-[60ch] text-lg text-white/65">{c.subtitle}</p>

      <div className="mt-10">
        <LogoWall />
      </div>

      <h2 className="mt-20 font-heading text-[clamp(26px,3vw,42px)] leading-[0.98] font-black uppercase text-balance">
        {c.studiesTitle1} <span className="text-section-accent">{c.studiesTitle2}</span>
      </h2>
      <p className="mt-3 max-w-[60ch] text-white/60">{c.studiesSubtitle}</p>

      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map((project, index) => (
          <CaseStudyWindow key={project.id} project={project} index={index} />
        ))}
      </ul>

      <div className="mt-16 flex flex-wrap items-center gap-4">
        <Link
          href={pricingPath(language)}
          className="inline-flex h-12 cursor-pointer items-center rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5"
        >
          {c.ctaPricing}
        </Link>
        <Link
          href={portfolioPath(language)}
          className={cn("inline-flex h-12 cursor-pointer items-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white/85 transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10")}
        >
          {c.ctaWork}
        </Link>
      </div>
    </AccountShell>
  );
}
