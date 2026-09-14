"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useSpring } from "motion/react";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { QuoteFormSection } from "@/components/quote-form/quote-form-section";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { ctaPillClassName } from "@/components/ui/button";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { bunnyPlayerEmbedSrc } from "@/lib/bunny-stream";
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

export const stagger = (step = 0.1, delay = 0.05) => ({
  hidden: {},
  visible: { transition: { staggerChildren: step, delayChildren: delay } },
});
export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

/** A block that fades up once when scrolled into view. */
export function Reveal({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ hidden: fadeUp.hidden, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay } } }}
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
 * paints behind the story (Boleron's gradient) - the quote wizard and footer
 * always sit on the normal page ground after it.
 */
export function StoryShell({ style, accent, ground, children }: { style: CSSProperties; accent: string; ground?: ReactNode; children: ReactNode }) {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>
      <SiteHeader />
      <ProgressLine accent={accent} />
      <article className="relative z-10 flex w-full flex-1 flex-col">
        <div className="relative text-foreground" style={style}>
          {ground}
          <div className="relative z-[1] mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6 lg:px-8 lg:pt-32">
            <PageBreadcrumbs className="mb-6" />
          </div>
          {children}
        </div>
        {/* Same multi-step quote wizard as the home page. */}
        <QuoteFormSection className="mt-6" />
      </article>
      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
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
      <div className={cn("relative z-[1] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", inner)}>{children}</div>
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

/** Heading text that rises word by word from under an invisible line (once, when scrolled into view). */
export function Words({ text, base = 0, step = 0.04 }: { text: string; base?: number; step?: number }) {
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
              viewport={VIEWPORT}
              transition={{ duration: 0.95, ease: [0.2, 0.9, 0.25, 1], delay: base + i * step }}
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
  return (
    <Tag
      className={cn(
        "font-heading text-balance",
        tone === "light" ? "font-extralight uppercase leading-[1.12] tracking-[0.01em]" : "font-bold leading-[1.06] tracking-tight",
        className
      )}
    >
      <Words text={text} base={base} />
    </Tag>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("max-w-[62ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl", className)}>{children}</p>;
}
export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-4 text-[var(--story-muted)] last:mb-0", className)}>{children}</p>;
}
/** Bigger running copy for the two-column text blocks (challenge / solution). */
export function BodyXL({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl [&>p+p]:mt-5">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

/** Two columns from lg: a (sticky) heading column and the copy. */
export function Split({ left, right, sticky = true, ratio = "0.9/1.1" }: { left: ReactNode; right: ReactNode; sticky?: boolean; ratio?: "0.9/1.1" | "1/2" }) {
  return (
    <motion.div
      className={cn(
        "grid items-start gap-9 lg:gap-20",
        ratio === "1/2" ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      )}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeUp}
    >
      <div className={cn(sticky && "lg:sticky lg:top-28")}>{left}</div>
      <div>{right}</div>
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
          <dd className="font-heading text-[clamp(3rem,5.5vw,5.5rem)] font-bold leading-none tracking-tight whitespace-nowrap">
            {stat.num}
            {stat.suffix ? <span className="text-[0.45em] font-semibold">{stat.suffix}</span> : null}
          </dd>
          <dt className="mt-3.5 max-w-[22ch] text-base leading-snug text-[var(--story-muted)] sm:text-lg">{stat.label}</dt>
        </motion.div>
      ))}
    </motion.dl>
  );
}

/** Small label / value list under a film's copy (format · length · channel …). */
export function MetaList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="mt-8 grid grid-cols-3 gap-5 border-t border-[var(--story-line)] pt-6">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--story-muted)]">{item.label}</dt>
          <dd className="mt-1.5 text-base font-medium sm:text-lg">{item.value}</dd>
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
 * `tone` says what the band sits on so the pills read (`light` = a pale card,
 * `dark` = a dark or coloured card, `page` = the plain card surface); the
 * container look itself comes from `className`. `center` stacks everything
 * centred (Emblema's full band) instead of title-left / pills-right.
 */
export function CtaBand({
  title,
  quote,
  contact,
  tone,
  className,
  center = false,
  eyebrow,
  lead,
  children,
}: {
  title: string;
  quote: string;
  contact: string;
  tone: "light" | "dark" | "page";
  className?: string;
  center?: boolean;
  /** Above / below the title (Emblema's eyebrow and lead). */
  eyebrow?: ReactNode;
  lead?: ReactNode;
  /** Extra layers (a background) - rendered first. */
  children?: ReactNode;
}) {
  const { language } = useLanguage();
  const outline = {
    light: "border-[#1b1b2e]/25 text-[#1b1b2e] hover:border-[#1b1b2e] hover:bg-[#1b1b2e]/[0.04]",
    dark: "border-white/30 text-white hover:border-white hover:bg-white/10",
    page: "border-card-border text-foreground hover:bg-muted/60",
  }[tone];
  return (
    <Reveal
      className={cn(
        "relative flex flex-col gap-7",
        center ? "items-center text-center" : "items-start sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {children}
      <div className={cn(!center && "min-w-0 flex-1 sm:max-w-[30ch] lg:max-w-[36ch]")}>
        {eyebrow}
        <h2 className={cn("font-heading font-bold leading-tight text-balance", center ? "mx-auto max-w-[20ch] text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl lg:text-[2.35rem]")}>
          {center ? <Words text={title} /> : title}
        </h2>
        {lead}
      </div>
      <div className={cn("flex shrink-0 flex-wrap items-center gap-3.5", center && "justify-center")}>
        <ButtonWithIcon href="#quote" surface={tone === "light" ? "dark" : tone === "dark" ? "light" : "auto"}>
          {quote}
        </ButtonWithIcon>
        <Link href={contactProcessPath(language)} className={cn(ctaPillClassName, "border transition-colors duration-200", outline)}>
          {contact}
        </Link>
      </div>
    </Reveal>
  );
}
