"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconPlayerPlayFilled } from "@tabler/icons-react";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { TiltedGridHero, type TiltedGridItem } from "@/components/ui/tilted-grid-hero";
import { ClipLightbox } from "@/components/projects/story/primitives";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { VIDEO_PACK } from "@/lib/video-pack";
import { pricingPath } from "@/lib/routes";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";

/** The orange pearl, as ink (the headline). */
const PEARL_INK =
  "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent";

/**
 * The English home page's first screen, above the tiger hero: the "Get your AI video pack now" headline in the orange
 * pearl and its line, then the kinds of video we make (`lib/video-pack.ts`) as a **curved 3D carousel**
 * (`ui/tilted-grid-hero.tsx`): the cards stream round the inside of a cylinder, flat in the middle and bending toward
 * the viewer at the faded ends. It drifts on its own and slows under the pointer; a mouse drag or a swipe turns it (with
 * a fling), and so does horizontal trackpad scrolling - the page's own vertical scrolling is untouched. A click on a card
 * plays its film in the lightbox (`ClipLightbox`, with sound and controls); the row of category chips under it does the
 * same, for the keyboard and screen readers (out of sight until focused). The heading and the two ways in - "Get a
 * subscription" (the orange pill) or "Get one video" (a plain text link) - are centred above the carousel.
 *
 * The cards show each film's poster - every card is cut into 16 facets to curve, so a playing film there would be 16
 * decoders; the film plays in the lightbox instead.
 */
export function VideoPackSection() {
  const { t, language } = useLanguage();
  const p = t.videoPack;
  const phone = useMediaQuery(PHONE_QUERY);
  const [open, setOpen] = useState<number | null>(null);

  const packs = useMemo(() => VIDEO_PACK.filter((item) => item.clip), []);
  const items: TiltedGridItem[] = useMemo(
    () =>
      packs.map((item) => ({
        src: bunnyThumbnailUrl(item.clip!),
        alt: p.items[item.key].title,
        caption: <PackCaption title={p.items[item.key].title} line={p.items[item.key].line} watch={p.watch} />,
      })),
    [packs, p],
  );
  const current = open !== null ? packs[open] : null;

  return (
    <section id="video-pack" className="relative flex flex-col justify-start overflow-x-clip pt-[6.75rem] pb-10 text-white sm:pt-[7.5rem]">
      {/* The heading, centred. */}
      <div className="flex w-full flex-col items-center px-[max(1.25rem,3vw)] text-center">
        <h2 className={cn("font-heading text-[clamp(30px,3.8vw,60px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance", PEARL_INK)}>
          {p.title}
        </h2>
        <p className="mt-3 max-w-[72ch] text-[clamp(13px,0.95vw,15px)] leading-normal text-white/65">{p.subtitle}</p>
      </div>

      {/* The two ways in, centred above the carousel: a subscription (the orange pill, the Business plans) or one video. */}
      <div className="relative z-10 mt-5 flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 px-[max(1.25rem,3vw)]">
        <TigerCta href={`${pricingPath(language)}?for=business`} label={p.subscribe} className="tiger-cta--orange" />
        <Link
          href={`${pricingPath(language)}?for=individual`}
          className="group inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[15px] text-white/65 transition-colors duration-200 hover:text-white"
        >
          {p.oneVideo}
          <IconArrowRight className="size-4 shrink-0 text-primary transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>

      {/* The curved row: as tall as the screen allows under the heading; a card is about half its height (a third of the
          width at most), so three cards and the bending ends fit, and the swelling ends stay inside the band. */}
      <TiltedGridHero
        items={items}
        onSelect={setOpen}
        speed={9}
        tileHeight={phone ? 66 : 66}
        maxWidth={phone ? 84 : 42}
        curve={phone ? 58 : 70}
        fade={phone ? 6 : 8}
        gap={8}
        radius="1rem"
        aria-label={p.carouselLabel}
        className="mt-2 h-[clamp(16rem,50svh,26rem)] w-full md:mt-3 md:h-[clamp(22rem,calc(100svh-23rem),48rem)]"
      />

      {/* The kinds of video as buttons - each plays its film too. The keyboard's and screen readers' way in (the curved row
          itself is a picture): out of sight, shown only while one of them has focus. */}
      <ul aria-label={p.carouselLabel} className="sr-only flex-wrap items-center justify-center gap-2 px-[max(1.25rem,3vw)] focus-within:not-sr-only focus-within:mt-2 focus-within:flex">
        {packs.map((item, index) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-[13px] font-semibold text-white/70 transition-[transform,border-color,background-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff8a1f]/55 hover:bg-[#ff7a1a]/10 hover:text-white"
            >
              <IconPlayerPlayFilled className="size-3 text-[#ff8a1f] transition-transform duration-200 group-hover:scale-125" aria-hidden />
              {p.items[item.key].title}
            </button>
          </li>
        ))}
      </ul>

      <ClipLightbox
        panel={current?.clip ? { clip: current.clip, title: p.items[current.key].title } : null}
        closeLabel={p.close}
        onClose={() => setOpen(null)}
      />
    </section>
  );
}

/**
 * The caption over a card: a black gradient rising from the bottom with the title (Archivo uppercase, orange on hover) and
 * its line, and a round play mark - sized off the carousel's height (`cqh`), since the card scales with it.
 */
function PackCaption({ title, line, watch }: { title: string; line: string; watch: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.5)_45%,rgba(0,0,0,0)_100%)]" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/10 ring-inset" />
      <span className="pointer-events-none absolute top-[5%] right-[3.5%] flex size-[clamp(28px,8cqh,48px)] items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm transition-[background-color,transform] duration-300 group-hover/tile:scale-110 group-hover/tile:bg-[#ff6a14]">
        <IconPlayerPlayFilled className="size-[45%]" aria-hidden />
        <span className="sr-only">{watch}</span>
      </span>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-[4%]">
        <h3 className="font-heading text-[clamp(14px,5cqh,30px)] leading-none font-black tracking-tight uppercase transition-colors duration-200 group-hover/tile:text-[#ff8a1f]">
          {title}
        </h3>
        <p className="mt-[1.2%] max-w-[46ch] text-[clamp(10px,2.1cqh,14px)] text-white/80">{line}</p>
      </div>
    </>
  );
}
