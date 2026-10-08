"use client";

import { motion } from "motion/react";
import { IconBriefcase, IconCheck } from "@tabler/icons-react";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { EMAIL_PRIMARY } from "@/lib/contact-info";

const EASE = [0.22, 1, 0.36, 1] as const;

const PEARL = "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 30%,#ffd2a1 48%,#ff9a3c 62%,#ff5e00 100%)";

const RISE = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: EASE },
} as const;

const mailto = (subject: string) => `${EMAIL_PRIMARY.href}?subject=${encodeURIComponent(subject)}`;

const BUTTON =
  "inline-flex h-12 cursor-pointer items-center justify-center rounded-full px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,0.95)]";
const BUTTON_BG = { background: "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 45%,#ffb066 100%)" };

/** `/careers` - the roles we will open soon (copy in the dictionary under `careers`); each card's button writes to us. */
export function CareersPageView() {
  const { t } = useLanguage();
  const c = t.careers;

  return (
    <AccountShell sideNav={false}>
      <header className="mt-8 max-w-4xl sm:mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{c.eyebrow}</p>
        <h1 className="mt-3 font-heading text-[clamp(38px,6vw,96px)] leading-[0.94] font-black uppercase tracking-[-0.015em] text-balance">
          {c.title1}{" "}
          <span className="bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent">
            {c.title2}
          </span>
        </h1>
        <p className="mt-6 max-w-[60ch] text-[clamp(16px,1.3vw,21px)] leading-relaxed text-white/75">{c.lead}</p>
      </header>

      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {c.roles.map((role, index) => (
          <motion.li
            key={role.title}
            initial={RISE.initial}
            whileInView={RISE.whileInView}
            viewport={RISE.viewport}
            transition={{ ...RISE.transition, delay: (index % 2) * 0.1 }}
            className={`${ACCOUNT_CARD} relative flex flex-col overflow-hidden p-7 sm:p-9`}
          >
            <span aria-hidden className="pointer-events-none absolute top-2 right-5 font-heading text-8xl font-black leading-none text-white/[0.04]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="relative flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
                {c.tag}
              </span>
            </div>
            <div className="relative mt-5 flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl p-px" style={{ background: PEARL }}>
                <span className="flex size-full items-center justify-center rounded-[15px] bg-[#141518]">
                  <IconBriefcase className="size-6 text-[#ffb066]" stroke={1.6} aria-hidden />
                </span>
              </span>
              <h2 className="font-heading text-[clamp(22px,2.2vw,32px)] font-black uppercase leading-tight tracking-tight">{role.title}</h2>
            </div>
            <p className="relative mt-4 text-[15px] leading-relaxed text-white/70">{role.summary}</p>
            <ul className="relative mt-4 flex flex-1 flex-col gap-2">
              {role.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/80">
                  <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white">
                    <IconCheck className="size-3" stroke={3} aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <a href={mailto(c.applySubject.replace("{role}", role.title))} className={`${BUTTON} relative mt-7 w-fit`} style={BUTTON_BG}>
              {c.apply}
            </a>
          </motion.li>
        ))}
      </ul>

      <motion.section {...RISE} className={`${ACCOUNT_CARD} mt-4 flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9`}>
        <div className="max-w-[60ch]">
          <h2 className="font-heading text-[clamp(20px,2vw,28px)] font-black uppercase leading-tight">{c.otherTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65 sm:text-base">{c.otherText}</p>
        </div>
        <a
          href={mailto(c.otherSubject)}
          className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white/90 transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
        >
          {c.otherCta}
        </a>
      </motion.section>
    </AccountShell>
  );
}
