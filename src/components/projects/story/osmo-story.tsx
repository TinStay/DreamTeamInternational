"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  BodyXL,
  Collage,
  CtaBand,
  Display,
  Eyebrow,
  HERO_TITLE,
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
 * OSMO's story - the material world of the client: paper white, OSMO green
 * and oak. The hero clip (a fan of real colour samples) sits in a wood-edged
 * frame; four product films follow, each in its own frame with format /
 * length / channel; the page then sinks into OSMO green for the results, the
 * client's words and the CTA. Copy in `projects.stories.osmo`; the films are
 * on Bunny Stream (`Project.story.clips`), the hero clip self-hosted under
 * `public/projects/osmo/story/`.
 */

const OSMO = { green: "#108C3C", deep: "#0B6E2F", light: "#2FA55A", oak: "#C9A46B", oakDeep: "#8A5A2B" };
const BASE = "/projects/osmo/story";
const HERO_CLIP = { src: `${BASE}/hero-samples.mp4`, poster: `${BASE}/hero-samples-poster.webp` };
const COLLAGE = [1, 2, 3, 4].map((n) => `${BASE}/collage-${n}.webp`);
/**
 * The four product films, in the order of `stories.osmo.products` - keys into `Project.story.clips` and each
 * one's real frame (4:5, 9:16, 4:5, 4:5 - the player letterboxes anything else).
 */
const FILMS = [
  { key: "lazur", aspect: "aspect-[4/5]", width: "max-w-[440px]" },
  { key: "singleCoat", aspect: "aspect-[9/16]", width: "max-w-[320px]" },
  { key: "uv", aspect: "aspect-[4/5]", width: "max-w-[440px]" },
  { key: "decking", aspect: "aspect-[4/5]", width: "max-w-[440px]" },
] as const;

/** OSMO's wood-edged frame around a white inner. */
function WoodFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("rounded-[14px] p-2 shadow-[0_30px_60px_-30px_rgba(24,20,24,0.45)]", className)}
      style={{ background: `linear-gradient(120deg, ${OSMO.oakDeep} 0%, ${OSMO.oak} 50%, #A8783F 100%)` }}
    >
      <div className="overflow-hidden rounded-lg bg-white">{children}</div>
    </div>
  );
}

export function OsmoStory({ project }: { project: Project }) {
  const { t } = useLanguage();
  const story = t.projects.stories.osmo;
  const name = t.projects.items[project.id].name;
  const clips = project.story?.clips ?? {};
  const partner = PARTNERS.find((p) => p.id === project.partnerId);
  const style = {
    "--story-accent": OSMO.green,
    "--story-muted": "var(--muted-foreground)",
    "--story-line": "color-mix(in srgb, var(--foreground) 14%, transparent)",
    "--story-rule": OSMO.green,
  } as CSSProperties;

  return (
    <StoryShell
      style={style}
      accent={OSMO.green}
      display={PROJECT_DISPLAY_FONT.osmo}
      className="[--story-ground:#F4F8F2] dark:[--story-ground:#0C1912]"
      ground={
        // Paper with a hint of green / a deep green-black, a soft green light top-right in both.
        <div className="absolute inset-0 overflow-hidden bg-[var(--story-ground)]" aria-hidden>
          <div className="absolute right-[-12%] top-[-4%] aspect-square w-[min(820px,80vw)] rounded-full bg-[radial-gradient(closest-side,rgba(47,165,90,0.16)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(47,165,90,0.24)_0%,transparent_100%)]" />
        </div>
      }
    >
      {/* ---------------- HERO ---------------- */}
      <Section tight className="pt-4 sm:pt-6 lg:pt-8">
        <motion.div
          className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
          initial="hidden"
          animate="visible"
          variants={stagger(0.08, 0.1)}
        >
          <div>
            {partner ? (
              <motion.div variants={fadeUp} className="mb-10">
                <PartnerLogo p={partner} imgClass="h-24 w-auto md:h-36" sizes="520px" />
              </motion.div>
            ) : null}
            <h1 className={cn(HERO_TITLE.long, "font-heading font-bold tracking-tight text-balance", PROJECT_DISPLAY_FONT.osmo, "leading-[1.06]")}>
              <Words text={story.hero.title} base={0.1} step={0.035} />
            </h1>
            <motion.p variants={fadeUp} className="mt-7 max-w-[40ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl">
              {story.hero.lead}
            </motion.p>
          </div>
          <motion.div variants={fadeUp} className="mx-auto w-full max-w-[520px]">
            <WoodFrame>
              {/* The fan of colour samples on white - multiplied so the clip's white ground is the frame's. */}
              <video
                className="mx-auto block h-auto w-full max-h-[min(82vh,780px)] object-contain bg-white mix-blend-multiply"
                src={HERO_CLIP.src}
                poster={HERO_CLIP.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label={name}
              />
            </WoodFrame>
          </motion.div>
        </motion.div>
      </Section>

      {/* ---------------- FACTS ---------------- */}
      <Section tight className="py-0 sm:py-0 lg:py-0">
        <FactsStrip facts={story.facts} columns={5} />
      </Section>

      {/* ---------------- CHALLENGE / SOLUTION ---------------- */}
      <Section>
        <Split
          ratio="1/2"
          left={
            <>
              <Eyebrow>{story.challenge.eyebrow}</Eyebrow>
              <Display text={story.challenge.title} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl" />
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
              <Display text={story.solution.title} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl" />
            </>
          }
          right={<BodyXL paragraphs={story.solution.body} />}
        />
      </Section>

      {/* ---------------- COLLAGE ---------------- */}
      <div className="w-full overflow-hidden pb-20 sm:pb-24 lg:pb-32">
        <Collage
          panels={COLLAGE.map((src, i) => ({ src, label: story.collage[i] ?? "" }))}
          labelClass="bg-[rgba(16,140,60,0.85)] text-white"
          shade="linear-gradient(to top, rgba(24,20,24,0.55) 0%, rgba(24,20,24,0) 45%)"
        />
      </div>

      {/* ---------------- THE FILMS ---------------- */}
      {story.products.map((product, i) => {
        const film = FILMS[i];
        const flip = i % 2 === 1;
        return (
          <Section key={product.title} className="pt-0 sm:pt-0 lg:pt-0">
            <motion.div
              className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={stagger(0.1)}
            >
              <motion.div variants={fadeUp} className={cn(flip && "lg:order-2")}>
                <Eyebrow>{product.eyebrow}</Eyebrow>
                <Display text={product.title} className="text-3xl sm:text-4xl lg:text-[2.75rem]" />
                <div className="mt-7">
                  <BodyXL paragraphs={product.body} />
                </div>
                <MetaList
                  items={[
                    { label: story.metaLabels.format, value: product.meta.format },
                    { label: story.metaLabels.length, value: product.meta.length },
                    { label: story.metaLabels.channels, value: product.meta.channels },
                  ]}
                />
              </motion.div>
              <motion.div variants={fadeUp} className={cn("mx-auto w-full", film?.width, flip && "lg:order-1")}>
                {film ? (
                  <MediaFrame
                    clip={clips[film.key] ?? null}
                    title={`${name} · ${product.eyebrow}`}
                    aspect={film.aspect}
                    placeholder={t.projects.stories.boleron.social.placeholder}
                    className="rounded-xl bg-[#181418] shadow-[0_30px_60px_-30px_rgba(24,20,24,0.5)]"
                    placeholderClass="text-white/60 [background:linear-gradient(135deg,#1c2a20,#101a14)]"
                    ringClass="border-white/40 text-white/80"
                  />
                ) : null}
              </motion.div>
            </motion.div>
          </Section>
        );
      })}

      {/* ---------------- RESULTS (a pale green tint, the theme's own ink) ---------------- */}
      <Section
        className="bg-[color:color-mix(in_srgb,#2FA55A_14%,var(--story-ground))] [--story-rule:#108C3C] dark:[--story-rule:rgba(255,255,255,0.7)]"
      >
        <Reveal>
          <Eyebrow>{story.results.eyebrow}</Eyebrow>
          <Display text={story.results.title} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl" />
        </Reveal>
        <StatGrid stats={story.results.stats} className="mt-14" />
        <Reveal className="mt-14 max-w-[60ch]">
          <BodyXL paragraphs={[story.results.closing]} />
        </Reveal>
      </Section>

      {/* ---------------- QUOTE · CTA (the page sinks into OSMO green) ---------------- */}
      <div
        className="text-white [--story-accent:rgba(255,255,255,0.85)] [--story-muted:rgba(255,255,255,0.8)] [--story-line:rgba(255,255,255,0.25)]"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${OSMO.light} 14%, var(--story-ground)) 0%, ${OSMO.light} 30%, ${OSMO.green} 65%, ${OSMO.deep} 100%)`,
        }}
      >
        <Section tight className="pt-16 sm:pt-20 lg:pt-24">
          <Reveal className="rounded-2xl bg-white px-7 py-10 text-[#181418] [--story-accent:#108C3C] [--story-muted:rgba(24,20,24,0.55)] sm:px-12 sm:py-14">
            <Eyebrow>{story.quote.eyebrow}</Eyebrow>
            <span className="mb-5 block font-heading text-7xl font-bold leading-[0.6] text-[var(--story-accent)]" aria-hidden>
              “
            </span>
            <blockquote className="max-w-[48rem] text-2xl leading-snug sm:text-3xl">{story.quote.text}</blockquote>
            <p className="mt-8 text-lg">
              <span className="font-bold">{story.quote.name}</span> <span className="text-[var(--story-muted)]">— {story.quote.role}</span>
            </p>
          </Reveal>
        </Section>

        <Section tight className="pt-0 sm:pt-0 lg:pt-0">
          {/* OSMO's card - white, or deep green in the dark theme - with an oak edge, a green light in the corner and
              a soft green glow. */}
          <CtaBand
            title={story.cta.title}
            quote={story.cta.quote}
            contact={story.cta.contact}
            tone="page"
            className="rounded-2xl bg-white p-8 pl-10 text-[#181418] shadow-[0_30px_90px_-30px_rgba(16,140,60,0.4)] sm:p-12 sm:pl-14 lg:p-14 lg:pl-16 dark:bg-[#0F2418] dark:text-white dark:shadow-[0_30px_90px_-30px_rgba(47,165,90,0.5)]"
          >
            <div className="absolute inset-y-0 left-0 w-2.5" style={{ background: `linear-gradient(180deg, ${OSMO.oak}, #B08553 55%, ${OSMO.oakDeep})` }} aria-hidden />
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(47,165,90,0.22),transparent)] dark:bg-[radial-gradient(closest-side,rgba(47,165,90,0.34),transparent)]" aria-hidden />
          </CtaBand>
        </Section>
      </div>
    </StoryShell>
  );
}
