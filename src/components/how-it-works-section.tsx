"use client";

import { motion } from "motion/react";
import { IconCheck } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";

const EASE = [0.22, 1, 0.36, 1] as const;

/** One picture per step, in order (`public/process-steps/`): the package, the brief, the set, the screening room. */
const STEP_IMAGES = ["/process-steps/step-1.jpg", "/process-steps/step-2.jpg", "/process-steps/step-3.jpg", "/process-steps/step-4.jpg"];

/**
 * "How it works" in the English site's style (the home page, right after the packages, and the contact page): a
 * left-aligned heading on the page margin with an orange eyebrow, then the four steps (`process.steps`) as dark cards -
 * each with its own picture (very dark at rest), a big outlined number and the title large in Archivo over its line.
 * On hover a window opens out of the card's middle with the picture coming up and the whole step in it; the cards rise
 * in one after another. Replaces the 3D number badges of `process-section.tsx`.
 */
export function HowItWorksSection() {
  const { t } = useLanguage();
  const p = t.process;

  return (
    <section id="process" className="relative px-[max(1.25rem,3vw)] py-12 text-white sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{p.eyebrow}</p>
        <h2 className="mt-3 font-heading text-[clamp(30px,3.8vw,60px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance">
          {p.title1} <span className="text-section-accent">{p.title2}</span>
        </h2>
        <p className="mt-4 max-w-[62ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/65">{p.subtitle}</p>
      </header>

      <div className="relative mt-10 lg:mt-14">
        <ol className="relative grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.steps.map((step, index) => {
            return (
              <motion.li
                key={step.title}
                // The card keeps its place and height (nothing below ever moves). On hover / focus a larger window grows
                // out of its centre in every direction and comes to the front, over its neighbours, with the whole step in
                // it. On a screen without hover the details are simply shown inside the card.
                tabIndex={0}
                className="group relative rounded-2xl outline-none hover:z-30 focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff8a1f] focus-within:z-30"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.12 * index, ease: EASE }}
              >
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_60%)] p-6 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)] lg:items-center lg:text-center">
                  {/* The step's picture, very dark at rest (it only hints at the scene) - it slips away as the window opens. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-100 transition-opacity duration-700 ease-out [filter:brightness(0.22)_saturate(0.75)] group-hover:opacity-0 [@media(hover:none)]:[filter:brightness(0.4)_saturate(0.9)] [@media(hover:none)]:group-hover:opacity-100"
                    style={{ backgroundImage: `url(${STEP_IMAGES[index]})` }}
                  />
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,12,0.75),rgba(10,10,12,0.35))]" />
                  {/* The step's number, huge in the card's lower corner behind the content and cropped by it: an orange
                      outline with a faint fill, sinking away as the window opens. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-2 -bottom-10 font-heading text-[11rem] font-black leading-none tracking-tighter text-[#ff8a1f]/[0.05] select-none [-webkit-text-stroke:1.5px_rgba(255,138,31,0.24)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-3 group-hover:opacity-0 xl:text-[13rem]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="relative z-10 font-heading text-[1.65rem] font-black uppercase leading-[1.02] tracking-tight xl:text-[2rem]">{step.title}</h3>
                  <p className="relative z-10 mt-3 text-sm leading-relaxed text-white/75">{step.description}</p>

                  {/* No hover (touch): the extra points sit in the card. */}
                  <ul className="relative z-10 mt-4 hidden flex-col gap-2 text-left [@media(hover:none)]:flex">
                    {step.more.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                        <IconCheck className="mt-0.5 size-4 shrink-0 text-[#ff8a1f]" stroke={3} aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The window: centred on the card, a little wider and taller, scaled down and clear until the card is
                    hovered, then it grows to full size from its middle. */}
                <div
                  aria-hidden
                  className="pointer-events-none invisible absolute top-1/2 left-1/2 z-20 w-[calc(100%+2rem)] -translate-x-1/2 -translate-y-1/2 scale-[0.88] rounded-2xl border border-[#ff7a1a]/50 bg-[linear-gradient(160deg,#20212a_0%,#131418_65%)] p-6 opacity-0 shadow-[0_40px_90px_-24px_rgba(0,0,0,0.95),0_0_60px_-18px_rgba(255,106,20,0.45)] transition-[transform,opacity,visibility] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:visible group-hover:scale-100 group-hover:opacity-100 [@media(hover:none)]:hidden"
                >
                  {/* The picture, opening out of the middle (a circle growing to cover the window) as the window grows, then
                      drifting in a slow push-in; a dark gradient from the foot keeps the writing readable on it. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl [clip-path:circle(0%_at_50%_50%)] transition-[clip-path] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:[clip-path:circle(150%_at_50%_50%)] group-hover:[clip-path:circle(150%_at_50%_50%)]"
                  >
                    <span
                      className="absolute inset-0 scale-[1.18] bg-cover bg-center transition-transform duration-[2400ms] ease-[cubic-bezier(0.16,1,0.3,1)] [filter:brightness(0.92)_saturate(1.08)] group-focus-within:scale-100 group-hover:scale-100"
                      style={{ backgroundImage: `url(${STEP_IMAGES[index]})` }}
                    />
                    <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,8,10,0.9)_0%,rgba(8,8,10,0.6)_50%,rgba(8,8,10,0.08)_100%)]" />
                    <span className="absolute -right-3 -bottom-8 font-heading text-[12rem] font-black leading-none tracking-tighter text-white/[0.06] [-webkit-text-stroke:2px_rgba(255,190,120,0.5)] select-none">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <h3 className="relative font-heading text-[1.75rem] font-black uppercase leading-[1.02] tracking-tight xl:text-[2.1rem]">{step.title}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/85">{step.description}</p>
                  <ul className="relative mt-3.5 flex flex-col gap-2 border-t border-white/15 pt-3.5">
                    {step.more.map((point, i) => (
                      <li
                        key={point}
                        className="flex translate-y-2 items-start gap-2.5 text-[13px] leading-relaxed text-white/80 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
                        style={{ transitionDelay: `${180 + i * 80}ms` }}
                      >
                        <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white">
                          <IconCheck className="size-3" stroke={3} aria-hidden />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
