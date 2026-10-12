"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { IconArrowRight } from "@tabler/icons-react";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { portfolioPath, pricingPath, servicePath } from "@/lib/routes";
import { getServiceSlug } from "@/lib/services/constants";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const RISE = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: EASE },
} as const;

const BUTTON =
  "inline-flex h-12 cursor-pointer items-center justify-center rounded-full px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,0.95)]";
const BUTTON_BG = { background: "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 45%,#ffb066 100%)" };
const BUTTON_OUTLINE =
  "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white/90 transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10";

/** `/services` - the four services as big Keplerbay cards (picture on one side, the story and the two buttons on the
 * other, the sides alternating), then a closing band to the pricing and the videos. Copy in the dictionary under
 * `services`; every card opens its own service page, and "Request a quote" opens it on its quote wizard (`#quote`). */
export function ServicesPageView() {
  const { t, language } = useLanguage();
  const s = t.services;

  return (
    <AccountShell sideNav={false}>
      <header className="mt-8 max-w-4xl sm:mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{s.eyebrow}</p>
        <h1 className="mt-3 font-heading text-[clamp(38px,6vw,96px)] leading-[0.94] font-black uppercase tracking-[-0.015em] text-balance">
          {s.title1}{" "}
          <span className="bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent">
            {s.title2}
          </span>
        </h1>
        <p className="mt-6 max-w-[60ch] text-[clamp(16px,1.3vw,21px)] leading-relaxed text-white/75">{s.subtitle}</p>
      </header>

      <ul className="mt-12 flex flex-col gap-5">
        {s.items.map((item, index) => {
          const slug = getServiceSlug(item.imgSrc);
          if (!slug) return null;
          const href = servicePath(language, slug);
          const flip = index % 2 === 1;
          return (
            <motion.li
              key={item.imgSrc}
              initial={RISE.initial}
              whileInView={RISE.whileInView}
              viewport={RISE.viewport}
              transition={RISE.transition}
              className={cn(ACCOUNT_CARD, "relative grid overflow-hidden md:grid-cols-[1.15fr_0.85fr]")}
            >
              <span aria-hidden className="pointer-events-none absolute top-3 right-6 z-0 font-heading text-[7rem] font-black leading-none text-white/[0.04] sm:text-[9rem]">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* The story: the kind of work, the headline, what it is, the four things it covers and the two buttons. */}
              <div className={cn("relative z-[1] flex flex-col p-7 sm:p-10", flip && "md:order-2")}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{item.modal.eyebrow}</p>
                <h2 className="mt-3 font-heading text-[clamp(26px,3vw,46px)] leading-[1.02] font-black uppercase tracking-tight text-balance">
                  {item.modal.title}
                </h2>
                <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-white/70 sm:text-base">{item.modal.description}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {item.modal.stats.map((stat) => (
                    <li
                      key={stat}
                      className="rounded-full border border-[#ff8a1f]/40 bg-[#ff8a1f]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffb066]"
                    >
                      {stat}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={`${href}#quote`} className={BUTTON} style={BUTTON_BG}>
                    {s.quoteCta}
                  </Link>
                  <Link href={href} className={cn(BUTTON_OUTLINE, "group")}>
                    {s.learnMore}
                    <IconArrowRight className="size-4 text-[#ff8a1f] transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden />
                  </Link>
                </div>
              </div>

              {/* The picture, on a glow of the brand's orange. */}
              <Link
                href={href}
                tabIndex={-1}
                aria-hidden
                className={cn(
                  "group relative flex min-h-64 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_55%,rgba(255,110,20,0.22),transparent_62%)] p-8 md:min-h-full",
                  flip && "md:order-1"
                )}
              >
                <Image
                  src={item.imgSrc}
                  alt={item.imgAlt}
                  width={640}
                  height={640}
                  sizes="(max-width: 768px) 70vw, 30vw"
                  className="relative size-full max-h-[22rem] max-w-[22rem] object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </Link>
            </motion.li>
          );
        })}
      </ul>

      <motion.section {...RISE} className={cn(ACCOUNT_CARD, "mt-5 flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10")}>
        <div className="max-w-[56ch]">
          <h2 className="font-heading text-[clamp(22px,2.4vw,36px)] leading-tight font-black uppercase tracking-tight">{s.ctaHeading}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/65 sm:text-base">{s.ctaSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={pricingPath(language)} className={BUTTON} style={BUTTON_BG}>
            {s.pricingCta}
          </Link>
          <Link href={portfolioPath(language)} className={BUTTON_OUTLINE}>
            {s.workCta}
          </Link>
        </div>
      </motion.section>
    </AccountShell>
  );
}
