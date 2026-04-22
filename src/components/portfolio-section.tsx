"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AVATARS_WIDE,
  CARS_SHORT,
  CARS_WIDE,
  CONSTRUCTION_SHORT,
  CONSTRUCTION_WIDE,
  PRODUCT_SHORT,
  PRODUCT_WIDE,
  TV_SHORT,
  TV_WIDE,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_REFERRER_POLICY,
  type YouTubeEmbed,
} from "@/lib/youtube-embeds";
import {
  Car,
  Grid2X2,
  Hammer,
  Monitor,
  Package,
  Smartphone,
  Sparkles,
  Tv,
  Wand2,
} from "lucide-react";

/** Generous vertical margin so short tiles get a callback while scrolling; four-value form for Safari. */
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

function PortfolioTabBody({
  wideEmbeds,
  shortEmbeds,
  format,
}: {
  wideEmbeds: YouTubeEmbed[];
  shortEmbeds: YouTubeEmbed[];
  format: "all" | "desktop" | "mobile";
}) {
  const isMobileOnly = format === "mobile";

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
            {Array.from({ length: Math.max(wideEmbeds.length, shortEmbeds.length) }).map((_, idx) => {
              const wide = wideEmbeds[idx];
              const short = shortEmbeds[idx];
              const hasWide = Boolean(wide);
              const hasShort = Boolean(short);

              return (
              <div
                key={`row-${idx}`}
                className={cn(
                  "grid grid-cols-1 gap-6 lg:gap-10 items-stretch",
                  hasWide && hasShort
                    ? "lg:grid-cols-[minmax(0,1fr)_clamp(220px,22vw,360px)]"
                    : "lg:grid-cols-1"
                )}
                style={{
                  animationName: "fadeSlideIn",
                  animationDuration: "0.45s",
                  animationTimingFunction: "ease",
                  animationFillMode: "both",
                  animationDelay: `${idx * 90}ms`,
                }}
              >
                {hasWide && (
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-2xl overflow-hidden bg-card border border-border/20 shadow-sm aspect-video">
                      <LazyYouTubeIframe
                        src={wide.src}
                        title={wide.title ?? "YouTube video"}
                        iframeClassName="absolute inset-0 h-full w-full"
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                )}

                {hasShort && (
                  <div
                    className={cn(
                      "flex flex-col gap-3",
                      !hasWide && "mx-auto w-full max-w-[min(100%,380px)] lg:max-w-[420px]"
                    )}
                  >
                    <div className="relative rounded-2xl overflow-hidden border border-border/20 bg-card aspect-[9/16] shadow-sm">
                      <LazyYouTubeIframe
                        src={short.src}
                        title={short.title ?? "YouTube video"}
                        iframeClassName="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                )}
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
                    src={embed.src}
                    title={embed.title ?? "YouTube video"}
                    iframeClassName="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                    priority={idx < 2}
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
                    src={embed.src}
                    title={embed.title ?? "YouTube video"}
                    iframeClassName="absolute inset-0 h-full w-full"
                    priority={idx < 2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const wide: YouTubeEmbed[] = [
    wTv[0]!,
    wMas[0]!,
    wCar[0]!,
    wPr[0]!,
    wCon[0]!,
    wCon[1]!,
    wTv[1]!,
    wCon[2]!,
    wMas[1]!,
  ];

  // Short column order: swap 1st ↔ 4th vertical (was sTv[0] / sCon[0])
  const short: YouTubeEmbed[] = [
    sCon[0]!,
    sPr[0]!,
    sCar[0]!,
    sTv[0]!,
    sCon[1]!,
    sCon[2]!,
    sTv[1]!,
    sCon[3]!,
    sCon[4]!,
    sTv[2]!,
  ];

  return { wide, short };
}

export function PortfolioSection() {
  const { ref, isInView } = useInView();
  const { t } = useLanguage();
  const [format, setFormat] = useState<"all" | "desktop" | "mobile">("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const CATEGORIES: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: t.portfolio.categories.all, icon: <Grid2X2 className="h-5 w-5" /> },
    { key: "construction", label: t.portfolio.categories.construction, icon: <Hammer className="h-5 w-5" /> },
    { key: "mascots", label: t.portfolio.categories.mascots, icon: <Sparkles className="h-5 w-5" /> },
    { key: "tv", label: t.portfolio.categories.tv, icon: <Tv className="h-5 w-5" /> },
    { key: "cars", label: t.portfolio.categories.cars, icon: <Car className="h-5 w-5" /> },
    { key: "product", label: t.portfolio.categories.product, icon: <Package className="h-5 w-5" /> },
    { key: "animated", label: t.portfolio.categories.animated, icon: <Wand2 className="h-5 w-5" /> },
  ];

  const embeds =
    activeCategory === "all" ? embedsForAll() : embedsForCategory(activeCategory);

  const isActiveTab = (key: string) => key === activeCategory;

  const categoryChipClass = (active: boolean) =>
    cn(
      "relative shrink-0 cursor-pointer rounded-full font-semibold inline-flex items-center gap-1.5",
      "h-9 px-3 text-xs sm:h-10 sm:gap-2 sm:px-4 sm:text-sm",
      "border border-transparent !shadow-none hover:!shadow-none focus-visible:!shadow-none active:!shadow-none",
      "transition-colors",
      active
        ? "border-white/15 bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-800 text-primary-foreground hover:brightness-[1.06] hover:text-primary-foreground"
        : "border-border/50 bg-background/80 text-foreground hover:bg-muted hover:text-foreground dark:border-border/40 dark:bg-input/25"
    );

  return (
      <section id="portfolio" className="relative w-full overflow-visible py-6" ref={ref}>
        <div className="relative z-10 mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10">
          {/* Fade title only — do not wrap iframes in opacity:0 (iOS/WebKit breaks IntersectionObserver for lazy embeds). */}
          <div
            className={cn(
              "mb-6 transition-opacity duration-700 delay-200",
              isInView ? "opacity-100" : "opacity-0"
            )}
          >
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-3 text-foreground">
              {t.portfolio.title1}{" "}
              <span className="text-primary">{t.portfolio.title2}</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl">
              {t.portfolio.subtitle}
            </p>
          </div>

          {/* Sticky controls + grid stay fully opaque so lazy IO works on mobile */}
          <div className="flex flex-col gap-8 pb-12">
            <div className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-40 -mx-4 flex flex-col gap-2 px-4 sm:-mx-6 sm:px-6 sm:gap-2.5 lg:top-[7.25rem] lg:-mx-10 lg:px-10">
              {/* Format: full-width pill on small screens; compact tabs from sm+ */}
              <div className="w-full rounded-full border border-border/25 bg-background/95 px-2 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-lg supports-[backdrop-filter]:bg-background/85 dark:border-border/30 dark:shadow-[0_12px_48px_rgba(0,0,0,0.45)] sm:w-fit sm:self-start sm:rounded-2xl sm:px-3 sm:py-2">
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
                      "h-auto min-h-8 w-fit max-w-full justify-center gap-0.5 rounded-full border-0 bg-muted/25 p-0.5 text-[10px] shadow-none",
                      "sm:min-h-8 sm:text-[11px]"
                    )}
                  >
                    <TabsTrigger
                      value="all"
                      aria-label={t.portfolio.format.all}
                      className={cn(
                        "flex-none rounded-full border border-transparent px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-white/15 data-active:bg-gradient-to-br data-active:from-indigo-600 data-active:via-indigo-600 data-active:to-indigo-800 data-active:text-white data-active:!shadow-none",
                        "hover:text-foreground data-active:hover:brightness-[1.06] data-active:hover:text-white"
                      )}
                    >
                      <Grid2X2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="desktop"
                      aria-label={t.portfolio.format.desktop}
                      className={cn(
                        "flex-none gap-0.5 rounded-full border border-transparent px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-white/15 data-active:bg-gradient-to-br data-active:from-indigo-600 data-active:via-indigo-600 data-active:to-indigo-800 data-active:text-white data-active:!shadow-none",
                        "hover:text-foreground data-active:hover:brightness-[1.06] data-active:hover:text-white"
                      )}
                    >
                      <Monitor className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="pl-0.5">{t.portfolio.format.ratio169}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="mobile"
                      aria-label={t.portfolio.format.mobile}
                      className={cn(
                        "flex-none gap-0.5 rounded-full border border-transparent px-1.5 py-1 text-[10px] font-semibold shadow-none sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-white/15 data-active:bg-gradient-to-br data-active:from-indigo-600 data-active:via-indigo-600 data-active:to-indigo-800 data-active:text-white data-active:!shadow-none",
                        "hover:text-foreground data-active:hover:brightness-[1.06] data-active:hover:text-white"
                      )}
                    >
                      <Smartphone className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="pl-0.5">{t.portfolio.format.ratio916}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="rounded-3xl border border-border/25 bg-background/95 px-1 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-lg supports-[backdrop-filter]:bg-background/85 dark:border-border/30 dark:shadow-[0_12px_48px_rgba(0,0,0,0.45)] sm:px-1 sm:py-2">
                <div className="relative min-h-[2.75rem] min-w-0 flex-1 rounded-xl bg-muted/10 px-3 py-1 sm:px-4 sm:py-1.5">
                  <div className="pointer-events-none absolute inset-y-1 left-3 z-[1] w-6 rounded-l-xl bg-gradient-to-r from-muted/80 to-transparent sm:left-4 sm:w-8" />
                  <div className="pointer-events-none absolute inset-y-1 right-3 z-[1] w-6 rounded-r-xl bg-gradient-to-l from-muted/80 to-transparent sm:right-4 sm:w-8" />
                  <div className="relative flex w-full items-center gap-2 overflow-x-auto overflow-y-hidden py-0.5 no-scrollbar">
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
                            "[&_svg]:h-4 [&_svg]:w-4 opacity-90 sm:[&_svg]:h-[1.05rem] sm:[&_svg]:w-[1.05rem]",
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
