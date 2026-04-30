"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ANIMATED_SHORT,
  ANIMATED_WIDE,
  AVATARS_WIDE,
  CARS_SHORT,
  CARS_WIDE,
  CONSTRUCTION_SHORT,
  CONSTRUCTION_WIDE,
  PRODUCT_SHORT,
  PRODUCT_WIDE,
  SERVICES_SHORT,
  SERVICES_WIDE,
  TV_SHORT,
  TV_WIDE,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_REFERRER_POLICY,
  type YouTubeEmbed,
} from "@/lib/youtube-embeds";
import {
  IconBottleFilled,
  IconCarFilled,
  IconCookieManFilled,
  IconDeviceTabletFilled,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDiamondFilled,
  IconLayoutGrid,
  IconHome2Filled,
  IconMickeyFilled,
} from "@tabler/icons-react";

/** Generous margin so tiles near the fold still get a callback; four-value form for Safari. */
const LAZY_IFRAME_ROOT_MARGIN = "200px 0px 200px 0px";

/** YouTube iframe mounts when near viewport (or immediately if `priority`). */
function LazyYouTubeIframe({
  src,
  title,
  iframeClassName,
  priority = false,
}: {
  src: string;
  title: string;
  iframeClassName: string;
  /** First above-the-fold slots: skip observer so the section always gets a player. */
  priority?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);

  useEffect(() => {
    if (priority || shouldLoad) return;

    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => {
        setShouldLoad(true);
      });
      return;
    }

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some(
          (e) => e.isIntersecting || e.intersectionRatio > 0
        );
        if (hit && !cancelled) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: LAZY_IFRAME_ROOT_MARGIN,
        threshold: [0, 0.01, 0.05],
      }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [priority, shouldLoad, src]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden rounded-[inherit] bg-muted/20"
    >
      {shouldLoad ? (
        <iframe
          className={iframeClassName}
          src={src}
          title={title}
          allow={YOUTUBE_IFRAME_ALLOW}
          allowFullScreen
          loading="lazy"
          referrerPolicy={YOUTUBE_REFERRER_POLICY}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-b from-muted/30 to-muted/50"
          aria-hidden
        />
      )}
    </div>
  );
}

function useInView(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => {
        setIsInView(true);
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

type AllLayoutSegment =
  | { kind: "pair"; wide: YouTubeEmbed; short: YouTubeEmbed; rowIdx: number }
  | { kind: "triple"; wide: YouTubeEmbed; left: YouTubeEmbed; right: YouTubeEmbed; rowIdx: number }
  | { kind: "wideOnly"; wide: YouTubeEmbed; rowIdx: number }
  | { kind: "shortGrid"; startIdx: number; embeds: YouTubeEmbed[] };

/** Build “All” layout: prefer L(short) + wide + R(short) rows on desktop, then wide-only, then batch remaining shorts. */
function buildAllFormatSegments(
  wideEmbeds: YouTubeEmbed[],
  shortEmbeds: YouTubeEmbed[]
): AllLayoutSegment[] {
  const segments: AllLayoutSegment[] = [];
  let wideIdx = 0;
  let shortIdx = 0;
  let rowIdx = 0;

  while (wideIdx < wideEmbeds.length || shortIdx < shortEmbeds.length) {
    const wide = wideEmbeds[wideIdx];
    const left = shortEmbeds[shortIdx];
    const right = shortEmbeds[shortIdx + 1];

    if (wide && left && right) {
      segments.push({ kind: "triple", wide, left, right, rowIdx });
      wideIdx += 1;
      shortIdx += 2;
      rowIdx += 1;
      continue;
    }

    if (wide && left) {
      segments.push({ kind: "pair", wide, short: left, rowIdx });
      wideIdx += 1;
      shortIdx += 1;
      rowIdx += 1;
      continue;
    }

    if (wide) {
      segments.push({ kind: "wideOnly", wide, rowIdx });
      wideIdx += 1;
      rowIdx += 1;
      continue;
    }

    if (shortIdx < shortEmbeds.length) {
      const startIdx = shortIdx;
      const embeds = shortEmbeds.slice(shortIdx);
      segments.push({ kind: "shortGrid", startIdx, embeds });
      break;
    }

    break;
  }

  return segments;
}

const PortfolioTabBody = memo(function PortfolioTabBody({
  wideEmbeds,
  shortEmbeds,
  format,
}: {
  wideEmbeds: YouTubeEmbed[];
  shortEmbeds: YouTubeEmbed[];
  format: "all" | "desktop" | "mobile";
}) {
  const isMobileOnly = format === "mobile";

  const allSegments = useMemo(
    () =>
      format === "all" ? buildAllFormatSegments(wideEmbeds, shortEmbeds) : [],
    [format, wideEmbeds, shortEmbeds]
  );

  return (
    <div className="w-full">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div>
        {format === "all" ? (
          <div className="flex flex-col gap-10 lg:gap-12">
            {allSegments.map((seg) => {
              if (seg.kind === "triple") {
                const { wide, left, right, rowIdx } = seg;
                return (
                  <div
                    key={`row-triple-${rowIdx}-${wide.src}`}
                    className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[clamp(220px,22vw,340px)_minmax(0,1fr)_clamp(220px,22vw,340px)] lg:gap-10"
                    style={{
                      animationName: "fadeSlideIn",
                      animationDuration: "0.45s",
                      animationTimingFunction: "ease",
                      animationFillMode: "both",
                      animationDelay: `${rowIdx * 90}ms`,
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="relative mx-auto aspect-[9/16] w-full max-w-[min(100%,420px)] overflow-hidden rounded-2xl border border-border/20 bg-card shadow-sm lg:max-w-none">
                        <LazyYouTubeIframe
                          key={left.src}
                          src={left.src}
                          title={left.title ?? "YouTube video"}
                          iframeClassName="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                          priority={rowIdx === 0}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/20 bg-card shadow-sm">
                        <LazyYouTubeIframe
                          key={wide.src}
                          src={wide.src}
                          title={wide.title ?? "YouTube video"}
                          iframeClassName="absolute inset-0 h-full w-full"
                          priority={rowIdx === 0}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative mx-auto aspect-[9/16] w-full max-w-[min(100%,420px)] overflow-hidden rounded-2xl border border-border/20 bg-card shadow-sm lg:max-w-none">
                        <LazyYouTubeIframe
                          key={right.src}
                          src={right.src}
                          title={right.title ?? "YouTube video"}
                          iframeClassName="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                          priority={false}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (seg.kind === "pair") {
                const { wide, short, rowIdx } = seg;
                return (
                  <div
                    key={`row-pair-${rowIdx}-${wide.src}`}
                    className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(220px,22vw,360px)] lg:gap-10"
                    style={{
                      animationName: "fadeSlideIn",
                      animationDuration: "0.45s",
                      animationTimingFunction: "ease",
                      animationFillMode: "both",
                      animationDelay: `${rowIdx * 90}ms`,
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/20 bg-card shadow-sm">
                        <LazyYouTubeIframe
                          key={wide.src}
                          src={wide.src}
                          title={wide.title ?? "YouTube video"}
                          iframeClassName="absolute inset-0 h-full w-full"
                          priority={rowIdx === 0}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-border/20 bg-card shadow-sm">
                        <LazyYouTubeIframe
                          key={short.src}
                          src={short.src}
                          title={short.title ?? "YouTube video"}
                          iframeClassName="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                          priority={false}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (seg.kind === "wideOnly") {
                const { wide, rowIdx } = seg;
                return (
                  <div
                    key={`row-wide-${rowIdx}-${wide.src}`}
                    className="grid grid-cols-1 gap-6 lg:gap-10"
                    style={{
                      animationName: "fadeSlideIn",
                      animationDuration: "0.45s",
                      animationTimingFunction: "ease",
                      animationFillMode: "both",
                      animationDelay: `${rowIdx * 90}ms`,
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/20 bg-card shadow-sm">
                        <LazyYouTubeIframe
                          key={wide.src}
                          src={wide.src}
                          title={wide.title ?? "YouTube video"}
                          iframeClassName="absolute inset-0 h-full w-full"
                          priority={rowIdx === 0}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              const { startIdx, embeds } = seg;
              return (
                <div
                  key={`short-grid-${startIdx}`}
                  className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10"
                  style={{
                    animationName: "fadeSlideIn",
                    animationDuration: "0.45s",
                    animationTimingFunction: "ease",
                    animationFillMode: "both",
                    animationDelay: `${startIdx * 90}ms`,
                  }}
                >
                  {embeds.map((embed) => (
                    <div key={embed.src} className="flex flex-col gap-3">
                      <div className="relative mx-auto aspect-[9/16] w-full max-w-[min(100%,420px)] overflow-hidden rounded-2xl border border-border/20 bg-card shadow-sm">
                        <LazyYouTubeIframe
                          key={embed.src}
                          src={embed.src}
                          title={embed.title ?? "YouTube video"}
                          iframeClassName="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                          priority={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : isMobileOnly ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {shortEmbeds.map((embed, idx) => (
              <div
                key={`short-${idx}`}
                className="flex flex-col gap-3"
                style={{
                  animationName: "fadeSlideIn",
                  animationDuration: "0.45s",
                  animationTimingFunction: "ease",
                  animationFillMode: "both",
                  animationDelay: `${idx * 70}ms`,
                }}
              >
                <div className="relative rounded-2xl overflow-hidden border border-border/20 bg-card aspect-[9/16] shadow-sm">
                  <LazyYouTubeIframe
                    key={embed.src}
                    src={embed.src}
                    title={embed.title ?? "YouTube video"}
                    iframeClassName="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                    priority={idx === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {wideEmbeds.map((embed, idx) => (
              <div
                key={`wide-${idx}`}
                className="flex flex-col gap-3"
                style={{
                  animationName: "fadeSlideIn",
                  animationDuration: "0.45s",
                  animationTimingFunction: "ease",
                  animationFillMode: "both",
                  animationDelay: `${idx * 70}ms`,
                }}
              >
                <div className="relative rounded-2xl overflow-hidden bg-card border border-border/20 shadow-sm aspect-video">
                  <LazyYouTubeIframe
                    key={embed.src}
                    src={embed.src}
                    title={embed.title ?? "YouTube video"}
                    iframeClassName="absolute inset-0 h-full w-full"
                    priority={idx === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

function embedsForCategory(category: string) {
  switch (category) {
    case "construction":
      return { wide: CONSTRUCTION_WIDE, short: CONSTRUCTION_SHORT };
    case "mascots": // avatars
      return { wide: AVATARS_WIDE, short: [] as YouTubeEmbed[] };
    case "cars":
      return { wide: CARS_WIDE, short: CARS_SHORT };
    case "tv":
      return { wide: TV_WIDE, short: TV_SHORT };
    case "product":
      return { wide: PRODUCT_WIDE, short: PRODUCT_SHORT };
    case "services":
      return { wide: SERVICES_WIDE, short: SERVICES_SHORT };
    case "animated":
      return { wide: ANIMATED_WIDE, short: ANIMATED_SHORT };
    default:
      return { wide: [] as YouTubeEmbed[], short: [] as YouTubeEmbed[] };
  }
}

/**
 * Curated “All” feed: first rows mix categories (not only construction), then fills
 * remaining clips; **last row is short-only (9:16)** so it never spans full page width.
 */
function embedsForAll() {
  const { wide: wCon, short: sCon } = embedsForCategory("construction");
  const { wide: wMas } = embedsForCategory("mascots");
  const { wide: wCar, short: sCar } = embedsForCategory("cars");
  const { wide: wTv, short: sTv } = embedsForCategory("tv");
  const { wide: wPr, short: sPr } = embedsForCategory("product");
  const { wide: wSer, short: sSer } = embedsForCategory("services");
  const { short: sAnim } = embedsForCategory("animated");

  const wide = [
    wTv[0],
    wMas[0],
    wCar[0],
    wPr[0],
    wSer[0],
    wCon[0],
    wCon[1],
    wTv[1],
    wCon[2],
    wMas[1],
    wCon[3],
    wPr[7],
    wSer[3],
    wSer[4],
  ].filter((e): e is YouTubeEmbed => Boolean(e));

  // Short column order: swap 1st ↔ 4th vertical (was sTv[0] / sCon[0])
  const short = [
    sCon[0],
    sPr[0],
    sPr[1],
    sPr[2],
    sCar[0],
    sCar[1],
    sTv[0],
    sSer[0],
    sSer[1],
    sCon[1],
    sCon[2],
    sTv[1],
    sCon[3],
    sCon[4],
    sTv[2],
    sPr[3],
    sPr[4],
    sPr[5],
    sPr[6],
    sSer[2],
    sTv[3],
    sTv[4],
    sAnim[0],
  ].filter((e): e is YouTubeEmbed => Boolean(e));

  return { wide, short };
}

export function PortfolioSection() {
  const { ref } = useInView();
  const { t } = useLanguage();
  const [format, setFormat] = useState<"all" | "desktop" | "mobile">("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const CATEGORIES: { key: string; label: string; icon: React.ReactNode }[] = useMemo(
    () => [
      // Use `size-*` so shadcn `Button` doesn't clamp SVGs to `size-4`.
      { key: "all", label: t.portfolio.categories.all, icon: <IconLayoutGrid className="size-6 sm:size-7" /> },
      { key: "construction", label: t.portfolio.categories.construction, icon: <IconHome2Filled className="size-6 sm:size-7" /> },
      { key: "mascots", label: t.portfolio.categories.mascots, icon: <IconCookieManFilled className="size-6 sm:size-7" /> },
      { key: "tv", label: t.portfolio.categories.tv, icon: <IconDiamondFilled className="size-6 sm:size-7" /> },
      { key: "cars", label: t.portfolio.categories.cars, icon: <IconCarFilled className="size-6 sm:size-7" /> },
      { key: "product", label: t.portfolio.categories.product, icon: <IconBottleFilled className="size-6 sm:size-7" /> },
      { key: "services", label: t.portfolio.categories.services, icon: <IconDeviceTabletFilled className="size-6 sm:size-7" /> },
      { key: "animated", label: t.portfolio.categories.animated, icon: <IconMickeyFilled className="size-6 sm:size-7" /> },
    ],
    [t]
  );

  const embeds = useMemo(
    () => (activeCategory === "all" ? embedsForAll() : embedsForCategory(activeCategory)),
    [activeCategory]
  );

  const isActiveTab = (key: string) => key === activeCategory;

  const categoryChipClass = (active: boolean) =>
    cn(
      "group relative shrink-0 cursor-pointer rounded-full font-semibold inline-flex items-center gap-1.5",
      "h-9 px-3 text-xs sm:h-10 sm:gap-2 sm:px-4 sm:text-sm",
      "border border-transparent !shadow-none hover:!shadow-none focus-visible:!shadow-none active:!shadow-none",
      "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out will-change-transform",
      active
        ? "border-white/15 bg-gradient-to-br from-primary via-primary to-[var(--primary-gradient-end)] text-primary-foreground hover:brightness-[1.06] hover:text-primary-foreground"
        : cn(
            "border-border/50 bg-background/80 text-foreground dark:border-border/40 dark:bg-input/25",
            "hover:-translate-y-[1px] hover:bg-muted/60 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
            "hover:border-transparent"
          )
    );

  return (
      <section id="portfolio" className="relative w-full overflow-visible pt-2 pb-6 sm:pt-3" ref={ref}>
        <div className="relative z-10 mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10">
          {/* Fade title only — never wrap lazy iframes in `opacity-0` (breaks IntersectionObserver on WebKit). */}
          <div
            className={"mb-6"}
          >
            <h2 className="font-heading mb-3 text-4xl font-bold text-foreground md:text-5xl">
              {t.portfolio.title1}{" "}
              <span className="text-section-accent">{t.portfolio.title2}</span>
            </h2>
            <p className="max-w-xl text-base text-muted-foreground">{t.portfolio.subtitle}</p>
          </div>

          {/* Sticky controls + grid stay fully opaque so lazy IO works reliably */}
          <div className="flex flex-col gap-8 pb-12">
            <div className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-40 -mx-4 flex flex-col gap-2 px-4 sm:-mx-6 sm:px-6 sm:gap-2.5 lg:top-[7.25rem] lg:-mx-10 lg:px-10">
              {/* Categories (top) */}
              <div className="w-fit max-w-full rounded-full border border-border/25 bg-background/95 p-1 shadow-[0_12px_40px_rgba(15,23,42,0.15)] backdrop-blur-lg supports-[backdrop-filter]:bg-background/85 dark:border-border/30 dark:shadow-[0_12px_48px_rgba(0,0,0,0.45)]">
                <div className="relative rounded-full bg-muted/10 px-2 py-1 sm:px-2.5">
                  <div className="flex w-fit max-w-full items-center gap-1.5 overflow-x-auto overflow-y-hidden py-0.5 no-scrollbar">
                    {CATEGORIES.map((cat) => (
                      <Button
                        key={cat.key}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveCategory(cat.key)}
                        className={categoryChipClass(isActiveTab(cat.key))}
                      >
                        <span
                          className={cn(
                            "opacity-90 transition-transform duration-200 ease-out",
                            !isActiveTab(cat.key) && "group-hover:scale-[1.06]",
                            isActiveTab(cat.key) && "text-primary-foreground opacity-100"
                          )}
                        >
                          {cat.icon}
                        </span>
                        <span>{cat.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resolution tabs (bottom) — hug content on mobile; same on sm+ */}
              <div className="w-fit max-w-full self-start rounded-full border border-border/25 bg-background/95 px-2 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-lg supports-[backdrop-filter]:bg-background/85 dark:border-border/30 dark:shadow-[0_12px_48px_rgba(0,0,0,0.45)] sm:px-3 sm:py-2">
                <Tabs
                  value={format}
                  onValueChange={(v) => {
                    if (v === "all" || v === "desktop" || v === "mobile") {
                      setFormat(v);
                    }
                  }}
                  className="w-auto"
                >
                  <TabsList
                    variant="default"
                    className={cn(
                      "h-auto min-h-8 w-fit max-w-full justify-center gap-0.5 rounded-2xl border-0 bg-muted/25 p-0.5 text-[10px] shadow-none",
                      "sm:min-h-8 sm:text-[11px]"
                    )}
                  >
                    <TabsTrigger
                      value="all"
                      aria-label={t.portfolio.format.all}
                      className={cn(
                        "cursor-pointer flex-none rounded-2xl border border-transparent px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-white/15 data-active:bg-gradient-to-br data-active:from-primary data-active:via-primary data-active:to-[var(--primary-gradient-end)] data-active:text-white data-active:!shadow-none",
                        "[&_svg]:icon-on-brand data-active:[&_svg]:text-white data-active:[&_svg]:filter-none",
                        "hover:text-foreground data-active:hover:brightness-[1.06] data-active:hover:text-white"
                      )}
                    >
                      <IconLayoutGrid className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="desktop"
                      aria-label={t.portfolio.format.desktop}
                      className={cn(
                        "cursor-pointer flex-none gap-0.5 rounded-2xl border border-transparent px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-white/15 data-active:bg-gradient-to-br data-active:from-primary data-active:via-primary data-active:to-[var(--primary-gradient-end)] data-active:text-white data-active:!shadow-none",
                        "[&_svg]:icon-on-brand data-active:[&_svg]:text-white data-active:[&_svg]:filter-none",
                        "hover:text-foreground data-active:hover:brightness-[1.06] data-active:hover:text-white"
                      )}
                    >
                      <IconDeviceDesktop className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="pl-0.5">{t.portfolio.format.ratio169}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="mobile"
                      aria-label={t.portfolio.format.mobile}
                      className={cn(
                        "cursor-pointer flex-none gap-0.5 rounded-2xl border border-transparent px-1.5 py-1 text-[10px] font-semibold shadow-none sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-white/15 data-active:bg-gradient-to-br data-active:from-primary data-active:via-primary data-active:to-[var(--primary-gradient-end)] data-active:text-white data-active:!shadow-none",
                        "[&_svg]:icon-on-brand data-active:[&_svg]:text-white data-active:[&_svg]:filter-none",
                        "hover:text-foreground data-active:hover:brightness-[1.06] data-active:hover:text-white"
                      )}
                    >
                      <IconDeviceMobile className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="pl-0.5">{t.portfolio.format.ratio916}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <PortfolioTabBody
              key={`${activeCategory}-${format}`}
              wideEmbeds={embeds.wide}
              shortEmbeds={embeds.short}
              format={format}
            />
          </div>

          {/*
          Legacy layout: left sidebar + right content (replaced by sticky top tab bar + full-width grid).

          <div className="mb-8 hidden min-h-0 gap-10 lg:grid lg:grid-cols-[240px_1fr] lg:items-stretch">
            <div className="min-h-0 min-w-0">
              <div className="sticky top-28 max-h-[calc(100svh-7rem)] overflow-y-auto rounded-2xl border border-border/20 bg-background/40 p-3 shadow-elevated-soft backdrop-blur-md">
                <div className="mb-3">{FormatToggle}</div>
                <div className="flex flex-col gap-1">…category buttons…</div>
              </div>
            </div>
            <div className="min-w-0"><PortfolioTabBody … /></div>
          </div>
          */}
        </div>
    </section>
  );
}
