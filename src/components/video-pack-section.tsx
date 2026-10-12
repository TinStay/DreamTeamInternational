"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconPlayerPlayFilled } from "@tabler/icons-react";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { TiltedGridHero, type TiltedGridItem } from "@/components/ui/tilted-grid-hero";
import { ClipLightbox } from "@/components/projects/story/primitives";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyMp4Url, bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { VIDEO_PACK } from "@/lib/video-pack";
import { pricingPath } from "@/lib/routes";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { VideoPackRail } from "@/components/video-pack-rail";

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
 * same, for the keyboard and screen readers (out of sight until focused). Above the carousel, left-aligned on the page
 * margin: the heading running wide (one line on a laptop), its line, and the two ways in - "Get a subscription" (the
 * orange pill) or "Get one video" (a plain text link). Nothing else - the video sales letter lives in "How it works".
 *
 * The cards play their films (muted, looping, only while on screen): one hidden video per card, drawn across the card's 16
 * curved strips (`TiltedGridHero` - one decoder a card), over the poster until it loads. A click plays it with sound in the
 * lightbox.
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
        // The film plays on the card while it is on screen (the poster until it has loaded).
        video: bunnyMp4Url(item.clip!, 720),
        alt: p.items[item.key].title,
        caption: <PackCaption title={p.items[item.key].title} line={p.items[item.key].line} watch={p.watch} />,
      })),
    [packs, p],
  );
  const current = open !== null ? packs[open] : null;
  const panel = current?.clip ? { clip: current.clip, title: p.items[current.key].title } : null;

  return (
    <div id="video-pack">
      {/* Phones keep the rail of video windows (swipe through them); the curved carousel is for larger screens. Both are in
          the page and CSS picks one, so nothing changes after the page loads. */}
      <div className="md:hidden">
        <VideoPackRail />
      </div>
    <section className="relative hidden flex-col justify-start overflow-x-clip pt-[5.25rem] pb-10 text-white md:flex">
      {/* The heading running wide, its line and the two ways in - left-aligned on the page margin. */}
      <div className="w-full px-[max(1.25rem,3vw)]">
        <div className="min-w-0">
          <h2 className={cn("font-heading text-[clamp(34px,4.6vw,96px)] font-black uppercase leading-[0.92] tracking-[-0.01em] md:whitespace-nowrap", PEARL_INK)}>
            {p.title}
          </h2>
          <p className="mt-4 max-w-[72ch] text-[clamp(15px,1.15vw,19px)] leading-relaxed text-white/65">{p.subtitle}</p>
          {/* The two ways in: a subscription (the orange pill, the Business plans) or one video. */}
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <TigerCta href={`${pricingPath(language)}?for=business`} label={p.subscribe} className="tiger-cta--orange" />
            <Link
              href={`${pricingPath(language)}?for=individual`}
              className="group inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[15px] text-white/65 transition-colors duration-200 hover:text-white"
            >
              {p.oneVideo}
              <IconArrowRight className="size-4 shrink-0 text-primary transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {/* The curved row along the bottom: the rest of the first screen, so the cards are big (sized by the screen's height,
          never pushed below the fold on a wide, short screen). */}
      <TiltedGridHero
        items={items}
        onSelect={setOpen}
        speed={9}
        tileHeight={phone ? 66 : 72}
        maxWidth={phone ? 84 : 42}
        curve={phone ? 58 : 38}
        fade={phone ? 6 : 8}
        gap={8}
        radius="1rem"
        aria-label={p.carouselLabel}
        className="mt-6 h-[clamp(16rem,50svh,26rem)] w-full md:mt-8 md:h-[clamp(18rem,calc(100svh-24rem),44rem)]"
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
        panel={panel}
        closeLabel={p.close}
        onClose={() => setOpen(null)}
      />
    </section>
    </div>
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
