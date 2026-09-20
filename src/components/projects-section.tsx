"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  IconBoxMultipleFilled,
  IconCodeCircleFilled,
  IconHome2Filled,
  IconLayoutGridFilled,
  IconPaletteFilled,
  IconSparklesFilled,
  IconTagFilled,
} from "@tabler/icons-react";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { useLanguage } from "@/lib/i18n/language-context";
import { PartnerLogo } from "@/components/partner-logo";
import { PARTNERS } from "@/lib/partners";
import { bunnyMp4Url, bunnyThumbnailUrl, type BunnyVideo } from "@/lib/bunny-stream";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import { projectDisplayFont } from "@/lib/project-fonts";
import { PROJECTS, type Project, type ProjectCategoryKey } from "@/lib/projects";
import { projectPath } from "@/lib/routes";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

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

/** Background-player URL: muted autoplay loop with all in-player chrome suppressed. */
export function backgroundEmbedSrc(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0`;
}

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
 * The card's film: the clip's poster, and its MP4 rendition from the pull
 * zone in a native `<video>` (cover-fit, muted, looping) that plays only
 * while `playing` - the hovered card on a fine pointer, the card mostly on
 * screen on a coarse one - and is paused and rewound otherwise, so one film
 * runs at a time. Reduced motion never plays it (the poster stays).
 */
function ProjectRowMedia({ clip, playing }: { clip: BunnyVideo; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) {
      void video.play().catch(() => {});
    } else {
      video.pause();
      if (video.currentTime > 0) video.currentTime = 0;
    }
  }, [playing]);
  return (
    <video
      ref={ref}
      className="absolute inset-0 size-full object-cover"
      src={bunnyMp4Url(clip)}
      poster={bunnyThumbnailUrl(clip)}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    />
  );
}

/**
 * A case study as a row: the film in a rounded frame on one side (playing
 * while the row is hovered - or, on a coarse pointer, while it is mostly on
 * screen), and on the other the client's mark (big), the headline - clean
 * and large, in the brand's own display face, the one its home showcase
 * headline wears -, the description and the site's CTA pill; `flip` puts the
 * film on the right and the copy, right-aligned, on the left. On phones the
 * mark leads the stack, the full width of the screen, then the film, then the
 * copy (the mark is rendered twice, one per layout - one of the two is always
 * `display: none`). Reveals on scroll.
 */
export function ProjectRow({ project, index, flip = index % 2 === 1 }: { project: Project; index: number; flip?: boolean }) {
  const { t, language } = useLanguage();
  const p = t.projects;
  const copy = p.items[project.id];
  const partner = PARTNERS.find((candidate) => candidate.id === project.partnerId);
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // A fine pointer plays the row it hovers (or focuses); a coarse one the row that is mostly on screen.
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [hover, setHover] = useState(false);
  const onScreen = useInView(ref, { amount: 0.55 });
  const playing = !reduceMotion && (fine ? hover : onScreen);

  return (
    <motion.article
      ref={ref}
      // Rises into place as it scrolls in. Skipped under reduced motion (the server-rendered state is the final one).
      initial={reduceMotion ? false : { opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: reduceMotion ? 0 : 0.25 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: EASE }}
      className="grid items-center gap-7 sm:gap-9 lg:grid-cols-2 lg:gap-14 xl:gap-20"
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setHover(true);
      }}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      {/* The mark on phones: on top, the full width of the screen (from lg it sits in the copy column instead). */}
      {partner ? (
        <div className="lg:hidden">
          <PartnerLogo p={partner} imgClass="h-auto w-full" sizes="100vw" />
        </div>
      ) : null}

      {/* The film - a shadow in the logo's colour around the frame (`Project.glow`). */}
      <div
        className={cn("group relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] bg-card-elevated ring-1 ring-black/5 dark:ring-white/10", flip && "lg:order-2")}
        style={{ boxShadow: `0 28px 70px -16px color-mix(in srgb, ${project.glow} 62%, transparent), 0 10px 30px -10px color-mix(in srgb, ${project.glow} 45%, transparent)` }}
      >
        {project.clip ? (
          <ProjectRowMedia clip={project.clip} playing={playing} />
        ) : (
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <ProjectThumbnail project={project} alt={copy.name} sizes="(max-width: 1023px) 100vw, 50vw" />
          </div>
        )}
      </div>

      {/* The copy: the mark (from lg), the headline in the brand's display face, the description, the CTA -
          right-aligned on a row whose film is on the right, so the copy reads toward it. */}
      <div className={cn("flex min-w-0 flex-col items-start lg:px-2", flip && "lg:order-1 lg:items-end lg:text-right")}>
        {partner ? (
          <div className="hidden lg:block">
            <PartnerLogo p={partner} imgClass="h-28 w-auto max-w-full object-contain xl:h-32" sizes="480px" />
          </div>
        ) : null}
        <h3
          className={cn(
            "font-heading text-2xl font-bold tracking-tight text-balance text-foreground sm:text-[1.75rem] lg:mt-7 lg:text-[2.25rem] xl:text-[2.625rem] 2xl:text-[3rem]",
            projectDisplayFont(project.id),
            "leading-[1.04]"
          )}
        >
          {copy.headline}
        </h3>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-lg lg:mt-5 lg:text-xl">{copy.description}</p>
        <ButtonWithIcon href={projectPath(language, project.id)} surface="auto" className="mt-6 lg:mt-8">
          {p.viewProject}
        </ButtonWithIcon>
      </div>
    </motion.article>
  );
}

/**
 * Case-study list (`/projects`): title + quote CTA on top and every project
 * in `PROJECTS` (all of them have a case study) as a row - the film on one
 * side, the copy on the other, the sides alternating down the page. The
 * category menu that used to sit on the left is gone.
 */
export function ProjectsSection({
  variant = "page",
  className,
}: {
  /** `page` renders the `h1` (one per page); anything else an `h2`. */
  variant?: "home" | "page";
  className?: string;
}) {
  const { t } = useLanguage();
  const p = t.projects;
  const Heading = variant === "page" ? "h1" : "h2";

  return (
    <section id="projects" className={cn("relative w-full pb-4", className)}>
      <div className="relative z-10 mx-auto w-full max-w-none px-4 lg:px-8">
        <header className="mb-10 lg:mb-14">
          <Heading className="mb-4 font-heading text-4xl font-bold text-foreground md:text-5xl">
            {p.title1} <span className="text-section-accent">{p.title2}</span>
          </Heading>
          <p className="max-w-2xl text-lg text-muted-foreground">{p.subtitle}</p>
          {/* The site's main CTA, as everywhere else, under the line - down to the page's own service cards (the
              wizard, `#quote`). */}
          <ButtonWithIcon href="#quote" surface="auto" className="mt-6">
            {p.cta}
          </ButtonWithIcon>
        </header>

        {/* The rows, the film's side alternating, well apart, revealed on scroll. */}
        <div className="flex min-w-0 flex-col gap-24 sm:gap-28 lg:gap-40">
          {PROJECTS.map((project, index) => (
            <ProjectRow key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
