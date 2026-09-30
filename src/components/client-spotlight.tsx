"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNER_ICON_BASE } from "@/lib/partners";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The orange pearl, as ink (the quote marks). */
const PEARL_INK =
  "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent";

/**
 * The English home page's client spotlight, at the top of "What our clients say": MindGuard's two testimonials (the
 * founders' words from its case study, `projects.stories.mindguard.testimonials`) in one dark card in the site's dress -
 * the MindGuard mark (its white-ink file) with a small orange eyebrow on the left, the two quotes on the right, each
 * under a big orange-pearl quote mark with the name and role below. A pearl hairline runs along the card's top and a
 * warm light sits in its corner; the card and then each quote rise in as it scrolls into view.
 */
export function ClientSpotlight() {
  const { t } = useLanguage();
  const quotes = t.projects.stories.mindguard.testimonials.items;
  const s = t.reviews.spotlight;

  return (
    <motion.figure
      className="relative mx-auto w-[calc(100%-2.5rem)] max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_65%)] p-7 text-white shadow-[0_30px_70px_-35px_rgba(0,0,0,0.95)] sm:p-10 lg:p-12"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {/* The pearl hairline along the top and a warm light in the corner. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#ff8a1f_25%,#ffd2a1_50%,#ff8a1f_75%,transparent)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.16),transparent_65%)]"
      />

      <div className="relative grid gap-10 lg:grid-cols-[0.8fr_2.2fr] lg:gap-14">
        <div className="flex flex-col items-start gap-4 lg:border-r lg:border-white/10 lg:pr-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{s.eyebrow}</p>
          <Image
            src={`${PARTNER_ICON_BASE}mindguard_logo_dark.png`}
            alt="MindGuard"
            width={824}
            height={248}
            sizes="240px"
            className="h-auto w-48 sm:w-56"
          />
          <p className="max-w-[28ch] text-sm leading-relaxed text-white/55">{s.line}</p>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.35fr_1fr] md:gap-12">
          {quotes.map((q, index) => (
            <motion.blockquote
              key={q.name}
              className="flex flex-col"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.15 + 0.15 * index, ease: EASE }}
            >
              <span aria-hidden className={`font-heading text-6xl leading-[0.7] font-black ${PEARL_INK}`}>
                &ldquo;
              </span>
              <p className="mt-4 text-[clamp(17px,1.35vw,21px)] leading-relaxed font-medium text-white/90">{q.quote}</p>
              <footer className="mt-auto pt-6 text-sm">
                <span className="font-semibold text-white">{q.name}</span>
                <span className="text-white/50"> — {q.role}</span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </motion.figure>
  );
}
