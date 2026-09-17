"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { useMediaQuery } from "@/lib/use-media-query";
import { PARTNERS } from "@/lib/partners";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  ClipCollage,
  CtaBand,
  Display,
  Drift,
  Eyebrow,
  FactsStrip,
  HERO_TITLE,
  MediaFrame,
  MetaList,
  STORY_CONTAINER,
  Section,
  StatGrid,
  StoryShell,
  VIEWPORT,
  Words,
  fadeUp,
  frameIn,
  stagger,
} from "./primitives";

/*
 * Boleron's story - the whole page is the client's world: the blue → violet
 * gradient (a deeper cut of it in the dark theme) with white type. Roni, the
 * mascot, stands in the hero as a composited clip (colour + matte, drawn on a
 * canvas so he floats over the gradient with no box) that tilts toward the
 * pointer; phones get the plain clip in a frame. Then the facts, the bTV spot
 * (the first film), the numbers, and a run of alternating sections - a short
 * title and description on one side, the media on the other, drifting a
 * little with the scroll: the challenge with Roni's scenes, the character with
 * his clip - then the eight product ads (Bunny Stream, all 16:9) as the
 * skewed collage (hover to open a panel and play it muted, click for the
 * full player), the YouTube pre-roll, the social cuts and the CTA card. Copy in
 * `projects.stories.boleron`; the published clips in `Project.story.clips`
 * (`null` = branded placeholder).
 */

/** The client's key-visual gradient, as the home showcase draws it (cyan → blue → violet, with its deep blue). */
const BOLERON = { cyan: "#25C7EA", blue: "#2B7BE6", violet: "#8A3BD6", deep: "#1E3FB5", accent: "#3F86D9" };
/**
 * The ground per theme: the showcase gradient in the light theme, the same three hues a few steps deeper in the
 * dark one (they sit next to the site's dark slate), a white light top-right and a deep-blue settle toward the
 * bottom - as CSS variables on the shell, so the ground and the cards read the theme's set.
 */
const GROUND_VARS =
  "[--bol-a:#25C7EA] [--bol-b:#2B7BE6] [--bol-c:#8A3BD6] [--bol-light:rgba(255,255,255,0.22)] [--bol-settle:rgba(30,63,181,0.35)] dark:[--bol-a:#0F86A6] dark:[--bol-b:#1E4FA8] dark:[--bol-c:#5A2699] dark:[--bol-light:rgba(255,255,255,0.1)] dark:[--bol-settle:rgba(8,16,52,0.72)]";
const BASE = "/projects/boleron/story";
/** Roni: the stacked colour + matte clip for the canvas, the plain clip (poster too) for phones / reduced motion. */
const RONI = { alpha: `${BASE}/roni-alpha.mp4`, plain: `${BASE}/roni.mp4`, poster: `${BASE}/roni-poster.webp` };
const TV = { src: `${BASE}/tv-btv.mp4`, poster: `${BASE}/tv-btv-poster.webp`, badge: `${BASE}/btv.png` };
const COLLAGE = [1, 2, 3, 4, 5].map((n) => `${BASE}/collage-${n}.webp`);
/** The matte clip is two frames stacked: colour on top, alpha (as luminance) below. */
const RONI_W = 540;
const RONI_H = 960;
/** A glass surface on the gradient (the numbers panel, the phones). */
const GLASS = "border border-white/15 bg-white/[0.08]";
/** The eight product ads, in page order (keys into `Project.story.clips` and `stories.boleron.ads.items`). */
const AD_KEYS = ["summer", "casco4", "liability3", "property", "travel", "liabilityApp", "casco3", "liability2"] as const;

/**
 * Roni without a box: the clip carries its own matte in its lower half; each
 * video frame is un-premultiplied against it and painted to a canvas, so only
 * the character shows over the gradient. Runs per video frame, only while on
 * screen; the scene tilts toward the pointer (springs) inside a perspective.
 */
function RoniScene({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();
  // The composite is for pointers and big screens; phones and reduced motion get the plain clip.
  const composite = useMediaQuery("(min-width: 1024px) and (hover: hover)") && !reduceMotion;
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScreen = useInView(boxRef, { margin: "20% 0px 20% 0px" });
  const tiltX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!composite || !video || !canvas || !onScreen) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const off = document.createElement("canvas");
    off.width = RONI_W;
    off.height = RONI_H * 2;
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!ctx || !octx) return;
    let cancelled = false;
    let handle = 0;
    const draw = () => {
      if (cancelled) return;
      if (video.readyState >= 2) {
        octx.drawImage(video, 0, 0, RONI_W, RONI_H * 2);
        const colour = octx.getImageData(0, 0, RONI_W, RONI_H);
        const matte = octx.getImageData(0, RONI_H, RONI_W, RONI_H);
        const c = colour.data;
        const m = matte.data;
        for (let i = 0; i < c.length; i += 4) {
          const a = m[i];
          if (a) {
            c[i] = Math.min(255, (c[i] * 255) / a);
            c[i + 1] = Math.min(255, (c[i + 1] * 255) / a);
            c[i + 2] = Math.min(255, (c[i + 2] * 255) / a);
          }
          c[i + 3] = a;
        }
        ctx.putImageData(colour, 0, 0);
      }
      schedule();
    };
    const schedule = () => {
      if ("requestVideoFrameCallback" in video) {
        handle = video.requestVideoFrameCallback(draw);
      } else {
        handle = requestAnimationFrame(draw);
      }
    };
    void video.play().catch(() => {});
    schedule();
    return () => {
      cancelled = true;
      if ("cancelVideoFrameCallback" in video) video.cancelVideoFrameCallback(handle);
      else cancelAnimationFrame(handle);
      video.pause();
    };
  }, [composite, onScreen]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = boxRef.current;
    if (!box || !composite) return;
    const r = box.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tiltY.set(x * 18);
    tiltX.set(-y * 12);
  };
  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <div
      ref={boxRef}
      className="relative mx-auto w-full max-w-[520px] lg:min-h-[560px] [perspective:1100px]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {composite ? (
        <motion.div className="relative aspect-[9/13] w-full [transform-style:preserve-3d]" style={{ rotateX: tiltX, rotateY: tiltY }}>
          {/* Floor shadow, a step behind. */}
          <div
            className="absolute bottom-[6%] left-1/2 h-[7%] w-[60%] -translate-x-1/2 [transform:translateZ(-40px)] blur-[6px]"
            style={{ background: "radial-gradient(ellipse at center, rgba(20,20,60,0.45) 0%, rgba(20,20,60,0) 70%)" }}
            aria-hidden
          />
          <video
            ref={videoRef}
            className="pointer-events-none absolute h-px w-px opacity-0"
            src={RONI.alpha}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            aria-hidden
          />
          <canvas ref={canvasRef} width={RONI_W} height={RONI_H} className="relative z-[1] block aspect-[9/16] h-auto w-full" aria-label={label} role="img" />
        </motion.div>
      ) : (
        <RoniClip label={label} className="max-w-[380px]" />
      )}
    </div>
  );
}

/** The plain Roni clip in a rounded frame (the hero on phones, the character section). */
function RoniClip({ label, className }: { label: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn("relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-[2rem] border border-white/15 bg-black/20 shadow-2xl", className)}>
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={RONI.plain}
        poster={RONI.poster}
        muted
        loop
        playsInline
        autoPlay={!reduceMotion}
        preload="metadata"
        aria-label={label}
      />
    </div>
  );
}

/**
 * An alternating section: a short title + description on one side, the media
 * on the other (`side` = where the media sits from lg; on phones the copy
 * comes first). The copy staggers in, the media rises and settles, then
 * drifts a little against the scroll.
 */
function Feature({
  side,
  align = "center",
  eyebrow,
  title,
  body,
  note,
  meta,
  media,
  className,
}: {
  side: "left" | "right";
  /** Where the media sits against the copy: centred, or at the top (a long copy beside a short frame). */
  align?: "center" | "start";
  eyebrow: string;
  title: string;
  body: readonly string[];
  note?: string;
  meta?: readonly { label: string; value: ReactNode }[];
  media: ReactNode;
  className?: string;
}) {
  return (
    <Section className={cn("pt-0 sm:pt-0 lg:pt-0", className)}>
      <motion.div
        className={cn("grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-20", align === "start" ? "items-start" : "items-center")}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.1)}
      >
        <motion.div variants={fadeUp} className={cn("max-w-[58ch]", side === "left" ? "lg:order-2" : "lg:order-1")}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Display text={title} className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl" />
          <div className="mt-6 text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl [&>p+p]:mt-4">
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {note ? <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{note}</p> : null}
          {meta ? <MetaList items={[...meta]} /> : null}
        </motion.div>
        <motion.div variants={frameIn} className={cn("min-w-0", side === "left" ? "lg:order-1" : "lg:order-2")}>
          <Drift>{media}</Drift>
        </motion.div>
      </motion.div>
    </Section>
  );
}

/** Roni's scenes as a mosaic: one tall panel, four squares, each with its small label. */
function Mosaic({ panels }: { panels: { src: string; label: string }[] }) {
  return (
    <motion.div className="grid grid-cols-[1.15fr_1fr_1fr] grid-rows-2 gap-3 sm:gap-4" variants={stagger(0.08)}>
      {panels.map((panel, i) => (
        <motion.figure
          key={panel.src}
          variants={fadeUp}
          className={cn("relative m-0 overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-xl", i === 0 ? "row-span-2" : "aspect-square")}
        >
          <Image src={panel.src} alt={panel.label} fill sizes="(max-width: 1024px) 45vw, 22vw" className="object-cover" />
          <figcaption className="absolute bottom-2.5 left-2.5 rounded-full border border-white/30 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
            {panel.label}
          </figcaption>
        </motion.figure>
      ))}
    </motion.div>
  );
}

export function BoleronStory({ project }: { project: Project }) {
  const { t } = useLanguage();
  const story = t.projects.stories.boleron;
  const name = t.projects.items[project.id].name;
  const partner = PARTNERS.find((p) => p.id === project.partnerId);
  const clips = project.story?.clips ?? {};
  const style = {
    "--foreground": "#ffffff",
    "--muted-foreground": "rgba(255,255,255,0.7)",
    "--story-accent": "rgba(255,255,255,0.75)",
    "--story-muted": "rgba(255,255,255,0.82)",
    "--story-line": "rgba(255,255,255,0.22)",
    "--story-rule": "rgba(255,255,255,0.6)",
  } as CSSProperties;
  const phone = "relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-[1.75rem] border-4 border-white/10 bg-black";
  const placeholderClass = "text-white/40 [background:repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0_10px,rgba(255,255,255,0.02)_10px_20px)]";
  const gradient = `linear-gradient(90deg, ${BOLERON.cyan}, ${BOLERON.blue} 46%, ${BOLERON.violet})`;

  return (
    <StoryShell
      style={style}
      accent={BOLERON.accent}
      display={PROJECT_DISPLAY_FONT.boleron}
      className={GROUND_VARS}
      // The wizard's heading in white on the gradient; its cards and fields keep the theme's look.
      wizardHeading="[--foreground:#fff] [--muted-foreground:rgba(255,255,255,0.78)]"
      ground={
        // Left → right: cyan → blue → violet (the theme's set, see GROUND_VARS), a soft light and the deep settle.
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--bol-a)_0%,var(--bol-b)_46%,var(--bol-c)_100%)]" />
          <div className="absolute left-[72%] top-[24%] aspect-square w-[min(760px,70vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--bol-light)_0%,transparent_68%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--bol-settle)_100%)]" />
        </div>
      }
    >
      {/* ---------------- HERO (right at the top: title left, Roni right, both top-aligned) ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div
          className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16"
          initial="hidden"
          animate="visible"
          variants={stagger(0.08, 0.1)}
        >
          <div>
            {partner ? (
              // The client's dark-ink mark as a white silhouette on the gradient.
              <motion.div variants={fadeUp} className="mb-10">
                <PartnerLogo p={partner} imgClass="h-16 w-auto brightness-0 invert md:h-24" sizes="400px" />
              </motion.div>
            ) : null}
            <h1 className={cn(HERO_TITLE.long, "max-w-[18ch] font-heading font-bold tracking-tight text-balance", PROJECT_DISPLAY_FONT.boleron, "leading-[1.06]")}>
              <Words text={story.hero.title} base={0.05} step={0.03} />
            </h1>
            <motion.p variants={fadeUp} className="mt-7 max-w-[40ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl">
              {story.hero.lead}
            </motion.p>
          </div>
          <motion.div variants={fadeUp}>
            <RoniScene label={name} />
          </motion.div>
        </motion.div>
      </Section>

      {/* ---------------- FACTS ---------------- */}
      <Section tight className="py-0 sm:py-0 lg:py-0">
        <FactsStrip facts={story.facts} columns={4} />
      </Section>

      {/* ---------------- THE FIRST FILM: the bTV spot ---------------- */}
      <Feature
        side="right"
        align="start"
        className="pt-20 sm:pt-24 lg:pt-32"
        eyebrow={story.tv.eyebrow}
        title={story.tv.title}
        body={story.tv.body}
        meta={story.tv.meta.map((item, i) =>
          i === 0
            ? {
                label: item.label,
                value: (
                  <span className="inline-flex rounded-lg bg-white px-2.5 py-1.5 shadow-md">
                    <Image src={TV.badge} alt={item.value} width={400} height={234} sizes="72px" className="h-7 w-auto sm:h-8" />
                  </span>
                ),
              }
            : item
        )}
        media={
          <div className="relative mx-auto w-full max-w-md">
            <MediaFrame
              src={TV.src}
              poster={TV.poster}
              title={`${name} · ${story.tv.title}`}
              aspect="aspect-[8/9]"
              placeholder=""
              className="rounded-3xl border border-white/15 bg-black shadow-2xl"
            />
            {/* The channel badge. */}
            <div className="pointer-events-none absolute right-4 top-4 rounded-xl bg-white/95 px-3 py-2 shadow-lg">
              <Image src={TV.badge} alt="bTV" width={400} height={234} sizes="60px" className="h-6 w-auto md:h-7" />
            </div>
          </div>
        }
      />

      {/* ---------------- RESULTS (right after the first film) ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div
          className={cn("rounded-[2rem] p-7 sm:p-10 lg:p-14", GLASS)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={{ ...frameIn, visible: { ...frameIn.visible, transition: { ...frameIn.visible.transition, staggerChildren: 0.1, delayChildren: 0.15 } } }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16">
            <motion.div variants={fadeUp}>
              <Eyebrow>{story.results.eyebrow}</Eyebrow>
              <Display text={story.results.title} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl" />
            </motion.div>
            <motion.p variants={fadeUp} className="text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl">
              {story.results.closing}
            </motion.p>
          </div>
          <StatGrid stats={story.results.stats} columns={4} rule="top" className="mt-12 lg:mt-16" />
        </motion.div>
      </Section>

      {/* ---------------- THE CHALLENGE: Roni everywhere the audience is ---------------- */}
      <Feature
        side="left"
        eyebrow={story.challenge.eyebrow}
        title={story.challenge.title}
        body={story.challenge.body}
        media={<Mosaic panels={COLLAGE.map((src, i) => ({ src, label: story.collage[i] ?? "" }))} />}
      />

      {/* ---------------- THE CHARACTER ---------------- */}
      <Feature
        side="right"
        eyebrow={story.solution.eyebrow}
        title={story.solution.title}
        body={story.solution.body}
        media={<RoniClip label={name} className="max-w-[340px]" />}
      />

      {/* ---------------- THE ADS: the eight product films as the collage ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0" inner="lg:max-w-none lg:px-6">
        <motion.div
          className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16", STORY_CONTAINER, "lg:px-0")}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.08)}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.ads.eyebrow}</Eyebrow>
            <Display text={story.ads.title} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl" />
          </motion.div>
          <motion.div variants={fadeUp} className="text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl [&>p+p]:mt-4">
            {story.ads.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>
        </motion.div>
        <div className="mt-12 lg:mt-16">
          <ClipCollage
            panels={AD_KEYS.flatMap((key) => {
              const clip = clips[key];
              const ad = story.ads.items[key];
              return clip && "bunny" in clip ? [{ clip: clip.bunny, title: ad.title, note: ad.note }] : [];
            })}
            labelClass="border border-white/35 bg-white/15 uppercase tracking-[0.12em] text-white backdrop-blur-md"
            shade="linear-gradient(to top, rgba(10,10,40,0.6) 0%, rgba(10,10,40,0) 45%)"
            closeLabel={t.services.modal.close}
          />
        </div>
      </Section>

      {/* ---------------- YOUTUBE ---------------- */}
      <Feature
        side="left"
        eyebrow={story.youtube.eyebrow}
        title={story.youtube.title}
        body={story.youtube.body}
        note={story.youtube.note}
        media={
          <MediaFrame
            clip={clips.youtube ?? null}
            title={`${name} · ${story.youtube.title}`}
            aspect="aspect-video"
            placeholder={story.social.placeholder}
            className="rounded-3xl border border-white/15 bg-black shadow-2xl"
            placeholderClass={placeholderClass}
            ringClass="border-white/40 text-white/70"
          />
        }
      />

      {/* ---------------- SOCIAL: the three phones ---------------- */}
      <Feature
        side="right"
        eyebrow={story.social.eyebrow}
        title={story.social.title}
        body={story.social.body}
        note={story.social.note}
        media={
          <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
            {(["shorts", "facebook", "tiktok"] as const).map((key, i) => (
              <motion.figure key={key} variants={fadeUp} className={cn("m-0 min-w-0", i === 1 && "lg:-translate-y-6")}>
                <MediaFrame
                  clip={clips[key] ?? null}
                  title={`${name} · ${story.social.items[i]}`}
                  aspect="aspect-[9/16]"
                  placeholder={story.social.placeholder}
                  className={phone}
                  placeholderClass={placeholderClass}
                  ringClass="size-12 border-white/40 text-white/70 sm:size-14"
                />
                <figcaption className="mt-3 truncate text-center text-xs text-white/55 sm:text-sm">{story.social.items[i]}</figcaption>
              </motion.figure>
            ))}
          </div>
        }
      />

      {/* ---------------- CTA ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        {/* The card - white, or deep blue-black in the dark theme - rising into place: a fine dot pattern, two
            arcs on the right, the brand gradient as a hairline along the top and a soft blue light. */}
        <CtaBand
          title={story.cta.title}
          quote={story.cta.quote}
          contact={story.cta.contact}
          tone="page"
          animate="rise"
          words
          eyebrow={<Eyebrow>{story.cta.eyebrow}</Eyebrow>}
          lead={<p className="mt-5 max-w-[44ch] text-base leading-relaxed opacity-75 sm:text-lg xl:text-xl">{story.cta.lead}</p>}
          className="rounded-[2rem] bg-white p-8 pt-10 text-[#1B1B2E] shadow-[0_40px_120px_-30px_rgba(30,63,181,0.55)] [--story-accent:#2B7BE6] sm:p-12 lg:p-16 dark:bg-[#0F1638] dark:text-white dark:shadow-[0_40px_120px_-30px_rgba(37,199,234,0.35)] dark:[--story-accent:#25C7EA]"
        >
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: gradient }} aria-hidden />
          <div
            className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1.6px)] [background-size:22px_22px] dark:opacity-[0.11]"
            aria-hidden
          />
          <div className="absolute -right-24 -top-36 size-[30rem] rounded-full border border-current opacity-[0.08]" aria-hidden />
          <div className="absolute -right-4 -top-16 size-[21rem] rounded-full border border-current opacity-[0.08]" aria-hidden />
          <div
            className="absolute -bottom-32 -left-24 size-[26rem] rounded-full bg-[radial-gradient(closest-side,rgba(43,123,230,0.16),transparent)] dark:bg-[radial-gradient(closest-side,rgba(37,199,234,0.22),transparent)]"
            aria-hidden
          />
        </CtaBand>
      </Section>
    </StoryShell>
  );
}
