"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { PartnerLogo } from "@/components/partner-logo";
import { Sparks } from "@/components/projects/showcase-primitives";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS } from "@/lib/partners";
import { PROJECT_DISPLAY_FONT } from "@/lib/project-fonts";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  BodyXL,
  COPY_DELAY,
  Collage,
  ClientSite,
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
  fadeUpAfter,
  stagger,
} from "./primitives";

/*
 * OSMO's story - in the dress of the client's case study (`OSMO-Case-Study.html`):
 * Manrope for everything, the page one gradient from white down into OSMO
 * green (`GROUND` - white for the first third, a pale green under the films,
 * the results, the client's words and the CTA on the green), the hero clip (a
 * fan of real colour samples) bare on the white, no frame - multiplied, so
 * its white ground is the page's; four product films follow, each in its own
 * frame with format / length / channel; the results in white on the green;
 * the CTA card in the leaf shape with the green edge, light and particles.
 * Copy in `projects.stories.osmo`; the films are on Bunny Stream
 * (`Project.story.clips`), the hero clip self-hosted under
 * `public/projects/osmo/story/`.
 */

const OSMO = { green: "#108C3C", deep: "#0B6E2F", light: "#2FA55A" };
/** The page's ground, as the delivered case study sets it: white, then sinking into OSMO green by the bottom. */
const GROUND = "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 38%, #EAF4EC 58%, #5FB27A 80%, #108C3C 100%)";
const BASE = "/projects/osmo/story";
const HERO_CLIP = { src: `${BASE}/hero-samples.mp4`, poster: `${BASE}/hero-samples-poster.webp` };
const COLLAGE = [1, 2, 3, 4].map((n) => `${BASE}/collage-${n}.webp`);
/**
 * The challenge / solution titles sit in the sticky third of a `Split` from lg, and they are whole sentences - so
 * they run on a fluid ramp sized to that column (38px on a 1366px laptop, 48px at full HD, 52px at most) instead
 * of the section ramp's 48 / 60px, which folded the nine-word challenge title into eight lines on a laptop.
 */
const SPLIT_TITLE = "text-3xl sm:text-4xl lg:text-[clamp(1.875rem,0.75rem+1.9vw,3.25rem)]";
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

/** The leaf: a big radius on two opposite corners, a small one on the others (the CTA card). */
const LEAF = "rounded-[2.75rem_1.25rem]";
/**
 * The card's 3px edge - a fine gradient of the greens at half strength - on the CTA card itself (a transparent
 * 3px border, the card colour on the padding box and the gradient on the border box), so it rises with the card.
 */
const EDGE_CARD = "border-[3px] border-transparent [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(150deg,rgba(63,191,108,0.75)_0%,rgba(16,140,60,0.35)_45%,rgba(11,110,47,0.8)_100%)_border-box] dark:[background:linear-gradient(#0F2418,#0F2418)_padding-box,linear-gradient(150deg,rgba(63,191,108,0.75)_0%,rgba(16,140,60,0.35)_45%,rgba(11,110,47,0.8)_100%)_border-box]";

/**
 * What sits around a frame: a soft green light behind it (a radial gradient, never a blur filter) and small green
 * particles drifting up along both of its sides. `pale` is the version for the green band at the end of the page,
 * where the light and the particles are near-white.
 */
function GreenAura({ pale = false }: { pale?: boolean }) {
  const colors: [string, string] = pale ? ["rgba(255,255,255,0.92)", "#C9F2D6"] : [OSMO.deep, OSMO.light];
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute -inset-[9%] rounded-[50%]",
          pale
            ? "bg-[radial-gradient(closest-side,rgba(225,255,235,0.55)_0%,rgba(225,255,235,0.2)_52%,transparent_100%)]"
            : "bg-[radial-gradient(closest-side,rgba(47,165,90,0.32)_0%,rgba(47,165,90,0.12)_52%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(47,165,90,0.45)_0%,rgba(47,165,90,0.16)_52%,transparent_100%)]"
        )}
        aria-hidden
      />
      <Sparks colors={colors} count={9} region={{ left: [0, 9], top: [8, 96] }} glow={10} className="-inset-x-12 inset-y-0" />
      <Sparks colors={colors} count={9} region={{ left: [91, 100], top: [4, 92] }} glow={10} className="-inset-x-12 inset-y-0" />
    </>
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
      // The case study's face for the whole block - the body at 400; the large letters wear `display` (600).
      font="font-[family-name:var(--font-manrope)]"
      // Locked light whatever the visitor's theme: the story runs from white down into the green (`GROUND`, drawn
      // over the story block), and the wizard after it sits on that green, its heading in white.
      theme="light"
      className="[--story-ground:#108C3C]"
      wizardHeading="[--foreground:#fff] [--muted-foreground:rgba(255,255,255,0.78)]"
      ground={<div className="absolute inset-0 bg-[var(--story-ground)]" aria-hidden />}
    >
      {/* The delivered page's ground over the story block: white up top, the green by the CTA. */}
      <div className="pointer-events-none absolute inset-0" style={{ background: GROUND }} aria-hidden />

      {/* ---------------- HERO ---------------- */}
      <Section tight className="pt-4 sm:pt-6 lg:pt-8">
        {/* The columns top-aligned: centred against the taller clip, the logo sat a hand's width under the breadcrumbs. */}
        <motion.div
          className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
          initial="hidden"
          animate="visible"
          variants={stagger(0.08, 0.1)}
        >
          <div>
            {partner ? (
              <motion.div variants={fadeUp} className="mb-10">
                <ClientSite href={partner.href} name={name} className="block w-full md:inline-block md:w-auto">
                  <PartnerLogo p={partner} imgClass="h-auto w-full md:h-36 md:w-auto" sizes="(max-width: 767px) 100vw, 520px" />
                </ClientSite>
              </motion.div>
            ) : null}
            <h1 className={cn(HERO_TITLE.long, "font-heading font-bold tracking-tight text-balance", PROJECT_DISPLAY_FONT.osmo, "leading-[1.06]")}>
              <Words text={story.hero.title} base={0.05} step={0.03} />
            </h1>
            <motion.p variants={fadeUp} className="mt-7 max-w-[40ch] text-lg leading-relaxed text-[var(--story-muted)] sm:text-xl xl:text-2xl">
              {story.hero.lead}
            </motion.p>
          </div>
          <motion.div variants={fadeUp} className="mx-auto w-full max-w-[520px]">
            {/* The fan of colour samples bare on the page, no frame - the clip at its own frame (9:16), as tall as
                the room allows, multiplied so its white ground is the page's white. */}
            <video
              className="mx-auto h-auto max-h-[min(82vh,780px)] w-full object-contain mix-blend-multiply"
              src={HERO_CLIP.src}
              poster={HERO_CLIP.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label={name}
            />
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
              <Display text={story.challenge.title} className={SPLIT_TITLE} />
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
              <Display text={story.solution.title} className={SPLIT_TITLE} />
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
              <div className={cn(flip && "lg:order-2")}>
                <motion.div variants={fadeUp}>
                  <Eyebrow>{product.eyebrow}</Eyebrow>
                  <Display text={product.title} className="text-3xl sm:text-4xl lg:text-[2.75rem]" />
                </motion.div>
                <motion.div variants={fadeUpAfter(COPY_DELAY)}>
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
              </div>
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

      {/* ---------------- RESULTS (in white, on the green) ---------------- */}
      <Section className="border-t border-white/25 text-white [--story-accent:rgba(255,255,255,0.8)] [--story-muted:rgba(255,255,255,0.8)] [--story-rule:rgba(255,255,255,0.7)]">
        <Reveal>
          <Eyebrow>{story.results.eyebrow}</Eyebrow>
          <Display text={story.results.title} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl" />
        </Reveal>
        <StatGrid stats={story.results.stats} className="mt-14" />
        <Reveal className="mt-14 max-w-[60ch]">
          <BodyXL paragraphs={[story.results.closing]} />
        </Reveal>
      </Section>

      {/* ---------------- QUOTE · CTA (on the green) ---------------- */}
      <div className="text-white [--story-accent:rgba(255,255,255,0.85)] [--story-muted:rgba(255,255,255,0.8)] [--story-line:rgba(255,255,255,0.25)]">
        <Section tight className="pt-0 sm:pt-0 lg:pt-0">
          <Reveal className="rounded-2xl bg-white px-7 py-10 text-[#181418] [--story-accent:#108C3C] [--story-muted:rgba(24,20,24,0.55)] sm:px-12 sm:py-14">
            <Eyebrow>{story.quote.eyebrow}</Eyebrow>
            <span className={cn(PROJECT_DISPLAY_FONT.osmo, "mb-5 block text-7xl font-bold leading-[0.6] text-[var(--story-accent)]")} aria-hidden>
              “
            </span>
            <blockquote className="max-w-[48rem] text-2xl leading-snug sm:text-3xl">{story.quote.text}</blockquote>
            <p className="mt-8 text-lg">
              <span className="font-bold">{story.quote.name}</span> <span className="text-[var(--story-muted)]">— {story.quote.role}</span>
            </p>
          </Reveal>
        </Section>

        <Section tight className="pt-0 sm:pt-0 lg:pt-0">
          {/* OSMO's card - white, or deep green in the dark theme - in the hero frame's dress: the leaf shape with the
              gradient edge, green lights in two corners, and the pale light + particles of the aura behind it. */}
          <div className="relative">
            <GreenAura pale />
            <CtaBand
              title={story.cta.title}
              quote={story.cta.quote}
              contact={story.cta.contact}
              tone="page"
              className={cn(
                LEAF,
                EDGE_CARD,
                "p-8 pl-10 text-[#181418] shadow-[0_30px_90px_-30px_rgba(16,140,60,0.4)] sm:p-12 sm:pl-14 lg:p-14 lg:pl-16 dark:text-white dark:shadow-[0_30px_90px_-30px_rgba(47,165,90,0.5)]"
              )}
            >
              <div className="absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(47,165,90,0.22),transparent)] dark:bg-[radial-gradient(closest-side,rgba(47,165,90,0.34),transparent)]" aria-hidden />
              <div className="absolute -bottom-32 -left-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(47,165,90,0.14),transparent)] dark:bg-[radial-gradient(closest-side,rgba(47,165,90,0.22),transparent)]" aria-hidden />
            </CtaBand>
          </div>
        </Section>
      </div>
    </StoryShell>
  );
}
