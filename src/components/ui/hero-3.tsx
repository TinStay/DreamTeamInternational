"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { IconArrowRight } from "@tabler/icons-react";
import { ctaPillClassName, primaryGradientInteractiveClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MarqueeHeroImage = {
  src: string;
  alt: string;
  /** Optional link target — the whole card becomes the link. */
  href?: string;
  /** Card aspect ratio: 16:9 (default) or 9:16. */
  orientation?: "wide" | "tall";
};

export type AnimatedMarqueeHeroProps = {
  tagline?: string;
  title: React.ReactNode;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  images: MarqueeHeroImage[];
  /** Semantic level of the title — `h2` when used as a home-page section. */
  titleAs?: "h1" | "h2";
  /** Seconds for one marquee loop of the first row (the second runs slightly slower). */
  duration?: number;
  className?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

// Card heights per breakpoint drive the `sizes` hints (width = height × aspect).
const WIDE_SIZES = "(max-width: 640px) 284px, (max-width: 768px) 341px, 370px";
const TALL_SIZES = "(max-width: 640px) 90px, (max-width: 768px) 108px, 117px";

function MarqueeCard({ image }: { image: MarqueeHeroImage }) {
  const tall = image.orientation === "tall";
  const className = cn(
    "group relative block h-40 shrink-0 overflow-hidden rounded-2xl border border-card-border bg-card-elevated shadow-md sm:h-48 md:h-52",
    tall ? "aspect-[9/16]" : "aspect-video",
    image.href && "cursor-pointer"
  );
  const picture = (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={tall ? TALL_SIZES : WIDE_SIZES}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
    />
  );

  return image.href ? (
    <Link href={image.href} className={className} aria-label={image.alt}>
      {picture}
    </Link>
  ) : (
    <div className={className}>{picture}</div>
  );
}

function MarqueeRow({
  images,
  duration,
  reverse = false,
}: {
  images: MarqueeHeroImage[];
  duration: number;
  reverse?: boolean;
}) {
  if (images.length === 0) return null;

  // Rendered twice so `translateX(-50%)` loops seamlessly (see `marquee-x`).
  const half = (hidden = false) => (
    <div className="flex shrink-0 items-center gap-4 pr-4 md:gap-5 md:pr-5" aria-hidden={hidden || undefined}>
      {images.map((image, index) => (
        <MarqueeCard key={`${image.src}-${index}`} image={image} />
      ))}
    </div>
  );

  return (
    <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className="flex animate-marquee-x will-change-transform hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]"
        style={
          {
            "--marquee-duration": `${duration}s`,
            animationDirection: reverse ? "reverse" : undefined,
          } as React.CSSProperties
        }
      >
        {half()}
        {half(true)}
      </div>
    </div>
  );
}

/**
 * Centered headline block with a two-row image marquee underneath (rows scroll in
 * opposite directions and pause on hover). Images alternate between the rows.
 */
export function AnimatedMarqueeHero({
  tagline,
  title,
  description,
  ctaText,
  ctaHref,
  images,
  titleAs = "h2",
  duration = 120,
  className,
}: AnimatedMarqueeHeroProps) {
  const MotionTitle = titleAs === "h1" ? motion.h1 : motion.h2;

  const [rowA, rowB] = React.useMemo(() => {
    const a: MarqueeHeroImage[] = [];
    const b: MarqueeHeroImage[] = [];
    images.forEach((image, index) => (index % 2 === 0 ? a : b).push(image));
    return [a, b];
  }, [images]);

  return (
    <div className={cn("relative flex w-full flex-col items-center", className)}>
      <motion.div
        className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        {tagline ? (
          <motion.span
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-card-border bg-card-elevated px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-primary-gradient" aria-hidden />
            {tagline}
          </motion.span>
        ) : null}

        <MotionTitle
          variants={fadeUp}
          className="font-heading text-4xl font-bold leading-[1.06] tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl"
        >
          {title}
        </MotionTitle>

        {description ? (
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {description}
          </motion.p>
        ) : null}

        {ctaText && ctaHref ? (
          <motion.div variants={fadeUp} className="mt-8">
            <Link href={ctaHref} className={cn(primaryGradientInteractiveClassName, ctaPillClassName, "gap-2")}>
              {ctaText}
              <IconArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
          </motion.div>
        ) : null}
      </motion.div>

      <div className="mt-10 flex w-full flex-col gap-4 sm:mt-12 md:gap-5">
        <MarqueeRow images={rowA} duration={duration} />
        <MarqueeRow images={rowB} duration={duration * 1.15} reverse />
      </div>
    </div>
  );
}
