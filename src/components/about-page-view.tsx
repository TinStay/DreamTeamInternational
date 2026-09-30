"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { IconBrandLinkedin, IconUsersGroup } from "@tabler/icons-react";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { openSignup } from "@/lib/signup-dialog";
import { careersPath } from "@/lib/routes";
import { bunny, bunnyMp4Url, bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { TEAM_MEMBERS } from "@/lib/team-members";

/** The film under the title (Bunny Stream, share link `player.mediadelivery.net/play/750681/a9efb9af-…`). */
const ABOUT_FILM = bunny("a9efb9af-1512-48f5-a446-2067567e02d7");

const EASE = [0.22, 1, 0.36, 1] as const;

/** The orange pearl - the site's gradient. */
const PEARL = "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 30%,#ffd2a1 48%,#ff9a3c 62%,#ff5e00 100%)";

/** A block that rises in once as it comes on screen. */
const RISE = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: EASE },
} as const;

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * `/about` (English site): the big "We make AI video" title with what you never need - no learning curve, no prompts -
 * struck through in red under it, the San Francisco skyline in a rounded frame, one text on who we are and what we do,
 * the team (name, role, a line, LinkedIn), the latest update - we are launching in the US, with the 20% first-order
 * discount - and "Join our team - coming soon". Copy in the dictionary under `about`, the people in `lib/team-members.ts`.
 */
export function AboutPageView() {
  const { t, language } = useLanguage();
  const a = t.about;

  return (
    <AccountShell wide>
      {/* Title */}
      <header className="mt-8 sm:mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.eyebrow}</p>
        <h1 className="mt-3 font-heading text-[clamp(44px,8vw,132px)] leading-[0.92] font-black uppercase tracking-[-0.015em] text-balance">
          {a.title1}{" "}
          <span className="bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent">
            {a.title2}
          </span>
        </h1>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[clamp(18px,1.8vw,28px)] font-semibold text-white/75">
          {a.crossed.map((item) => (
            <span key={item} className="line-through decoration-red-500 decoration-[3px]">
              {item}
            </span>
          ))}
        </p>
      </header>

      {/* The film, right under the title, in a rounded 16:9 frame: muted and looping, native controls for sound. */}
      <motion.div {...RISE} className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_40px_90px_-40px_rgba(255,106,20,0.45)] sm:mt-14 sm:rounded-[2.5rem]">
        <video
          src={bunnyMp4Url(ABOUT_FILM, 720)}
          poster={bunnyThumbnailUrl(ABOUT_FILM)}
          muted
          loop
          playsInline
          autoPlay
          controls
          preload="metadata"
          className="aspect-video w-full object-cover"
        />
      </motion.div>

      {/* Who we are, what we do */}
      <motion.p {...RISE} className="mt-12 max-w-[60ch] text-[clamp(18px,1.7vw,26px)] leading-relaxed text-white/80 sm:mt-16">
        {a.story}
      </motion.p>

      {/* The San Francisco skyline, spread edge to edge across the screen, between the story and the team. */}
      <motion.div
        {...RISE}
        className="relative left-1/2 mt-16 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 shadow-[0_40px_90px_-40px_rgba(255,106,20,0.45)] sm:mt-24"
      >
        <div className="relative aspect-[4/3] sm:aspect-[16/8] lg:aspect-[21/8] 2xl:aspect-[24/8]">
          <Image src="/about-san-francisco.jpg" alt={a.imageAlt} fill sizes="100vw" className="object-cover" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-[linear-gradient(to_top,rgba(0,0,0,0.55),transparent)]" />
        </div>
      </motion.div>

      {/* The team */}
      <section className="mt-20 sm:mt-28">
        <motion.div {...RISE}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.team.eyebrow}</p>
          <h2 className="mt-3 font-heading text-[clamp(30px,3.8vw,60px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance">
            {a.team.title1} <span className="text-section-accent">{a.team.title2}</span>
          </h2>
        </motion.div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_MEMBERS.map((member, index) => (
            <motion.li
              key={`${member.name}-${index}`}
              initial={RISE.initial}
              whileInView={RISE.whileInView}
              viewport={RISE.viewport}
              transition={{ ...RISE.transition, delay: index * 0.1 }}
              className={`${ACCOUNT_CARD} group/team relative flex flex-col overflow-hidden p-6`}
            >
              {/* The card's ground: the soft, grainy gradient, drifting slowly. Orange and black at rest; it turns to
                  its own colours while the pointer is over the card. A scrim keeps the writing readable on it. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="team-gradient absolute -inset-[12%] bg-cover bg-center transition-[filter] duration-700 ease-out [filter:sepia(1)_saturate(5)_hue-rotate(-34deg)_brightness(0.7)_contrast(1.2)] group-hover/team:[filter:none] group-focus-within/team:[filter:none]" style={{ backgroundImage: "url(/about-gradient.jpg)" }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,8,10,0.86)_0%,rgba(8,8,10,0.55)_55%,rgba(8,8,10,0.25)_100%)] transition-opacity duration-700 group-hover/team:opacity-65 group-focus-within/team:opacity-65" />
              </div>
              {/* The photo: a big square frame across the card (the initials on the pearl where there is none yet). */}
              <div className="relative z-10 aspect-square w-full overflow-hidden rounded-2xl p-0.5" style={{ background: PEARL }}>
                <div className="relative flex size-full items-center justify-center overflow-hidden rounded-[14px] bg-[#141518] font-heading text-5xl font-black text-[#ffb066]">
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover object-top" />
                  ) : (
                    initialsOf(member.name)
                  )}
                </div>
              </div>
              <div className="relative z-10 mt-5 min-w-0">
                <h3 className="font-heading text-xl font-black uppercase leading-tight">{member.name}</h3>
                <p className="text-sm font-semibold text-[#ff8a1f]">{member.role}</p>
              </div>
              <p className="relative z-10 mt-4 flex-1 text-sm leading-relaxed text-white/80">{member.bio}</p>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={a.team.linkedin.replace("{name}", member.name)}
                className="relative z-10 mt-5 inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/75 transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff8a1f] hover:bg-[#ff8a1f]/15 hover:text-white"
              >
                <IconBrandLinkedin className="size-5" stroke={1.7} aria-hidden />
              </a>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Mission and vision, under the team */}
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {[a.mission, a.vision].map((block, index) => (
          <motion.div
            key={block.eyebrow}
            initial={RISE.initial}
            whileInView={RISE.whileInView}
            viewport={RISE.viewport}
            transition={{ ...RISE.transition, delay: index * 0.1 }}
            className={`${ACCOUNT_CARD} relative overflow-hidden p-7 sm:p-10`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -bottom-20 size-72 bg-[radial-gradient(closest-side,rgba(255,94,0,0.22),transparent)]"
            />
            <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{block.eyebrow}</p>
            <h2 className="relative mt-3 font-heading text-[clamp(24px,2.6vw,40px)] font-black uppercase leading-[0.98] tracking-[-0.01em] text-balance">
              {block.title}
            </h2>
            <p className="relative mt-4 text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/75">{block.text}</p>
          </motion.div>
        ))}
      </section>

      {/* Latest updates */}
      <section className="mt-20 sm:mt-28">
        <motion.div {...RISE}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.updates.eyebrow}</p>
        </motion.div>
        <motion.article
          {...RISE}
          // The card's ground is the navy picture with the waving flag in its right corner (`public/about-us-flag-2.jpg`).
          className="relative mt-4 overflow-hidden rounded-[2rem] border border-white/15 bg-[#151d3a] bg-cover bg-no-repeat bg-[position:right_top] p-7 shadow-[0_30px_80px_-40px_rgba(30,50,140,0.7)] max-sm:pt-[9.5rem] sm:p-10 lg:p-12"
          style={{ backgroundImage: "url(/about-us-flag-2.jpg)" }}
        >
          <div className="relative flex flex-col items-start gap-8">
            <div className="max-w-[56ch] lg:max-w-[48%]">
              <h2 className="font-heading text-[clamp(26px,3.2vw,48px)] font-black uppercase leading-[0.98] tracking-[-0.01em] text-balance">
                {a.updates.title}
              </h2>
              <p className="mt-4 text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/70">{a.updates.text}</p>
            </div>
            <button
              type="button"
              onClick={openSignup}
              className="inline-flex min-h-14 shrink-0 cursor-pointer items-center justify-center rounded-full px-8 py-3 text-center text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,0.95)]"
              style={{ background: "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 45%,#ffb066 100%)" }}
            >
              {a.updates.cta}
            </button>
          </div>
        </motion.article>
      </section>

      {/* Join our team */}
      <section className="mt-6">
        <motion.div {...RISE} className={`${ACCOUNT_CARD} flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:gap-8 sm:p-10`}>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl p-px" style={{ background: PEARL }}>
            <span className="flex size-full items-center justify-center rounded-[15px] bg-[#141518]">
              <IconUsersGroup className="size-7 text-[#ffb066]" stroke={1.6} aria-hidden />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.hiring.eyebrow}</p>
            <h2 className="mt-2 font-heading text-[clamp(22px,2.4vw,34px)] font-black uppercase leading-tight">{a.hiring.title}</h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-white/65 sm:text-base">{a.hiring.text}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <span className="inline-flex w-fit items-center rounded-full border border-[#ff8a1f]/50 bg-[#ff8a1f]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#ffb066]">
              {a.hiring.badge}
            </span>
            <Link
              href={careersPath(language)}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,0.95)]"
              style={{ background: "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 45%,#ffb066 100%)" }}
            >
              {a.hiring.cta}
            </Link>
          </div>
        </motion.div>
      </section>
    </AccountShell>
  );
}
