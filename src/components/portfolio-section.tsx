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
                  <div className="flex flex-col gap-3">
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

function embedsForAll() {
  const categories = ["construction", "mascots", "cars", "tv", "product"];
  const wide = categories.flatMap((c) => embedsForCategory(c).wide);
  const short = categories.flatMap((c) => embedsForCategory(c).short);
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
      "flex flex-1 items-center justify-center rounded-full cursor-pointer shadow-none hover:shadow-none h-12 min-h-12 px-2 sm:px-3",
      active ? formatToggleActive : "text-foreground/70 hover:text-foreground"
    );

  const FormatToggleMobile = (
    <div className="flex w-full items-stretch gap-1 rounded-full border border-border/20 bg-background/40 backdrop-blur-md shadow-elevated-soft p-1.5">
      <Button
        type="button"
        onClick={() => setFormat("all")}
        variant="ghost"
        size="sm"
        className={formatToggleBtnClass(format === "all")}
        aria-label={t.portfolio.format.all}
      >
        <Grid2X2 className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        onClick={() => setFormat("desktop")}
        variant="ghost"
        size="sm"
        className={formatToggleBtnClass(format === "desktop")}
        aria-label={t.portfolio.format.desktop}
      >
        <Monitor className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        onClick={() => setFormat("mobile")}
        variant="ghost"
        size="sm"
        className={formatToggleBtnClass(format === "mobile")}
        aria-label={t.portfolio.format.mobile}
      >
        <Smartphone className="h-5 w-5" />
      </Button>
    </div>
  );

  const formatToggleDesktopBtn = (active: boolean) =>
    cn(
      "flex flex-1 items-center justify-center rounded-full cursor-pointer shadow-none hover:shadow-none h-9 min-h-9 px-1",
      active ? formatToggleActive : "text-foreground/70 hover:text-foreground"
    );

  const FormatToggle = (
    <div className="flex w-full items-stretch gap-0.5 rounded-full border border-border/20 bg-background/40 backdrop-blur-md shadow-elevated-soft p-1">
      <Button
        type="button"
        onClick={() => setFormat("all")}
        variant="ghost"
        size="sm"
        className={formatToggleDesktopBtn(format === "all")}
        aria-label={t.portfolio.format.all}
      >
        <Grid2X2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        onClick={() => setFormat("desktop")}
        variant="ghost"
        size="sm"
        className={formatToggleDesktopBtn(format === "desktop")}
        aria-label={t.portfolio.format.desktop}
      >
        <Monitor className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        onClick={() => setFormat("mobile")}
        variant="ghost"
        size="sm"
        className={formatToggleDesktopBtn(format === "mobile")}
        aria-label={t.portfolio.format.mobile}
      >
        <Smartphone className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
      <section id="portfolio" className="py-6 relative overflow-visible" ref={ref}>
        <div className="w-[96%] lg:w-[90vw] max-w-none mx-auto px-4 z-10 relative">
          <div
            className={`transition-opacity duration-700 delay-200 ${
              isInView ? "opacity-100" : "opacity-0"
            }`}
          >
          {/* ── Title & Subtitle ── */}
          <div className="mb-5">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-3 text-foreground">
              {t.portfolio.title1}{" "}
              <span className="text-primary">{t.portfolio.title2}</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl">
              {t.portfolio.subtitle}
            </p>
          </div>

          {/* ── Filter Tabs (below title) ── */}
          <div className="pb-0 mb-6">
            {/* Mobile: sticky top tabs */}
            <div className="lg:hidden sticky top-4 z-30 -mx-4 px-4 pt-2 pb-3 bg-background/40 backdrop-blur-md">
              <div className="mb-3">{FormatToggleMobile}</div>

              <div className="relative w-full overflow-x-auto no-scrollbar rounded-full border border-border/20 bg-background/40 backdrop-blur-md shadow-elevated-soft px-3 py-2.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background/80 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background/80 to-transparent" />
                <div className="relative flex w-max min-w-full items-center gap-2 px-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      variant={isActiveTab(cat.key) ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "relative shrink-0 rounded-full cursor-pointer inline-flex items-center gap-2 font-semibold",
                        "h-12 px-5 text-base"
                      )}
                    >
                      <span
                        className={cn(
                          "opacity-90",
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

            {/* Desktop: toggle lives with sidebar menu */}
          </div>

          {/* Desktop: sidebar tabs left, content right */}
          <div className="hidden lg:grid grid-cols-[240px_1fr] gap-10 items-start">
            <div className="sticky top-28 self-start max-h-[calc(100svh-8rem)] overflow-auto rounded-2xl border border-border/20 bg-background/40 backdrop-blur-md shadow-elevated-soft p-3">
              <div className="mb-3">{FormatToggle}</div>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    variant={isActiveTab(cat.key) ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full rounded-xl px-4 h-11 text-base font-semibold inline-flex items-center gap-2 justify-start cursor-pointer shadow-none hover:shadow-none"
                    )}
                  >
                    <span className={cn("opacity-90", isActiveTab(cat.key) && "text-primary-foreground opacity-100")}>
                      {cat.icon}
                    </span>
                    <span>{cat.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <PortfolioTabBody
              key={`${activeCategory}-${format}`}
              wideEmbeds={embeds.wide}
              shortEmbeds={embeds.short}
              format={format}
            />
          </div>

          {/* Mobile: content below top tab menu */}
          <div className="lg:hidden">
            <PortfolioTabBody
              key={`${activeCategory}-${format}`}
              wideEmbeds={embeds.wide}
              shortEmbeds={embeds.short}
              format={format}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
