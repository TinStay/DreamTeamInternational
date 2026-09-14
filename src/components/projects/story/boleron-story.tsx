"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  BodyXL,
  Collage,
  CtaBand,
  Display,
  Eyebrow,
  FactsStrip,
  MediaFrame,
  MetaList,
  Reveal,
  Section,
  Split,
  StatGrid,
  StoryShell,
  VIEWPORT,
  Words,
  fadeUp,
  stagger,
} from "./primitives";

/*
 * Boleron's story - the whole page is the client's world: the blue → violet
 * gradient with white type. Roni, the mascot, stands in the hero as a
 * composited clip (colour + matte, drawn on a canvas so he floats over the
 * gradient with no box) that tilts toward the pointer; phones get the plain
 * clip in a frame. Then the facts, the story, a collage of Roni's scenes, the
 * bTV spot, the social cuts, the YouTube pre-roll, the numbers and the CTA.
 * Copy in `projects.stories.boleron`; the published clips in
 * `Project.story.clips` (`null` = branded placeholder).
 */

const BOLERON = { blue: "#2E8FDD", mid: "#3D6FD6", violet: "#6A48CC", purple: "#8A3FC4", accent: "#3F86D9" };
const BASE = "/projects/boleron/story";
/** Roni: the stacked colour + matte clip for the canvas, the plain clip (poster too) for phones / reduced motion. */
const RONI = { alpha: `${BASE}/roni-alpha.mp4`, plain: `${BASE}/roni.mp4`, poster: `${BASE}/roni-poster.webp` };
const TV = { src: `${BASE}/tv-btv.mp4`, poster: `${BASE}/tv-btv-poster.webp`, badge: `${BASE}/btv.png` };
const COLLAGE = [1, 2, 3, 4, 5].map((n) => `${BASE}/collage-${n}.webp`);
/** The matte clip is two frames stacked: colour on top, alpha (as luminance) below. */
const RONI_W = 540;
const RONI_H = 960;

/**
 * Roni without a box: the clip carries its own matte in its lower half; each
 * video frame is un-premultiplied against it and painted to a canvas, so only
 * the character shows over the gradient. Runs per video frame, only while on
 * screen; the scene tilts toward the pointer (springs) inside a perspective.
 */
function RoniScene({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();
  const [composite, setComposite] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScreen = useInView(boxRef, { margin: "20% 0px 20% 0px" });
  const tiltX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });

  // The composite is for pointers and big screens; phones and reduced motion get the plain clip.
  useEffect(() => {
    setComposite(!reduceMotion && window.matchMedia("(min-width: 1024px) and (hover: hover)").matches);
  }, [reduceMotion]);

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
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[380px] overflow-hidden rounded-[2rem] border border-white/15 bg-black/20 shadow-2xl">
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
      )}
    </div>
  );
}

/** Heading row with a small note on the right (social / YouTube). */
function HeadRow({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <Reveal className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Display text={title} className="text-3xl sm:text-4xl lg:text-5xl" />
      </div>
      <p className="text-sm text-white/45">{note}</p>
    </Reveal>
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
  const phone = "relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[2rem] border-4 border-white/10 bg-black";
  const placeholderClass = "text-white/40 [background:repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0_10px,rgba(255,255,255,0.02)_10px_20px)]";

  return (
    <StoryShell
      style={style}
      accent={BOLERON.accent}
      ground={
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${BOLERON.blue} 0%, ${BOLERON.mid} 40%, ${BOLERON.violet} 75%, ${BOLERON.purple} 100%)` }}
          aria-hidden
        />
      }
    >
      {/* ---------------- HERO ---------------- */}
      <Section tight className="pt-4 sm:pt-6 lg:pt-8">
        <motion.div
          className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16"
          initial="hidden"
          animate="visible"
          variants={stagger(0.08, 0.1)}
        >
          <div>
            {partner ? (
              <motion.div variants={fadeUp} className="mb-8 inline-flex rounded-2xl bg-white px-5 py-3 shadow-lg">
                <PartnerLogo p={partner} imgClass="h-9 w-auto md:h-12" sizes="200px" />
              </motion.div>
            ) : null}
            <motion.div variants={fadeUp}>
              <Eyebrow>{story.hero.eyebrow}</Eyebrow>
            </motion.div>
            <h1 className="font-heading text-[clamp(2.5rem,5.2vw,4.5rem)] font-bold leading-[1.06] tracking-tight text-balance">
              <Words text={story.hero.title} base={0.1} step={0.035} />
            </h1>
            <motion.p variants={fadeUp} className="mt-7 max-w-[40ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl">
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

      {/* ---------------- CHALLENGE / SOLUTION ---------------- */}
      <Section>
        <Split
          ratio="1/2"
          left={
            <>
              <Eyebrow>{story.challenge.eyebrow}</Eyebrow>
              <Display text={story.challenge.title} className="text-3xl sm:text-4xl lg:text-5xl" />
            </>
          }
          right={<BodyXL paragraphs={story.challenge.body} />}
        />
      </Section>
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <Split
          ratio="1/2"
          left={
            <>
              <Eyebrow>{story.solution.eyebrow}</Eyebrow>
              <Display text={story.solution.title} className="text-3xl sm:text-4xl lg:text-5xl" />
            </>
          }
          right={<BodyXL paragraphs={story.solution.body} />}
        />
      </Section>

      {/* ---------------- COLLAGE ---------------- */}
      <div className="w-full overflow-hidden pb-20 sm:pb-24 lg:pb-32">
        <Collage
          panels={COLLAGE.map((src, i) => ({ src, label: story.collage[i] ?? "" }))}
          labelClass="border border-white/35 bg-white/15 uppercase tracking-[0.12em] text-white backdrop-blur-md"
          shade="linear-gradient(to top, rgba(10,10,40,0.55) 0%, rgba(10,10,40,0) 45%)"
        />
      </div>

      {/* ---------------- TV ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <motion.div
          className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.1)}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>{story.tv.eyebrow}</Eyebrow>
            <Display text={story.tv.title} className="text-3xl sm:text-4xl lg:text-5xl" />
            <div className="mt-7">
              <BodyXL paragraphs={story.tv.body} />
            </div>
            <MetaList items={story.tv.meta} />
          </motion.div>
          <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-md">
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
          </motion.div>
        </motion.div>
      </Section>

      {/* ---------------- SOCIAL ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <HeadRow eyebrow={story.social.eyebrow} title={story.social.title} note={story.social.note} />
        <motion.div
          className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
        >
          {(["shorts", "facebook", "tiktok"] as const).map((key, i) => (
            <motion.figure key={key} variants={fadeUp} className="m-0">
              <MediaFrame
                clip={clips[key] ?? null}
                title={`${name} · ${story.social.items[i]}`}
                aspect="aspect-[9/16]"
                placeholder={story.social.placeholder}
                className={phone}
                placeholderClass={placeholderClass}
                ringClass="border-white/40 text-white/70"
              />
              <figcaption className="mt-3 text-center text-sm text-white/55">{story.social.items[i]}</figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </Section>

      {/* ---------------- YOUTUBE ---------------- */}
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <HeadRow eyebrow={story.youtube.eyebrow} title={story.youtube.title} note={story.youtube.note} />
        <Reveal className="mt-10" delay={0.1}>
          <MediaFrame
            clip={clips.youtube ?? null}
            title={`${name} · ${story.youtube.title}`}
            aspect="aspect-video"
            placeholder={story.social.placeholder}
            className="rounded-3xl border border-white/10 bg-black"
            placeholderClass={placeholderClass}
            ringClass="border-white/40 text-white/70"
          />
        </Reveal>
      </Section>

      {/* ---------------- RESULTS ---------------- */}
      <Section className={cn("border-t border-white/20")}>
        <Reveal>
          <Eyebrow>{story.results.eyebrow}</Eyebrow>
          <Display text={story.results.title} className="text-3xl sm:text-4xl lg:text-5xl" />
        </Reveal>
        <StatGrid stats={story.results.stats} columns={4} className="mt-14" />
        <Reveal className="mt-14 max-w-3xl">
          <BodyXL paragraphs={[story.results.closing]} />
        </Reveal>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <Section tight className="pt-0 sm:pt-0 lg:pt-0">
        <CtaBand title={story.cta.title} quote={story.cta.quote} contact={story.cta.contact} tone="light" className="rounded-3xl bg-white p-8 text-[#1B1B2E] sm:p-12" />
      </Section>
    </StoryShell>
  );
}
