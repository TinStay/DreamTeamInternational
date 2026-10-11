"use client";

import type { ReactNode } from "react";
import { ScrollItem, ScrollStagger } from "@/components/ui/scroll-reveal";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/language-context";


/** A logo file from `public/models/` (white on transparent), sized by its height so the row reads evenly. */
function LogoImage({ file, width, height, className = "h-7" }: { file: string; width: number; height: number; className?: string }) {
  return <Image src={`/models/${file}?v=2`} alt="" width={width} height={height} unoptimized loading="eager" className={`${className} w-auto`} aria-hidden />;
}

const MODELS: { name: string; mark: ReactNode }[] = [
  { name: "Grok", mark: <LogoImage file="grok-white.png" width={543} height={202} className="h-8" /> },
  { name: "Anthropic", mark: <span className="text-xl font-black tracking-[0.04em] uppercase">Anthrop\c</span> },
  { name: "OpenAI", mark: <LogoImage file="openai-white.png" width={699} height={199} className="h-8" /> },
  { name: "Google", mark: <span className="text-2xl font-medium tracking-tight">Google</span> },
  { name: "ByteDance", mark: <LogoImage file="bytedance-white.png" width={498} height={92} className="h-8" /> },
  { name: "KlingAI", mark: <LogoImage file="klingai-white.png" width={546} height={152} className="h-8" /> },
  { name: "MiniMax", mark: <LogoImage file="minimax-white.png" width={490} height={149} className="h-8" /> },
  { name: "Wan", mark: <LogoImage file="wan-white.png" width={439} height={171} className="h-9" /> },
];

/**
 * "Technology we use" (the English home page, right under the packages): a warm orange card - the pearl's oranges over
 * dark, soft streaks of shade drifting in it - with the line about our partners and the AI companies' wordmarks
 * gliding past in one endless, seamless loop (the row is doubled and the pair slides by exactly one half, so the end
 * meets the start without a jump; it eases to a stop under the pointer's hover and stands still under reduced motion).
 * With the scroll the band opens out from its middle, the title and line slide in from the left and the logos from the
 * right (`ScrollStagger`). Copy in the dictionary under `aiPartners`.
 */
export function AiPartnersSection() {
  const { t } = useLanguage();
  const p = t.aiPartners;

  return (
    <section id="ai-partners" className="relative py-12 text-white sm:py-16">
      {/* With the scroll: the band opens out sideways from its middle, the title and its line slide in from the left,
          and the logos from the right - one after another. */}
      <ScrollStagger start={1} until={0.3}>
      <ScrollItem
        index={0}
        count={4}
        variant="widen"
        className="relative isolate overflow-hidden border-y border-white/10 bg-[linear-gradient(100deg,#8a2d05_0%,#e4560c_38%,#ff7a1a_68%,#ffa94d_100%)] px-[max(1.25rem,3vw)] py-10 shadow-[0_40px_100px_-40px_rgba(255,106,20,0.6)] sm:py-12 lg:py-14"
      >
        {/* Streaks of shade and light drifting in the orange (radial gradients only - nothing blurred). */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[20%] -z-10 bg-[radial-gradient(35%_50%_at_12%_35%,rgba(20,6,0,0.75),transparent_70%),radial-gradient(28%_45%_at_38%_75%,rgba(40,12,0,0.5),transparent_70%),radial-gradient(30%_50%_at_78%_20%,rgba(255,225,170,0.4),transparent_70%)] motion-safe:animate-[ai-partners-drift_16s_ease-in-out_infinite]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.25))]"
        />

        <ScrollItem index={1} count={4} variant="fromLeft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">{p.eyebrow}</p>
          <h2 className="mt-3 max-w-3xl font-heading text-[clamp(28px,3.6vw,56px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance">
            {p.title1} <span className="text-[#ffe4c2]">{p.title2}</span>
          </h2>
        </ScrollItem>
        <ScrollItem index={2} count={4} variant="fromLeft">
          <p className="mt-4 max-w-[62ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/85">{p.line}</p>
        </ScrollItem>

        {/* The logos: two identical rows side by side, sliding left by one row's width, forever - it bleeds out of the card's padding, so it runs
            from one edge of the card to the other, fading only in the last few pixels. */}
        <ScrollItem index={3} count={4} variant="fromRight">
        <div className="group/marquee -mx-[max(1.25rem,3vw)] mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)] sm:mt-12">
          <div className="ai-marquee flex w-max will-change-transform">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1}
                className="flex shrink-0 items-center gap-x-14 pr-14 whitespace-nowrap sm:gap-x-20 sm:pr-20"
              >
                {MODELS.map((model) => (
                  <li key={model.name} className="flex h-10 shrink-0 items-center text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
                    <span className="sr-only">{model.name}</span>
                    {model.mark}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        </ScrollItem>
      </ScrollItem>
      </ScrollStagger>
    </section>
  );
}
