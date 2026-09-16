"use client";

import { useMemo, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  IconBoxMultipleFilled,
  IconCircleArrowRightFilled,
  IconCodeCircleFilled,
  IconHome2Filled,
  IconLayoutGridFilled,
  IconPaletteFilled,
  IconSparklesFilled,
  IconTagFilled,
} from "@tabler/icons-react";
import { ctaPillClassName, primaryGradientInteractiveClassName } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS, PARTNER_ICON_BASE } from "@/lib/partners";
import { bunnyBackgroundEmbedSrc, bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import {
  PROJECTS,
  PROJECT_CATEGORY_KEYS,
  type Project,
  type ProjectCategoryKey,
} from "@/lib/projects";
import { homePath, projectPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_REFERRER_POLICY } from "@/lib/youtube-embeds";

type CategoryFilter = "all" | ProjectCategoryKey;
export type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const EASE = [0.22, 1, 0.36, 1] as const;

export const CATEGORY_ICONS: Record<CategoryFilter, IconComponent> = {
  all: IconLayoutGridFilled,
  software: IconCodeCircleFilled,
  products: IconBoxMultipleFilled,
  construction: IconHome2Filled,
};

// hqdefault of a 9:16 clip is 4:3 with side bars: 480px wide, content ~202px.
const TALL_THUMB_SCALE = "scale-[2.4]";

/** Small text tags over footage - deliberately not button-like (dark glass, hairline border). */
export const TAG_CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-md border border-white/25 bg-black/45 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-white backdrop-blur-md";
/** Same chip on a light scene (white / cream showcase worlds). */
export const TAG_CHIP_LIGHT_CLASS =
  "inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-white/70 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-neutral-900 backdrop-blur-md";

/**
 * Tags for a project: icon + text only (labels stay for screen readers).
 * `facts` (default) shows the category chip + campaign + style; `highlights`
 * shows *only* the project's curated tags from the dictionary
 * (`items[id].tags` - "75M+ views", "Cinema ad"…, in that order), which is
 * what the home showcase leads with. `tone` picks the chip surface for dark
 * footage vs. a light scene.
 */
export function ProjectTagChips({
  project,
  className,
  variant = "facts",
  tone = "dark",
}: {
  project: Project;
  className?: string;
  variant?: "facts" | "highlights";
  tone?: "dark" | "light";
}) {
  const { t } = useLanguage();
  const p = t.projects;
  const facts = useProjectFactTags(project);
  const highlights = useProjectHighlightTags(project);
  const CategoryIcon = CATEGORY_ICONS[project.category];
  const tags = variant === "highlights" ? highlights : facts;
  const chipClass = tone === "light" ? TAG_CHIP_LIGHT_CLASS : TAG_CHIP_CLASS;
  const iconClass = tone === "light" ? "size-3 text-neutral-500" : "size-3 text-white/70";
  return (
    <dl className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {variant === "facts" ? (
        <div className={chipClass}>
          <CategoryIcon className={iconClass} aria-hidden />
          <dt className="sr-only">{p.facts.industry}</dt>
          <dd>{p.categories[project.category]}</dd>
        </div>
      ) : null}
      {tags.map(({ key, label, value, Icon }) => (
        <div key={key} className={chipClass}>
          <Icon className={iconClass} aria-hidden />
          <dt className="sr-only">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type FactTag = { key: string; label: string; value: string; Icon: IconComponent };

/** Facts shown as tags over every project visual (campaign + style; the category tag says the industry). */
export function useProjectFactTags(project: Project): FactTag[] {
  const { t } = useLanguage();
  const p = t.projects;
  const copy = p.items[project.id];
  return [
    { key: "campaign", label: p.facts.campaign, value: copy.campaign, Icon: IconTagFilled },
    { key: "style", label: p.facts.style, value: p.styles[project.style], Icon: IconPaletteFilled },
  ];
}

/** Result tags ("20+ videos", "75M+ views"…) from `items[id].tags`; all share the "highlights" label. */
export function useProjectHighlightTags(project: Project): FactTag[] {
  const { t } = useLanguage();
  const p = t.projects;
  return p.items[project.id].tags.map((value, index) => ({
    key: `tag-${index}`,
    label: p.showcase.highlights,
    value,
    Icon: IconSparklesFilled,
  }));
}

/**
 * Client logo in a white circle so the light-background variant reads over any
 * footage (several partners only ship that variant). Falls back to the initial.
 */
export function ClientLogo({
  project,
  name,
  size = "md",
  className,
}: {
  project: Project;
  name: string;
  size?: "sm" | "md";
  /** Override the glow/ring (e.g. a dark shadow on a light scene). */
  className?: string;
}) {
  const partner = project.partnerId
    ? PARTNERS.find((candidate) => candidate.id === project.partnerId)
    : undefined;
  const file = partner?.light ?? partner?.dark ?? null;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_30px_rgba(255,255,255,0.25)] ring-1 ring-white/40",
        size === "sm" ? "size-12 p-2 sm:size-14 sm:p-2.5" : "size-16 p-3 sm:size-20 sm:p-3.5",
        className
      )}
    >
      {partner && file ? (
        <Image
          src={`${PARTNER_ICON_BASE}${file}`}
          alt={partner.ariaLabel}
          width={400}
          height={140}
          sizes="80px"
          // A white-ink-only mark is inverted so it reads on the white circle.
          className={cn("max-h-full w-auto max-w-full object-contain", partner.invertOnLight && "invert")}
        />
      ) : (
        <span
          className={cn(
            "font-heading font-bold text-neutral-900",
            size === "sm" ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
          )}
          aria-label={name}
        >
          {name.charAt(0)}
        </span>
      )}
    </span>
  );
}

/** Background-player URL: muted autoplay loop with all in-player chrome suppressed. */
export function backgroundEmbedSrc(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0`;
}

/**
 * Cover-fit scales for a 16:9 player inside a ~16:9 box. A 9:16 clip is
 * pillar-boxed inside that player, so its visible column needs a much bigger
 * blow-up to fill the frame.
 */
const PLAYER_COVER_SCALE = { wide: "scale-[1.25]", tall: "scale-[3.2]" } as const;

/**
 * Project visual: YouTube thumbnail (centre-cropped for 9:16 clips), the
 * poster of the project's Bunny clip (a plain img - the pull zone serves it
 * only with the site as referrer, never to the image optimizer), or a
 * branded gradient placeholder when nothing is published yet. Fills its
 * positioned parent; pair with `group` on the parent for the hover zoom.
 */
export function ProjectThumbnail({
  project,
  alt,
  sizes,
  priority = false,
}: {
  project: Project;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!project.videoId && project.clip) {
    return (
      <Image
        src={bunnyThumbnailUrl(project.clip)}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        referrerPolicy="origin"
        className={cn(
          "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]",
          project.orientation === "tall" && cn(TALL_THUMB_SCALE, "group-hover:scale-[2.5]")
        )}
      />
    );
  }
  if (!project.videoId) {
    return (
      <div className="absolute inset-0 bg-primary-gradient opacity-90" aria-hidden>
        <IconSparklesFilled className="absolute right-6 top-6 size-10 text-white/40" aria-hidden />
      </div>
    );
  }
  return (
    <Image
      src={youtubeThumbnailUrl(project.videoId)}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={cn(
        "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]",
        project.orientation === "tall" && cn(TALL_THUMB_SCALE, "group-hover:scale-[2.5]")
      )}
    />
  );
}

/**
 * Card backdrop: the thumbnail paints immediately and the clip starts playing
 * behind the copy once the card is near the viewport (muted, looping). The
 * thumbnail stays underneath as the poster frame.
 */
export function ProjectBackdropMedia({
  project,
  alt,
  sizes,
  priority = false,
}: {
  project: Project;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // `once` so scrolling back up doesn't restart every player.
  const inView = useInView(ref, { once: true, margin: "250px 0px 250px 0px" });
  // Reduced motion: keep the poster, never autoplay.
  const reduceMotion = useReducedMotion();
  // The muted background player: the YouTube clip, else the Bunny one.
  const backdrop = project.videoId ? backgroundEmbedSrc(project.videoId) : project.clip ? bunnyBackgroundEmbedSrc(project.clip) : null;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden>
      <ProjectThumbnail project={project} alt={alt} sizes={sizes} priority={priority} />
      {backdrop && inView && !reduceMotion ? (
        <iframe
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2",
            PLAYER_COVER_SCALE[project.orientation === "tall" ? "tall" : "wide"]
          )}
          src={backdrop}
          title=""
          tabIndex={-1}
          allow={YOUTUBE_IFRAME_ALLOW}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy={YOUTUBE_REFERRER_POLICY}
        />
      ) : null}
    </div>
  );
}

/**
 * Case-study card - same standard as the home showcase: everything lives inside
 * the video frame (logo circle + tag chips on top, headline/description and the
 * dominant "view project" pill at the bottom). Floats with a shadow, no panel.
 * Reveals on scroll.
 */
export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { t, language } = useLanguage();
  const p = t.projects;
  const copy = p.items[project.id];
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      // Tilts up out of the page with a blur; the right column trails the left. Skipped under reduced motion.
      initial={reduceMotion ? false : { opacity: 0, y: 80, rotateX: 16, scale: 0.93, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: reduceMotion ? 0 : 0.2 }}
      // Reduced motion also snaps the (server-rendered) initial state straight to the final one.
      transition={reduceMotion ? { duration: 0 } : { duration: 0.85, delay: (index % 2) * 0.14, ease: EASE }}
      style={{ transformPerspective: 1400, transformOrigin: "50% 100%" }}
      className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-card-elevated shadow-[0_32px_80px_-24px_rgba(2,6,23,0.55)] ring-1 ring-black/5 transition-shadow duration-300 will-change-transform hover:shadow-[0_40px_100px_-24px_rgba(2,6,23,0.65)] dark:ring-white/10 sm:aspect-[16/9]"
    >
      <ProjectBackdropMedia project={project} alt={copy.name} sizes="(max-width: 768px) 100vw, 50vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" aria-hidden />

      <div className="absolute inset-0 flex flex-col justify-between p-5 text-white sm:p-6">
        {/* Top row: logo circle + small tag chips */}
        <div className="flex items-start justify-between gap-3">
          <ClientLogo project={project} name={copy.name} size="sm" />
          <ProjectTagChips project={project} className="justify-end" />
        </div>

        {/* Bottom: headline, description, dominant CTA */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{copy.name}</p>
          <h3 className="mt-1 font-heading text-2xl font-bold leading-tight text-balance [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] sm:text-3xl lg:text-4xl">
            {copy.headline}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 line-clamp-2">
            {copy.description}
          </p>
          <Link
            href={projectPath(language, project.id)}
            className="mt-4 inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-neutral-900 shadow-[0_12px_32px_rgba(255,255,255,0.2)] transition-[transform,background-color] duration-200 hover:scale-[1.03] hover:bg-white/90 active:scale-[0.98] sm:text-base"
          >
            {p.viewProject}
            <IconCircleArrowRightFilled className="size-5 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * Case-study list (`/projects`): title + quote CTA on top, a category card on
 * the left, and floating project cards (two per row on desktop) on the right.
 * Filtering is client-side over `PROJECTS`.
 */
export function ProjectsSection({
  variant = "page",
  className,
}: {
  /** `page` renders the `h1` (one per page); anything else an `h2`. */
  variant?: "home" | "page";
  className?: string;
}) {
  const { t, language } = useLanguage();
  const p = t.projects;
  const [active, setActive] = useState<CategoryFilter>("all");
  const quoteHref = `${homePath(language)}#quote`;
  const Heading = variant === "page" ? "h1" : "h2";

  const filters: CategoryFilter[] = ["all", ...PROJECT_CATEGORY_KEYS];
  const visible = useMemo(
    () => (active === "all" ? PROJECTS : PROJECTS.filter((project) => project.category === active)),
    [active]
  );

  return (
    <section id="projects" className={cn("relative w-full pb-4", className)}>
      <div className="relative z-10 mx-auto w-full max-w-none px-4 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 lg:mb-10">
          <div>
            <Heading className="mb-4 font-heading text-4xl font-bold text-foreground md:text-5xl">
              {p.title1} <span className="text-section-accent">{p.title2}</span>
            </Heading>
            <p className="max-w-2xl text-lg text-muted-foreground">{p.subtitle}</p>
          </div>
          <Link href={quoteHref} className={cn(primaryGradientInteractiveClassName, ctaPillClassName, "gap-2")}>
            {p.cta}
            <IconCircleArrowRightFilled className="size-5" aria-hidden />
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
          {/* Category card - a horizontal chip row below lg. */}
          <nav
            aria-label={p.categoriesLabel}
            className="rounded-3xl border border-card-border bg-card p-3 shadow-elevated-soft lg:sticky lg:top-28 lg:self-start lg:p-4"
          >
            <p className="mb-3 hidden px-2 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground/70 lg:block">
              {p.categoriesLabel}
            </p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {filters.map((key) => {
                const Icon = CATEGORY_ICONS[key];
                const isActive = key === active;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActive(key)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-4 text-left transition-[background-color,color,box-shadow,transform] duration-200 ease-out lg:w-full lg:rounded-2xl",
                      isActive
                        ? "bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-primary-foreground shadow-[0_8px_22px_var(--primary-elevated-shadow)]"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wide sm:text-[0.8rem]">
                      {p.categories[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Floating cards - two per row on desktop, revealed on scroll. */}
          <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
            {visible.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
