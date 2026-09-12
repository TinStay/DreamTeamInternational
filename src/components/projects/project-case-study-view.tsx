"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  IconAspectRatioFilled,
  IconBrandFacebook,
  IconBrandInstagramFilled,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBriefcaseFilled,
  IconBulbFilled,
  IconCalendarFilled,
  IconCircleArrowRightFilled,
  IconEyeFilled,
  IconExternalLink,
  IconMessageFilled,
  IconPaletteFilled,
  IconPlayerPlayFilled,
  IconSparklesFilled,
  IconTagFilled,
  IconTrophyFilled,
  IconWorldFilled,
} from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PartnerLogo } from "@/components/partner-logo";
import { QuoteFormSection } from "@/components/quote-form/quote-form-section";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { ctaPillClassName, primaryGradientInteractiveClassName } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PARTNERS } from "@/lib/partners";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import {
  formatViews,
  partnershipMonths,
  totalViews,
  type Project,
  type ProjectPlatformKey,
} from "@/lib/projects";
import { projectsPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_REFERRER_POLICY } from "@/lib/youtube-embeds";

const EASE = [0.22, 1, 0.36, 1] as const;

const PLATFORM_ICONS: Record<ProjectPlatformKey, typeof IconBrandYoutube> = {
  youtube: IconBrandYoutube,
  instagram: IconBrandInstagramFilled,
  tiktok: IconBrandTiktok,
  facebook: IconBrandFacebook,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const panelClass = "rounded-3xl border border-card-border bg-card shadow-elevated-soft";

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card-elevated px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function StatTile({
  Icon,
  label,
  value,
  hint,
}: {
  Icon: typeof IconEyeFilled;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={cn(panelClass, "flex items-center gap-4 p-4 sm:p-5")}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-gradient text-white shadow-[0_8px_20px_var(--primary-elevated-shadow)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {label}
        </p>
        <p className="truncate font-heading text-xl font-bold text-foreground sm:text-2xl">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function DetailRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof IconEyeFilled;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-card-elevated text-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {label}
        </dt>
        <dd className="text-sm font-semibold text-foreground">{value}</dd>
      </div>
    </div>
  );
}

/** Case study page for one project: client logo, mission, description, stats, platforms, quote form. */
export function ProjectCaseStudyView({ project }: { project: Project }) {
  const { t, language } = useLanguage();
  const p = t.projects;
  const d = p.detail;
  const copy = p.items[project.id];
  const partner = project.partnerId
    ? PARTNERS.find((candidate) => candidate.id === project.partnerId)
    : undefined;

  const views = totalViews(project);
  const viewsLabel = views === null ? d.tbd : formatViews(views, language);
  const months = project.since ? partnershipMonths(project.since) : null;
  const sinceYear = project.since ? new Date(project.since).getFullYear() : null;
  const videoHref = project.videoId ? `https://www.youtube.com/watch?v=${project.videoId}` : null;
  const tall = project.orientation === "tall";

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-8 pt-24 lg:pt-32">
        <motion.div
          className="mx-auto w-full max-w-7xl px-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <PageBreadcrumbs className="mb-6" />

          {/* Header panel: client logo, chips, headline, lead, CTAs. */}
          <motion.section variants={fadeUp} className={cn(panelClass, "overflow-hidden")}>
            <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex h-14 items-center">
                    {partner ? (
                      <PartnerLogo
                        p={partner}
                        imgClass="h-12 w-auto max-w-[190px] object-contain sm:h-14"
                        sizes="190px"
                      />
                    ) : (
                      <span className="font-heading text-2xl font-bold text-foreground">
                        {copy.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Chip>{p.categories[project.category]}</Chip>
                    <Chip>
                      <IconPaletteFilled className="size-3.5" aria-hidden />
                      {p.styles[project.style]}
                    </Chip>
                  </div>
                </div>

                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {d.eyebrow}
                </p>
                <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
                  {copy.headline}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {copy.description}
                </p>

                {/* Result tags ("20+ videos", "75M+ views"…) - same list the home showcase leads with. */}
                <dl className="mt-5 flex flex-wrap gap-2">
                  <dt className="sr-only">{p.showcase.highlights}</dt>
                  {copy.tags.map((tag) => (
                    <dd key={tag}>
                      <Chip>
                        <IconSparklesFilled className="size-3.5" aria-hidden />
                        {tag}
                      </Chip>
                    </dd>
                  ))}
                </dl>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {videoHref ? (
                    <a
                      href={videoHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(primaryGradientInteractiveClassName, ctaPillClassName, "gap-2")}
                    >
                      <IconPlayerPlayFilled className="size-4" aria-hidden />
                      {p.watch}
                    </a>
                  ) : null}
                  <Link
                    href="#quote"
                    className={cn(
                      ctaPillClassName,
                      "gap-2 border border-card-border bg-card-elevated text-foreground transition-colors hover:bg-muted/60"
                    )}
                  >
                    {p.similar}
                    <IconCircleArrowRightFilled className="size-5" aria-hidden />
                  </Link>
                </div>
              </div>

              {/* Visual: thumbnail or branded placeholder. */}
              <div className="relative min-h-64 bg-card-elevated lg:min-h-full">
                {project.videoId ? (
                  <Image
                    src={youtubeThumbnailUrl(project.videoId)}
                    alt={copy.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className={cn("object-cover", tall && "scale-[2.4]")}
                  />
                ) : (
                  <div className="absolute inset-0 bg-primary-gradient opacity-90" aria-hidden>
                    <IconSparklesFilled className="absolute right-8 top-8 size-12 text-white/40" aria-hidden />
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-card lg:via-transparent lg:to-transparent"
                  aria-hidden
                />
              </div>
            </div>
          </motion.section>

          {/* Stats band. */}
          <motion.div variants={fadeUp} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile Icon={IconEyeFilled} label={d.views} value={viewsLabel} hint={d.viewsHint} />
            <StatTile
              Icon={IconWorldFilled}
              label={d.platforms}
              value={project.platforms.length > 0 ? String(project.platforms.length) : d.tbd}
              hint={project.platforms.map((pl) => d.platformNames[pl.key]).join(" · ") || undefined}
            />
            <StatTile
              Icon={IconCalendarFilled}
              label={d.partnership}
              value={sinceYear ? `${d.since} ${sinceYear}` : d.tbd}
              hint={months !== null ? `${months} ${d.months}` : undefined}
            />
            <StatTile Icon={IconAspectRatioFilled} label={p.facts.format} value={copy.format} hint={copy.deliverable} />
          </motion.div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              {/* Mission */}
              <motion.section variants={fadeUp} className={cn(panelClass, "p-6 sm:p-8")}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary-gradient text-white">
                    <IconTrophyFilled className="size-5" aria-hidden />
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">{d.mission}</h2>
                </div>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{copy.mission}</p>
              </motion.section>

              {/* Description */}
              <motion.section variants={fadeUp} className={cn(panelClass, "p-6 sm:p-8")}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary-gradient text-white">
                    <IconBulbFilled className="size-5" aria-hidden />
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-foreground">{d.about}</h2>
                </div>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{copy.description}</p>
              </motion.section>

              {/* Video */}
              {project.videoId ? (
                <motion.section variants={fadeUp} className={cn(panelClass, "overflow-hidden p-3 sm:p-4")}>
                  <div
                    className={cn(
                      "relative mx-auto overflow-hidden rounded-2xl bg-black",
                      tall ? "aspect-[9/16] max-w-sm" : "aspect-video w-full"
                    )}
                  >
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube.com/embed/${project.videoId}`}
                      title={copy.headline}
                      allow={YOUTUBE_IFRAME_ALLOW}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy={YOUTUBE_REFERRER_POLICY}
                    />
                  </div>
                </motion.section>
              ) : null}
            </div>

            {/* Sidebar: details + platforms */}
            <div className="flex flex-col gap-6">
              <motion.section variants={fadeUp} className={cn(panelClass, "p-6 sm:p-7")}>
                <h2 className="font-heading text-xl font-bold text-foreground">{d.details}</h2>
                <dl className="mt-2 divide-y divide-border/40">
                  <DetailRow Icon={IconBriefcaseFilled} label={d.client} value={copy.name} />
                  <DetailRow Icon={IconBriefcaseFilled} label={p.facts.industry} value={copy.industry} />
                  <DetailRow Icon={IconTagFilled} label={p.facts.campaign} value={copy.campaign} />
                  <DetailRow Icon={IconPaletteFilled} label={p.facts.style} value={p.styles[project.style]} />
                  <DetailRow Icon={IconSparklesFilled} label={p.facts.deliverable} value={copy.deliverable} />
                  <DetailRow
                    Icon={IconCalendarFilled}
                    label={d.partnership}
                    value={sinceYear ? `${d.since} ${sinceYear}` : d.tbd}
                  />
                </dl>
              </motion.section>

              <motion.section variants={fadeUp} className={cn(panelClass, "p-6 sm:p-7")}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-card-elevated text-foreground">
                    <IconMessageFilled className="size-4" aria-hidden />
                  </span>
                  <h2 className="font-heading text-xl font-bold text-foreground">{d.published}</h2>
                </div>
                {project.platforms.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-2">
                    {project.platforms.map((platform) => {
                      const Icon = PLATFORM_ICONS[platform.key];
                      return (
                        <li key={platform.key}>
                          <a
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-card-border bg-card-elevated px-3 py-2.5 transition-colors hover:bg-muted/60"
                          >
                            <Icon className="size-5 shrink-0 text-foreground" aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-foreground">
                                {d.platformNames[platform.key]}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {platform.views === null ? d.tbd : formatViews(platform.views, language)}{" "}
                                {d.viewsShort}
                              </span>
                            </span>
                            <IconExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{d.noPlatforms}</p>
                )}
              </motion.section>

              <motion.div variants={fadeUp}>
                <Link
                  href={projectsPath(language)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <IconCircleArrowRightFilled className="size-5 rotate-180" aria-hidden />
                  {d.backToProjects}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Same multi-step quote wizard as the home page. */}
        <QuoteFormSection className="mt-6" />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
