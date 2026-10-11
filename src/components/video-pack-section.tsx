"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconClockFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { TiltedGridHero, type TiltedGridItem } from "@/components/ui/tilted-grid-hero";
import { ClipLightbox } from "@/components/projects/story/primitives";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyMp4Url, bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { HOME_VSL, VIDEO_PACK } from "@/lib/video-pack";
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
 * same, for the keyboard and screen readers (out of sight until focused). The heading and the two ways in - "Get a
 * subscription" (the orange pill) or "Get one video" (a plain text link) - are centred above the carousel.
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
  // The lightbox plays a card's film (`open` = its index) or the VSL (`-1`).
  const current = open !== null && open >= 0 ? packs[open] : null;
  const panel = open === -1 && HOME_VSL ? { clip: HOME_VSL, title: p.vsl.title } : current?.clip ? { clip: current.clip, title: p.items[current.key].title } : null;

  return (
    <div id="video-pack">
      {/* Phones keep the rail of video windows (swipe through them); the curved carousel is for larger screens. Both are in
          the page and CSS picks one, so nothing changes after the page loads. */}
      <div className="md:hidden">
        <VideoPackRail />
      </div>
    <section className="relative hidden flex-col justify-start overflow-x-clip pt-[5.25rem] pb-10 text-white md:flex">
      {/* Two columns: the heading, its line and the two ways in on the left; the video sales letter on the right. */}
      <div className="grid w-full items-center gap-8 px-[max(1.25rem,3vw)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
        <div className="min-w-0">
          <h2 className={cn("font-heading text-[clamp(30px,4.2vw,72px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance", PEARL_INK)}>
            {p.title}
          </h2>
          <p className="mt-4 max-w-[60ch] text-[clamp(14px,1.05vw,17px)] leading-relaxed text-white/65">{p.subtitle}</p>
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
        {/* Sized by the screen's height too (a wide, short screen would make it tall enough to push the carousel out of view):
            at most as tall as the room left over the carousel, right-aligned in its column. */}
        <VslFrame onPlay={HOME_VSL ? () => setOpen(-1) : undefined} copy={p.vsl} className="justify-self-end md:max-w-[max(20rem,calc((100svh-33rem)*16/9))]" />
      </div>

      {/* The curved row along the bottom, a band under the heading and the VSL. */}
      <TiltedGridHero
        items={items}
        onSelect={setOpen}
        speed={9}
        tileHeight={phone ? 66 : 64}
        maxWidth={phone ? 84 : 30}
        curve={phone ? 58 : 38}
        fade={phone ? 6 : 8}
        gap={8}
        radius="1rem"
        aria-label={p.carouselLabel}
        className="mt-6 h-[clamp(16rem,50svh,26rem)] w-full md:mt-5 md:h-[clamp(13rem,calc(100svh-33rem),28rem)]"
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

/**
 * The video sales letter's frame (top right of the desktop hero): a 16:9 window in the site's dark glass with an orange
 * edge, the play disc in a slow pulse, the title and its length. Until `HOME_VSL` is set (`lib/video-pack.ts`) it is a
 * branded placeholder - "video coming soon", nothing to click; with a film it shows the poster and plays it in the
 * lightbox.
 */
function VslFrame({ onPlay, copy, className }: { onPlay?: () => void; copy: { title: string; length: string; soon: string; play: string }; className?: string }) {
  const poster = HOME_VSL ? bunnyThumbnailUrl(HOME_VSL) : null;
  const body = (
    <>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- the Bunny poster's pull zone is referer-gated, never optimised
        <img src={poster} alt="" referrerPolicy="origin" className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
      ) : (
        <>
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_110%,rgba(255,106,20,0.28),transparent_70%),radial-gradient(50%_60%_at_15%_0%,rgba(255,176,102,0.10),transparent_70%),#0b0c0e]" />
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </>
      )}
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.75),rgba(0,0,0,0.1)_55%,transparent)]" />
      {/* The play disc, in a slow pulse. */}
      <span className="absolute top-1/2 left-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full border border-[#ff8a1f]/50 motion-safe:animate-ping [animation-duration:3s]" />
        <span className="relative flex size-16 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] shadow-[0_0_40px_rgba(255,122,26,0.6)] transition-transform duration-300 group-hover:scale-110">
          <IconPlayerPlayFilled className="ml-0.5 size-7 text-white" aria-hidden />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-left">
        <span className="min-w-0">
          <span className="block font-heading text-lg leading-tight font-black uppercase lg:text-xl">{copy.title}</span>
          <span className="mt-1 block text-sm text-white/60">{onPlay ? copy.play : copy.soon}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
          <IconClockFilled className="size-3.5 text-[#ff8a1f]" aria-hidden />
          {copy.length}
        </span>
      </span>
    </>
  );
  const frame =
    "group relative block aspect-video w-full overflow-hidden rounded-2xl border border-[#ff8a1f]/30 bg-[#0b0c0e] text-white shadow-[0_30px_80px_-30px_rgba(255,106,20,0.45),0_24px_60px_-30px_rgba(0,0,0,0.9)]";
  return onPlay ? (
    <button type="button" onClick={onPlay} aria-label={`${copy.play}: ${copy.title}`} className={cn(frame, "cursor-pointer transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-[#ff8a1f]/60", className)}>
      {body}
    </button>
  ) : (
    <div role="img" aria-label={`${copy.title} - ${copy.soon}`} className={cn(frame, className)}>
      {body}
    </div>
  );
}
