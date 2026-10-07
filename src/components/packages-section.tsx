"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunnyMp4Url, type BunnyVideo } from "@/lib/bunny-stream";
import { PACKAGE_FILMS } from "@/lib/package-films";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { contactProcessPath, portfolioPath, pricingPath } from "@/lib/routes";

/** The kinds of video in the grid, in order: the header's tabs first, then the rest. Words in `packages.items`, the
 *  picture at `public/packages/<key>.webp` (1200 x 675). */
const PACKAGES = [
  "socialAds",
  "corporate",
  "tvAds",
  "productVideos",
  "brandMascots",
  "motionGraphics",
  "launchVideos",
  "explainerVideos",
  "ugcAds",
  "realEstate",
  "musicVideos",
] as const;

/**
 * A package card's film, over its still picture: muted, looping, cover-fit. It is fetched and played only while the
 * card is mostly on screen (so one or two run at a time) and paused as soon as it leaves; it fades in once it is really
 * playing, so until then (and if the clip is not ready, or under reduced motion) the picture shows. A phone gets the
 * smaller 480p rendition.
 */
function PackageFilm({ clip }: { clip: BunnyVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const onScreen = useRef(false);
  const phone = useMediaQuery(PHONE_QUERY);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const url = bunnyMp4Url(clip, phone ? 480 : 720);

  useEffect(() => {
    const video = ref.current;
    const frame = video?.parentElement;
    if (!video || !frame) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting && !reduceMotion;
        if (onScreen.current) {
          setSrc((current) => current ?? url);
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(frame);
    // The browser pauses a video on a hidden page: pick it up again when the page comes back.
    const onVisible = () => {
      if (document.visibilityState === "visible" && onScreen.current) void video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url]);

  // The film was just attached (the card came on screen): start it - `play()` is what makes a `preload="none"` video load.
  useEffect(() => {
    if (src && onScreen.current) void ref.current?.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={ref}
      src={src ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      onLoadedData={(event) => {
        if (onScreen.current) void event.currentTarget.play().catch(() => {});
      }}
      onPlaying={() => setPlaying(true)}
      className={`absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-105 ${
        playing ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

/**
 * The English home page's "Find the package that fits your needs" (in place of the services + quote wizard): a
 * left-aligned heading on the page margin, then a grid of the kinds of video we make. Each card is its picture with only
 * the name on it (Archivo, on a soft black gradient) - and where there is a film for the kind (`lib/package-films.ts`)
 * it plays over the picture while the card is on screen; on hover - or keyboard focus - the picture dims to half black, the
 * name rises and its line and two buttons slide in under it: get the package (the plans) or see examples (the
 * portfolio). On a touch screen, which has no hover, the details are always shown. Under the grid, the two ways on:
 * compare the packages (the orange pill) or ask for something custom.
 */
export function PackagesSection() {
  const { t, language } = useLanguage();
  const p = t.packages;
  const items = p.items as Record<string, { title: string; line: string }>;
  const plansHref = `${pricingPath(language)}?for=business`;

  return (
    <section id="packages" className="relative px-[max(1.25rem,3vw)] py-12 text-white sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{p.eyebrow}</p>
        <h2 className="mt-3 font-heading text-[clamp(30px,3.8vw,60px)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-balance">
          {p.title1} <span className="text-section-accent">{p.title2}</span>
        </h2>
        <p className="mt-4 max-w-[62ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/65">{p.subtitle}</p>
      </header>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 xl:grid-cols-4">
        {PACKAGES.map((key) => (
          <li
            key={key}
            // Hover / focus-within drive everything inside through `group`; on a device without hover
            // (`[@media(hover:none)]`) the open state is simply the resting one.
            className="group @container relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#141518] shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-[#ff7a1a]/45 hover:shadow-[0_30px_60px_-28px_rgba(255,106,20,0.35)] focus-within:border-[#ff7a1a]/45"
          >
            <Image
              src={`/packages/${key}.webp`}
              alt=""
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {PACKAGE_FILMS[key] ? <PackageFilm clip={PACKAGE_FILMS[key]} /> : null}
            {/* Resting: a soft black gradient under the name. Open: the whole picture at half black. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.35)_35%,rgba(0,0,0,0)_60%)]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-500 ease-out group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            />

            <div className="absolute inset-x-0 bottom-0 p-4 @[20rem]:p-5">
              <h3 className="font-heading text-lg font-black uppercase leading-tight tracking-tight xl:text-xl">
                {items[key].title}
              </h3>
              {/* The details: collapsed to nothing at rest (a grid row from 0fr to 1fr, so the height animates),
                  sliding up and fading in on hover. */}
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]">
                <div className="min-h-0 overflow-hidden">
                  <div className="translate-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-out group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/80">{items[key].line}</p>
                    <div className="mt-3 flex flex-nowrap items-center gap-1.5 @[20rem]:gap-2">
                      <Link
                        href={plansHref}
                        className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_40%,#ffb066_100%)] px-3 text-xs font-semibold @[20rem]:px-3.5 @[20rem]:text-[13px] whitespace-nowrap text-white shadow-[0_8px_24px_-8px_rgba(255,106,20,0.7)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-8px_rgba(255,106,20,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {p.getPackage}
                        <IconArrowUpRight className="hidden size-3.5 @[20rem]:block" aria-hidden />
                      </Link>
                      <Link
                        href={`${portfolioPath(language)}?category=${key}`}
                        className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border border-white/40 bg-white/10 px-3 text-xs font-semibold @[20rem]:px-3.5 @[20rem]:text-[13px] whitespace-nowrap text-white backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {p.seeExamples}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <TigerCta href={plansHref} label={p.compare} className="tiger-cta--orange" />
        <Link
          href={contactProcessPath(language)}
          className="group inline-flex items-center gap-1.5 text-[15px] text-white/65 transition-colors duration-200 hover:text-white"
        >
          {p.custom}
          <IconArrowRight
            className="size-4 text-[#ff8a1f] transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
