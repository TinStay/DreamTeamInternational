"use client";

import { Fragment, createContext, useContext, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { IconPlayerPlayFilled, IconX } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { QuoteFormSection } from "@/components/quote-form/quote-form-section";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { ctaPillClassName } from "@/components/ui/button";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmbedCover } from "@/components/projects/showcase-primitives";
import { bunnyBackgroundEmbedSrc, bunnyPlayerEmbedSrc, bunnyThumbnailUrl, type BunnyVideo } from "@/lib/bunny-stream";
import { useLanguage } from "@/lib/i18n/language-context";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import type { StoryClip } from "@/lib/projects";
import { contactProcessPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_REFERRER_POLICY } from "@/lib/youtube-embeds";

/*
 * The shared kit behind the long-form case studies ("stories") - every story
 * page is its own brand world (palette, surfaces, section order), built from
 * these: the page shell (header, reading progress, breadcrumbs, the quote
 * wizard and footer after the story), sections, eyebrows, headings that rise
 * word by word, facts / stats / meta strips, the expanding collage, media
 * frames (self-hosted mp4, YouTube, Bunny, or a branded placeholder) and the
 * white CTA card. Everything reveals once, on the way down (`VIEWPORT`), and
 * never plays backwards.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;
export const VIEWPORT = { once: true, margin: "0px 0px -8% 0px" } as const;
/**
 * The story pages' container: the usual 80rem on laptops, 80% of the screen on anything wider (never narrower than
 * the 80rem it replaces, and always inside the viewport), full width with padding on phones.
 */
export const STORY_CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:max-w-[min(calc(100%-3rem),max(80vw,76rem))] lg:px-0";

export const stagger = (step = 0.1, delay = 0.05) => ({
  hidden: {},
  visible: { transition: { staggerChildren: step, delayChildren: delay } },
});
export const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};
/** `fadeUp` starting `delay` seconds late - the copy under a heading, so the title is always read first. */
export const fadeUpAfter = (delay: number) => ({
  hidden: fadeUp.hidden,
  visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay } },
});
/** How long the copy waits for its heading (the heading's words are up within this). */
export const COPY_DELAY = 0.25;
/** A frame (or card) rising and settling into place as it scrolls in. */
export const frameIn = {
  hidden: { opacity: 0, y: 48, scale: 0.975 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.1, ease: EASE } },
};
/**
 * The hero title, sized for the phone and the laptop alike (a fluid clamp - about 2rem on a phone, 3.5rem on a
 * 1366px laptop, 4.5rem on a full-HD monitor): `long` for a title that is a whole sentence (Boleron, OSMO),
 * `short` for three or four words (Plasico, MindGuard), `light` for Emblema's airy uppercase lines.
 */
export const HERO_TITLE = {
  long: "text-[clamp(2rem,1.25rem+2.6vw,5rem)]",
  short: "text-[clamp(2.5rem,1.5rem+4vw,7rem)]",
  light: "text-[clamp(1.75rem,1rem+2.9vw,5rem)]",
} as const;

/**
 * A block that drifts a little against the scroll while it crosses the viewport (`amount` px up over the pass) -
 * the media of an alternating section, so the page reads as layered. Still under reduced motion.
 */
export function Drift({ amount = 28, className, children }: { amount?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  return (
    <motion.div ref={ref} className={className} style={reduceMotion ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/** A block that fades up once when scrolled into view. */
export function Reveal({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeUpAfter(delay)}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ shell */

/**
 * The story page: the site chrome around the story's own world. `style` sets
 * the story's CSS tokens on the story block only (`--story-accent`,
 * `--story-muted`, `--story-line` … even `--foreground` for a story that is
 * a colour world), `accent` colours the reading-progress line, `ground`
 * paints behind the story AND the quote wizard after it, down to the footer -
 * every story has its own, in both themes: a solid in the client's colours
 * set as `--story-ground` on `className` (light, and the `dark:` variant) and
 * painted by the ground, or Boleron's gradient. The wizard keeps the site's
 * own tokens (its cards and fields follow the theme); a colour world hands
 * `wizardHeading` white ink tokens for its heading alone. The ground runs
 * right down to the footer - the footer's top margin is the article's bottom
 * padding here - and the footer sits on the normal page ground. `theme`
 * locks the whole block - story, breadcrumbs and wizard - to one theme
 * whatever the visitor's (`theme-light` / `theme-dark`, see `globals.css`);
 * the header and the footer around it keep the site's theme.
 */
/**
 * The story's display face (see `PROJECT_DISPLAY_FONT`): `Display` headings and the CTA band's title read it from
 * here; the hero title and the stories' own title consts take the same classes directly.
 */
const StoryDisplayContext = createContext<string | undefined>(undefined);
export function useStoryDisplay() {
  return useContext(StoryDisplayContext);
}

export function StoryShell({
  style,
  accent,
  ground,
  className,
  wizardHeading,
  display,
  theme,
  font,
  wizard = true,
  children,
}: {
  style: CSSProperties;
  accent: string;
  ground?: ReactNode;
  className?: string;
  wizardHeading?: string;
  /** The brand's display face for the large letters (`PROJECT_DISPLAY_FONT[id]`). */
  display?: string;
  /** Lock the block to one theme (the client's colours whatever the visitor's theme); unset = follows the theme. */
  theme?: "light" | "dark";
  /** Classes for the story block alone (not the wizard) - OSMO's page runs in Manrope, body and headings. */
  font?: string;
  /** The quote wizard after the story (on by default); MindGuard's page ends on its own CTA instead. */
  wizard?: boolean;
  children: ReactNode;
}) {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>
      <SiteHeader />
      <ProgressLine accent={accent} />
      <article className={cn("relative z-10 flex w-full flex-1 flex-col pb-20", theme === "light" && "theme-light", theme === "dark" && "theme-dark", className)}>
        {ground}
        <div className={cn("relative text-foreground", font)} style={style}>
          <div className={cn("relative z-[1] pt-24 lg:pt-32", STORY_CONTAINER)}>
            <PageBreadcrumbs className="mb-6" />
          </div>
          <StoryDisplayContext.Provider value={display}>{children}</StoryDisplayContext.Provider>
        </div>
        {/* Same multi-step quote wizard as the home page, on the story's ground. */}
        {wizard ? (
          <div className="relative z-[1]">
            <QuoteFormSection className="mt-6" headingClassName={wizardHeading} />
          </div>
        ) : null}
      </article>
      <div className="relative z-10 [&>footer]:mt-0">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}

/**
 * The client's website, up top of every case study: the logo itself is the
 * link (a new tab; the accessible name says so - `projects.visitSite` - and
 * the title carries the domain), nothing else. Without an `href` the logo
 * stands alone. `className` is the link's own box (MindGuard pulls its padded
 * mark back in line with it).
 */
export function ClientSite({ href, name, className, children }: { href?: string; name: string; className?: string; children: ReactNode }) {
  const { t } = useLanguage();
  if (!href) return <div className={cn("inline-block", className)}>{children}</div>;
  const host = new URL(href).hostname.replace(/^www\./, "");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} - ${t.projects.visitSite} (${host})`}
      title={host}
      className={cn(
        "inline-block cursor-pointer rounded-md transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
        className
      )}
    >
      {children}
    </a>
  );
}

/** Reading progress hairline at the very top of the page (under the floating header). */
export function ProgressLine({ accent }: { accent: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.4 });
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 bg-foreground/[0.07]" aria-hidden>
      <motion.div className="h-full w-full origin-left" style={{ scaleX, backgroundColor: accent }} />
    </div>
  );
}

/* --------------------------------------------------------------- layout */

export function Section({ tight = false, className, inner, children }: { tight?: boolean; className?: string; inner?: string; children: ReactNode }) {
  return (
    <section className={cn("relative", tight ? "py-16 sm:py-20 lg:py-24" : "py-20 sm:py-24 lg:py-32", className)}>
      <div className={cn("relative z-[1]", STORY_CONTAINER, inner)}>{children}</div>
    </section>
  );
}

export function Eyebrow({ children, center = false, className }: { children: ReactNode; center?: boolean; className?: string }) {
  return (
    <p
      className={cn(
        "mb-5 flex items-center gap-3.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--story-accent)]",
        center && "justify-center",
        className
      )}
    >
      {children}
      {!center ? <span className="h-px max-w-28 flex-1 bg-[var(--story-accent)] opacity-30" aria-hidden /> : null}
    </p>
  );
}

/** The words start a little *before* their heading enters the viewport (the other reveals wait until 8% in). */
const WORDS_VIEWPORT = { once: true, margin: "0px 0px 6% 0px" } as const;

/**
 * Heading text that rises word by word from under an invisible line - once, and early: it starts a little before
 * the heading enters the viewport and runs quick, so the words are in place by the time the reader reaches them.
 */
export function Words({ text, base = 0, step = 0.025 }: { text: string; base?: number; step?: number }) {
  const parts = text.split(" ");
  return (
    <>
      {parts.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "108%" }}
              whileInView={{ y: 0 }}
              viewport={WORDS_VIEWPORT}
              transition={{ duration: 0.65, ease: [0.2, 0.9, 0.25, 1], delay: base + i * step }}
            >
              {word}
            </motion.span>
          </span>
          {/* A real space, so the heading copies as text. */}
          {i < parts.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

/** Display heading in the site's heading face; `tone` = the story's weight (Emblema's airy light, or the bold default). */
export function Display({
  as: Tag = "h2",
  text,
  className,
  base,
  tone = "bold",
}: {
  as?: "h1" | "h2" | "h3";
  text: string;
  className?: string;
  base?: number;
  tone?: "bold" | "light";
}) {
  // The story's display face overrides the tone's family / weight / case; a caller's className still wins.
  const face = useStoryDisplay();
  return (
    <Tag
      className={cn(
        "font-heading text-balance",
        tone === "light" ? "font-extralight uppercase tracking-[0.01em]" : "font-bold tracking-tight",
        face,
        className,
        // After the size classes: tailwind-merge drops a leading that precedes a font-size class.
        tone === "light" ? "leading-[1.12]" : "leading-[1.06]"
      )}
    >
      <Words text={text} base={base} />
    </Tag>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("max-w-[62ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl", className)}>{children}</p>;
}
export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-4 text-[var(--story-muted)] last:mb-0 xl:text-lg", className)}>{children}</p>;
}
/** Bigger running copy for the two-column text blocks (challenge / solution). */
export function BodyXL({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl [&>p+p]:mt-5">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

/**
 * Two columns from lg: a (sticky) heading column and the copy - the heading first, the copy a beat after it.
 * `leftReveal={false}` leaves the heading column still (a story whose titles reveal themselves - Emblema's CSS
 * ones), so nothing JS-driven stands between the reader and the title.
 */
export function Split({
  left,
  right,
  sticky = true,
  ratio = "0.9/1.1",
  leftReveal = true,
}: {
  left: ReactNode;
  right: ReactNode;
  sticky?: boolean;
  ratio?: "0.9/1.1" | "1/2";
  leftReveal?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "grid items-start gap-9 lg:gap-20",
        ratio === "1/2" ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      )}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={stagger(0)}
    >
      <motion.div variants={leftReveal ? fadeUp : undefined} className={cn(sticky && "lg:sticky lg:top-28")}>
        {left}
      </motion.div>
      <motion.div variants={fadeUpAfter(COPY_DELAY)}>{right}</motion.div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- strips */

/** The facts strip under a hero: label / value pairs between two hairlines (values may run several lines). */
export function FactsStrip({ facts, columns = 4 }: { facts: { label: string; value: string[] }[]; columns?: 4 | 5 }) {
  return (
    <motion.dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-8 border-y border-[var(--story-line)] py-9 md:grid-cols-3",
        columns === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
      )}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={stagger(0.08)}
    >
      {facts.map((fact) => (
        <motion.div key={fact.label} variants={fadeUp}>
          <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--story-accent)]">{fact.label}</dt>
          <dd className="mt-2.5 text-base leading-snug sm:text-lg">
            {fact.value.map((line, i) => (
              <span key={line} className={cn("block", i > 0 && "mt-0.5")}>
                {line}
              </span>
            ))}
          </dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}

/** Big numbers with a coloured rule (results). */
export function StatGrid({
  stats,
  rule = "left",
  columns = 3,
  className,
}: {
  stats: { num: string; suffix: string; label: string }[];
  rule?: "left" | "top";
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <motion.dl
      className={cn("grid grid-cols-2 gap-x-8 gap-y-12", columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3", className)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={stagger(0.12)}
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={fadeUp}
          className={cn(rule === "left" ? "border-l-2 border-[var(--story-rule)] pl-6" : "border-t-[3px] border-[var(--story-rule)] pt-5")}
        >
          <dd className="font-heading text-[clamp(3rem,6vw,7rem)] font-bold leading-none tracking-tight whitespace-nowrap">
            {stat.num}
            {stat.suffix ? <span className="text-[0.45em] font-semibold">{stat.suffix}</span> : null}
          </dd>
          <dt className="mt-3.5 max-w-[22ch] text-base leading-snug text-[var(--story-muted)] sm:text-lg">{stat.label}</dt>
        </motion.div>
      ))}
    </motion.dl>
  );
}

/** Label / value list under a film's copy (format · length · channel …); a value may be a node (a channel's mark). */
export function MetaList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="mt-9 grid grid-cols-3 gap-6 border-t border-[var(--story-line)] pt-7">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--story-muted)] sm:text-xs">{item.label}</dt>
          <dd className="mt-2.5 text-lg font-semibold leading-snug sm:text-xl xl:text-2xl">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------- collage */

/**
 * A row of skewed image panels that share the width; the hovered one opens
 * up (flex transition) and shows its label. Stacked, unskewed, on phones.
 */
export function Collage({ panels, labelClass, shade }: { panels: { src: string; label: string }[]; labelClass: string; shade: string }) {
  return (
    <motion.div
      className="flex h-auto w-full flex-col md:h-[min(74vh,660px)] md:flex-row"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={stagger(0.08)}
    >
      {panels.map((panel, i) => (
        <motion.figure
          key={panel.src}
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } }}
          className={cn(
            "group relative m-0 h-[42vh] w-full overflow-hidden transition-[flex] duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] md:h-auto md:flex-1 md:hover:flex-[2.2]",
            // Skewed edges from md, overlapping so the seams close; the first / last keep a straight outer edge.
            i > 0 && "md:-ml-[4%]",
            i === 0
              ? "md:[clip-path:polygon(0_0,100%_0,94%_100%,0_100%)]"
              : i === panels.length - 1
                ? "md:[clip-path:polygon(6%_0,100%_0,100%_100%,0_100%)]"
                : "md:[clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]"
          )}
        >
          <Image src={panel.src} alt={panel.label} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: shade }} aria-hidden />
          <figcaption className="absolute inset-x-0 bottom-8 text-center opacity-100 transition-[opacity,transform] duration-500 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            <span className={cn("inline-block rounded-full px-5 py-2 text-sm font-semibold tracking-[0.08em]", labelClass)}>{panel.label}</span>
          </figcaption>
        </motion.figure>
      ))}
    </motion.div>
  );
}

/**
 * The collage for clips: a row of skewed panels that share the width, one
 * per clip, each showing its poster (the Bunny pull zone's thumbnail); the
 * hovered one opens up (flex transition) and plays its clip muted, and a
 * click opens the full player in a lightbox. Below md the panels stack as a
 * two-up grid of posters (no hover) that open the lightbox.
 */
export function ClipCollage({
  panels,
  labelClass,
  shade,
  closeLabel,
}: {
  panels: { clip: BunnyVideo; title: string; note?: string }[];
  labelClass: string;
  shade: string;
  closeLabel: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  return (
    <>
      <motion.div
        className="grid grid-cols-2 gap-3 md:flex md:h-[min(74vh,660px)] md:gap-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        variants={stagger(0.06)}
      >
        {panels.map((panel, i) => (
          <motion.figure
            key={panel.clip.id}
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } }}
            className={cn(
              "group relative m-0 aspect-video overflow-hidden rounded-2xl bg-black md:aspect-auto md:h-auto md:flex-1 md:rounded-none md:transition-[flex] md:duration-[1100ms] md:ease-[cubic-bezier(.22,1,.36,1)] md:hover:flex-[2.6]",
              // Skewed edges from md, overlapping so the seams close; the first / last keep a straight outer edge.
              i > 0 && "md:-ml-[3%]",
              i === 0
                ? "md:[clip-path:polygon(0_0,100%_0,95%_100%,0_100%)]"
                : i === panels.length - 1
                  ? "md:[clip-path:polygon(5%_0,100%_0,100%_100%,0_100%)]"
                  : "md:[clip-path:polygon(5%_0,100%_0,95%_100%,0_100%)]"
            )}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((current) => (current === i ? null : current))}
          >
            {/* The poster - a plain img: the pull zone serves it only with the site as referrer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bunnyThumbnailUrl(panel.clip)}
              alt=""
              referrerPolicy="origin"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            {/* The hovered panel plays its clip muted (cover-fit; the player is 16:9, the panel always narrower). */}
            {hovered === i && !reduceMotion ? (
              <EmbedCover src={bunnyBackgroundEmbedSrc(panel.clip)} orientation="wide" boxAspect={1} className="hidden md:block" />
            ) : null}
            <div className="pointer-events-none absolute inset-0" style={{ background: shade }} aria-hidden />
            {/* The whole panel opens the lightbox. */}
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="absolute inset-0 z-[1] flex cursor-pointer items-center justify-center text-white outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-label={panel.title}
            >
              <PlayRing className="border-white/50 text-white opacity-90 transition-[opacity,transform] duration-300 group-hover:scale-105 md:opacity-0 md:group-hover:opacity-100" />
            </button>
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-5 z-[2] flex flex-col items-center gap-1.5 px-3 text-center opacity-100 transition-[opacity,transform] duration-500 md:bottom-8 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
              <span className={cn("inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.06em] sm:text-sm", labelClass)}>{panel.title}</span>
              {panel.note ? <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">{panel.note}</span> : null}
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
      <ClipLightbox panel={open === null ? null : panels[open]} closeLabel={closeLabel} onClose={() => setOpen(null)} />
    </>
  );
}

/** The full Bunny player over the page (Escape / the backdrop / the X close it; the page stops scrolling under it). */
export function ClipLightbox({
  panel,
  closeLabel,
  onClose,
}: {
  panel: { clip: BunnyVideo; title: string } | null;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={panel !== null} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(96vw,72rem)] max-w-none gap-0 rounded-2xl border-0 bg-black p-0 ring-white/15 sm:max-w-none"
      >
        {panel ? (
          <>
            <DialogTitle className="sr-only">{panel.title}</DialogTitle>
            {/* First in the DOM, so the dialog's initial focus lands here and Escape reaches the page - a focused
                player iframe would swallow it (the X and the backdrop always work). */}
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-3 -right-3 z-[1] grid size-11 cursor-pointer place-items-center rounded-full bg-white text-neutral-900 shadow-lg transition-transform duration-200 ease-out hover:scale-105 sm:-top-4 sm:-right-4"
              aria-label={closeLabel}
            >
              <IconX className="size-5" aria-hidden />
            </button>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={bunnyPlayerEmbedSrc(panel.clip, { autoplay: true })}
                title={panel.title}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- media */

/** The play ring used on placeholders. */
export function PlayRing({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-16 place-items-center rounded-full border bg-black/20 backdrop-blur-[2px] sm:size-20", className)} aria-hidden>
      <IconPlayerPlayFilled className="ml-1 size-5 sm:size-6" />
    </span>
  );
}

/** A branded "coming soon" frame for a clip that is not published yet. */
export function ClipPlaceholder({ label, className, ringClass }: { label: string; className?: string; ringClass?: string }) {
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-5 text-center", className)}>
      <PlayRing className={ringClass} />
      <p className="text-[10px] font-bold uppercase tracking-[0.28em]">{label}</p>
    </div>
  );
}

/**
 * A film frame: a self-hosted mp4 (`src` + `poster`, native controls, only
 * metadata up front), a YouTube / Bunny embed, or the branded placeholder.
 * `aspect` is a Tailwind aspect class; the frame keeps its own surface.
 */
export function MediaFrame({
  clip,
  src,
  poster,
  title,
  aspect,
  placeholder,
  className,
  placeholderClass,
  ringClass,
}: {
  clip?: StoryClip | null;
  src?: string;
  poster?: string;
  title: string;
  aspect: string;
  placeholder: string;
  className?: string;
  placeholderClass?: string;
  ringClass?: string;
}) {
  const frame = cn("relative w-full overflow-hidden", aspect, className);
  if (src) {
    return (
      <div className={frame}>
        <video className="absolute inset-0 h-full w-full object-cover" controls playsInline preload="metadata" poster={poster} src={src} title={title} />
      </div>
    );
  }
  if (clip && "youtube" in clip) {
    return (
      <div className={frame}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${clip.youtube}?rel=0`}
          title={title}
          allow={YOUTUBE_IFRAME_ALLOW}
          allowFullScreen
          loading="lazy"
          referrerPolicy={YOUTUBE_REFERRER_POLICY}
        />
      </div>
    );
  }
  if (clip && "bunny" in clip) {
    return (
      <div className={frame}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={bunnyPlayerEmbedSrc(clip.bunny)}
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className={frame}>
      <ClipPlaceholder label={placeholder} className={placeholderClass} ringClass={ringClass} />
    </div>
  );
}

/* ------------------------------------------------------------------ cta */

/**
 * The band every case study ends on: a title and the two ways in - the quote
 * pill (scrolls to the wizard below) and a contact pill (the contact page).
 * A banner: the title runs wide on the left (its own width cap, so it never
 * folds into a narrow column) with the pills beside it on desktop, everything
 * stacked on phones; `center` stacks it all centred instead (Emblema's full
 * band). `tone` says what the band sits on so the pills read (`light` = a
 * pale card, `dark` = a dark or coloured card, `page` = the plain card
 * surface); the container look and each project's dressing come from
 * `className` and `children` (decoration layers, rendered first and kept
 * behind the copy - absolutely positioned, clipped to the rounded band).
 * `animate="rise"` makes the card rise and settle into place with the copy
 * and the pills staggering in after it; `words` brings the title in word by
 * word in the banner layout too (the centred one always does).
 */
export function CtaBand({
  title,
  quote,
  contact,
  tone,
  className,
  center = false,
  animate = "fade",
  words = false,
  eyebrow,
  lead,
  titleNode,
  children,
}: {
  title: string;
  quote: string;
  contact: string;
  tone: "light" | "dark" | "page";
  className?: string;
  center?: boolean;
  animate?: "fade" | "rise";
  words?: boolean;
  /** Above / below the title (Emblema's eyebrow and lead). */
  eyebrow?: ReactNode;
  lead?: ReactNode;
  /** The title rendered by the story itself (Emblema's CSS-revealed lines) in place of the string / `Words`. */
  titleNode?: ReactNode;
  /** Decoration layers (backgrounds, marks) - rendered first, behind the copy. */
  children?: ReactNode;
}) {
  const { language } = useLanguage();
  const face = useStoryDisplay();
  const rise = animate === "rise";
  // The rising card staggers its copy block and its pills (both `fadeUp` children); the fading one moves as a whole.
  const card = rise
    ? { hidden: frameIn.hidden, visible: { ...frameIn.visible, transition: { ...frameIn.visible.transition, staggerChildren: 0.12, delayChildren: 0.2 } } }
    : fadeUp;
  const part = rise ? fadeUp : undefined;
  // `page`: the card's own ink (currentColor), so a theme-adaptive card can flip its text with `dark:`.
  const outline = {
    light: "border-[#1b1b2e]/25 text-[#1b1b2e] hover:border-[#1b1b2e] hover:bg-[#1b1b2e]/[0.04]",
    dark: "border-white/30 text-white hover:border-white hover:bg-white/10",
    page: "border-[color:color-mix(in_srgb,currentColor_30%,transparent)] hover:border-current hover:bg-[color:color-mix(in_srgb,currentColor_7%,transparent)]",
  }[tone];
  return (
    <motion.div
      className={cn(
        "relative isolate overflow-hidden",
        center
          ? "flex flex-col items-center gap-7 text-center"
          : "flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-14",
        className
      )}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={card}
    >
      {children}
      <motion.div variants={part} className={cn("relative z-[1] min-w-0", center && "flex flex-col items-center")}>
        {eyebrow}
        <h2
          className={cn(
            "font-heading font-bold text-balance",
            face,
            center
              ? "mx-auto max-w-[20ch] text-3xl sm:text-4xl lg:text-5xl xl:text-6xl"
              : "max-w-[22ch] text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl 2xl:text-6xl",
            "leading-[1.08]"
          )}
        >
          {titleNode ?? (center || words ? <Words text={title} base={rise ? 0.25 : 0} /> : title)}
        </h2>
        {lead}
      </motion.div>
      <motion.div variants={part} className={cn("relative z-[1] flex flex-wrap items-center gap-3.5", center ? "justify-center" : "lg:justify-end")}>
        <ButtonWithIcon href="#quote" surface={tone === "light" ? "dark" : tone === "dark" ? "light" : "auto"}>
          {quote}
        </ButtonWithIcon>
        <Link href={contactProcessPath(language)} className={cn(ctaPillClassName, "border transition-colors duration-200", outline)}>
          {contact}
        </Link>
      </motion.div>
    </motion.div>
  );
}
