"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [options]);

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
                      <iframe
                        className="absolute inset-0 h-full w-full"
                        src={wide.src}
                        title={wide.title ?? "YouTube video"}
                        allow={YOUTUBE_IFRAME_ALLOW}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy={YOUTUBE_REFERRER_POLICY}
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
                      <iframe
                        className="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                        src={short.src}
                        title={short.title ?? "YouTube video"}
                        allow={YOUTUBE_IFRAME_ALLOW}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy={YOUTUBE_REFERRER_POLICY}
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
                  <iframe
                    className="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2"
                    src={embed.src}
                    title={embed.title ?? "YouTube video"}
                    allow={YOUTUBE_IFRAME_ALLOW}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy={YOUTUBE_REFERRER_POLICY}
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
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={embed.src}
                    title={embed.title ?? "YouTube video"}
                    allow={YOUTUBE_IFRAME_ALLOW}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy={YOUTUBE_REFERRER_POLICY}
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

  const short: YouTubeEmbed[] = [
    sTv[0]!,
    sPr[0]!,
    sCar[0]!,
    sCon[0]!,
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

  const formatToggleActive =
    "bg-gradient-to-br from-indigo-600 via-violet-600 to-[#7033ff] text-white shadow-[0_6px_16px_rgba(79,70,229,0.28)] hover:brightness-110";

  const formatToggleBtnClass = (active: boolean) =>
    cn(
      "flex h-8 min-h-8 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-semibold leading-none shadow-none hover:shadow-none sm:h-8 sm:px-2.5 sm:text-[11px]",
      active ? formatToggleActive : "text-foreground/70 hover:text-foreground"
    );

  return (
      <section id="portfolio" className="relative w-full overflow-visible py-6" ref={ref}>
        <div className="relative z-10 mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10">
          <div
            className={`transition-opacity duration-700 delay-200 ${
              isInView ? "opacity-100" : "opacity-0"
            }`}
          >
          {/* ── Title & Subtitle ── */}
          <div className="mb-6">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-3 text-foreground">
              {t.portfolio.title1}{" "}
              <span className="text-primary">{t.portfolio.title2}</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl">
              {t.portfolio.subtitle}
            </p>
          </div>

          {/* Single sticky bar: aspect + categories (sits below fixed site header on desktop) */}
          <div className="flex flex-col gap-8 pb-12">
            <div className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-40 -mx-4 sm:-mx-6 lg:top-[7.25rem] lg:-mx-10">
              <div className="rounded-2xl border border-border/25 bg-background/95 px-2 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-lg supports-[backdrop-filter]:bg-background/85 dark:border-border/30 dark:shadow-[0_12px_48px_rgba(0,0,0,0.45)] sm:px-3 sm:py-2.5">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex shrink-0 items-center justify-center gap-1 rounded-xl border border-border/15 bg-muted/10 p-1 sm:justify-start">
                    <Button
                      type="button"
                      onClick={() => setFormat("all")}
                      variant="ghost"
                      size="sm"
                      className={formatToggleBtnClass(format === "all")}
                      aria-label={t.portfolio.format.all}
                    >
                      <Grid2X2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setFormat("desktop")}
                      variant="ghost"
                      size="sm"
                      className={formatToggleBtnClass(format === "desktop")}
                      aria-label={t.portfolio.format.desktop}
                    >
                      <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="pl-0.5">{t.portfolio.format.ratio169}</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setFormat("mobile")}
                      variant="ghost"
                      size="sm"
                      className={formatToggleBtnClass(format === "mobile")}
                      aria-label={t.portfolio.format.mobile}
                    >
                      <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="pl-0.5">{t.portfolio.format.ratio916}</span>
                    </Button>
                  </div>

                  <div className="relative min-h-[2.75rem] min-w-0 flex-1 sm:border-l sm:border-border/20 sm:pl-3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-card to-transparent sm:w-6" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-card to-transparent sm:w-6" />
                    <div className="relative flex w-full items-center gap-1.5 overflow-x-auto overflow-y-hidden px-1 py-0.5 no-scrollbar">
                      {CATEGORIES.map((cat) => (
                        <Button
                          key={cat.key}
                          type="button"
                          onClick={() => setActiveCategory(cat.key)}
                          variant={isActiveTab(cat.key) ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "relative shrink-0 cursor-pointer rounded-full font-semibold inline-flex items-center gap-1.5",
                            "h-9 px-3 text-xs sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
                          )}
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
      </div>
    </section>
  );
}
