"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { PORTFOLIO_NAVIGATE_EVENT, type PortfolioNavigateDetail } from "@/lib/portfolio-navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { primaryGradientInteractiveClassName } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ANIMATED_SHORT,
  ANIMATED_WIDE,
  AVATARS_SHORT,
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
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

/** Generous margin so tiles near the fold still get a callback; four-value form for Safari. */
const LAZY_IFRAME_ROOT_MARGIN = "200px 0px 200px 0px";

// Page size tuned to show one more row vs previous values.
const PORTFOLIO_SEGMENTS_PER_PAGE = 4; // “All” layout rows
const PORTFOLIO_MOBILE_PER_PAGE = 12; // +1 row (3-up on lg)
const PORTFOLIO_DESKTOP_PER_PAGE = 8; // +1 row (2-up on lg)

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
  page,
}: {
  wideEmbeds: YouTubeEmbed[];
  shortEmbeds: YouTubeEmbed[];
  format: "all" | "desktop" | "mobile";
  page: number;
}) {
  const isMobileOnly = format === "mobile";

  const allSegments = useMemo(
    () =>
      format === "all" ? buildAllFormatSegments(wideEmbeds, shortEmbeds) : [],
    [format, wideEmbeds, shortEmbeds]
  );

  const visibleAllSegments = useMemo(() => {
    if (format !== "all") return [];
    const start = page * PORTFOLIO_SEGMENTS_PER_PAGE;
    return allSegments.slice(start, start + PORTFOLIO_SEGMENTS_PER_PAGE);
  }, [format, allSegments, page]);

  const visibleShortEmbeds = useMemo(() => {
    if (format !== "mobile") return shortEmbeds;
    const start = page * PORTFOLIO_MOBILE_PER_PAGE;
    return shortEmbeds.slice(start, start + PORTFOLIO_MOBILE_PER_PAGE);
  }, [format, shortEmbeds, page]);

  const visibleWideEmbeds = useMemo(() => {
    if (format !== "desktop") return wideEmbeds;
    const start = page * PORTFOLIO_DESKTOP_PER_PAGE;
    return wideEmbeds.slice(start, start + PORTFOLIO_DESKTOP_PER_PAGE);
  }, [format, wideEmbeds, page]);

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
            {visibleAllSegments.map((seg) => {
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
            {visibleShortEmbeds.map((embed, idx) => (
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
            {visibleWideEmbeds.map((embed, idx) => (
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
      return { wide: AVATARS_WIDE, short: AVATARS_SHORT };
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
 * Curated “All” feed — a hand-picked highlight reel, NOT every clip in the portfolio.
 * Mascots + the first product wide lead the first rows; the full catalogue per category
 * stays reachable through the category tabs.
 */
function embedsForAll() {
  const { wide: wCon, short: sCon } = embedsForCategory("construction");
  const { wide: wMas, short: sMas } = embedsForCategory("mascots");
  const { wide: wCar } = embedsForCategory("cars");
  const { short: sTv } = embedsForCategory("tv");
  const { wide: wPr, short: sPr } = embedsForCategory("product");
  const { wide: wSer, short: sSer } = embedsForCategory("services");

  // Row 0 centre = mascot horizontal 2, row 1 centre = product horizontal 1 (both “on top”).
  const wide = [
    wMas[1],
    wPr[0],
    wCar[0],
    wCar[1],
    wCon[0],
    wSer[1],
    wSer[3],
  ].filter((e): e is YouTubeEmbed => Boolean(e));

  // Shorts fill the side columns two per row, in this exact running order.
  const short = [
    sPr[5],
    sTv[0],
    sMas[1],
    sPr[0],
    sCon[0],
    sSer[0],
    sTv[2],
    sPr[3],
  ].filter((e): e is YouTubeEmbed => Boolean(e));

  return { wide, short };
}

export function PortfolioSection() {
  const { ref } = useInView();
  const { t } = useLanguage();
  const [format, setFormat] = useState<"all" | "desktop" | "mobile">("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [portfolioPage, setPortfolioPage] = useState(0);

  useEffect(() => {
    const handlePortfolioNavigate = (event: Event) => {
      const { category } = (event as CustomEvent<PortfolioNavigateDetail>).detail ?? {};
      setActiveCategory(category ?? "all");
      setPortfolioPage(0);
    };

    window.addEventListener(PORTFOLIO_NAVIGATE_EVENT, handlePortfolioNavigate);
    return () => window.removeEventListener(PORTFOLIO_NAVIGATE_EVENT, handlePortfolioNavigate);
  }, []);

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

  const totalPortfolioPages = useMemo(() => {
    if (format === "all") {
      const segs = buildAllFormatSegments(embeds.wide, embeds.short);
      return Math.max(1, Math.ceil(segs.length / PORTFOLIO_SEGMENTS_PER_PAGE));
    }
    if (format === "mobile") {
      return Math.max(1, Math.ceil(embeds.short.length / PORTFOLIO_MOBILE_PER_PAGE));
    }
    return Math.max(1, Math.ceil(embeds.wide.length / PORTFOLIO_DESKTOP_PER_PAGE));
  }, [format, embeds.wide, embeds.short]);

  const safePortfolioPage = Math.min(
    portfolioPage,
    Math.max(0, totalPortfolioPages - 1)
  );

  const scrollPortfolioIntoView = () => {
    document.getElementById("portfolio")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const isActiveTab = (key: string) => key === activeCategory;

  const categoryChipClass = (active: boolean) =>
    cn(
      "group relative shrink-0 cursor-pointer rounded-full font-semibold inline-flex items-center gap-1.5",
      "h-9 px-3 text-xs sm:h-10 sm:gap-2 sm:px-4 sm:text-sm",
      "border border-transparent !shadow-none hover:!shadow-none focus-visible:!shadow-none active:!shadow-none",
      "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out will-change-transform",
      active
        ? "border-0 bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-primary-foreground shadow-none transition-[transform,box-shadow,background-image] duration-200 hover:scale-[1.03] hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)] hover:text-primary-foreground"
        : cn(
            "border-border/50 bg-background/80 text-foreground dark:border-border/40 dark:bg-input/25",
            "hover:-translate-y-[1px] hover:bg-muted/60 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
            "hover:border-transparent"
          )
    );

  return (
      <section id="portfolio" className="relative w-full overflow-visible pt-2 pb-6 sm:pt-3" ref={ref}>
        <div className="relative z-10 mx-auto w-full max-w-none px-4 lg:px-6">
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
            <div className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-40 -mx-4 flex flex-col gap-2 px-4 sm:gap-2.5 lg:top-[7.25rem] lg:-mx-6 lg:px-6">
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
                        onClick={() => {
                          setActiveCategory(cat.key);
                          setPortfolioPage(0);
                        }}
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
                      setPortfolioPage(0);
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
                        "data-active:border-0 data-active:bg-gradient-to-r data-active:from-[var(--primary-gradient-start)] data-active:to-[var(--primary-gradient-end)] data-active:text-white data-active:!shadow-none",
                        "[&_svg]:icon-on-brand data-active:[&_svg]:text-white data-active:[&_svg]:filter-none",
                        "hover:text-foreground data-active:hover:scale-[1.03] data-active:hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] data-active:hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)] data-active:hover:text-white"
                      )}
                    >
                      <IconLayoutGrid
                        className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                        fill="currentColor"
                        stroke="none"
                      />
                    </TabsTrigger>
                    <TabsTrigger
                      value="desktop"
                      aria-label={t.portfolio.format.desktop}
                      className={cn(
                        "cursor-pointer flex-none gap-0.5 rounded-2xl border border-transparent px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-0 data-active:bg-gradient-to-r data-active:from-[var(--primary-gradient-start)] data-active:to-[var(--primary-gradient-end)] data-active:text-white data-active:!shadow-none",
                        "[&_svg]:icon-on-brand data-active:[&_svg]:text-white data-active:[&_svg]:filter-none",
                        "hover:text-foreground data-active:hover:scale-[1.03] data-active:hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] data-active:hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)] data-active:hover:text-white"
                      )}
                    >
                      <IconDeviceDesktop
                        className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                        fill="currentColor"
                        stroke="none"
                      />
                      <span className="pl-0.5">{t.portfolio.format.ratio169}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="mobile"
                      aria-label={t.portfolio.format.mobile}
                      className={cn(
                        "cursor-pointer flex-none gap-0.5 rounded-2xl border border-transparent px-1.5 py-1 text-[10px] font-semibold shadow-none sm:px-2 sm:py-1 sm:text-[11px]",
                        "data-active:border-0 data-active:bg-gradient-to-r data-active:from-[var(--primary-gradient-start)] data-active:to-[var(--primary-gradient-end)] data-active:text-white data-active:!shadow-none",
                        "[&_svg]:icon-on-brand data-active:[&_svg]:text-white data-active:[&_svg]:filter-none",
                        "hover:text-foreground data-active:hover:scale-[1.03] data-active:hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] data-active:hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)] data-active:hover:text-white"
                      )}
                    >
                      <IconDeviceMobile
                        className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                        fill="currentColor"
                        stroke="none"
                      />
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
              page={safePortfolioPage}
            />

            {totalPortfolioPages > 1 ? (
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled={safePortfolioPage <= 0}
                    className="h-11 gap-1 rounded-full px-5 text-sm font-semibold"
                    onClick={() => {
                      setPortfolioPage((p) => Math.max(0, p - 1));
                      scrollPortfolioIntoView();
                    }}
                  >
                    <IconChevronLeft className="h-4 w-4" aria-hidden />
                    {t.portfolio.pagination.previous}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    disabled={safePortfolioPage >= totalPortfolioPages - 1}
                    className={cn(
                      "h-14 gap-2 rounded-full px-9 text-lg font-semibold [&_svg]:size-5",
                      primaryGradientInteractiveClassName
                    )}
                    onClick={() => {
                      setPortfolioPage((p) =>
                        Math.min(totalPortfolioPages - 1, p + 1)
                      );
                      scrollPortfolioIntoView();
                    }}
                  >
                    {t.portfolio.pagination.next}
                    <IconChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.portfolio.pagination.page}{" "}
                  <span className="font-semibold text-foreground">
                    {safePortfolioPage + 1}
                  </span>
                  {" / "}
                  <span className="font-semibold text-foreground">
                    {totalPortfolioPages}
                  </span>
                </p>
              </div>
            ) : null}
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
