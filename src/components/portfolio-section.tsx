"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

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

export function PortfolioSection() {
  const { ref, isInView } = useInView();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");

  const CATEGORIES = [
    { key: "all",          label: t.portfolio.categories.all },
    { key: "cinema",       label: t.portfolio.categories.cinema },
    { key: "avatars",      label: t.portfolio.categories.avatars },
    { key: "storytelling", label: t.portfolio.categories.storytelling },
    { key: "product",      label: t.portfolio.categories.product },
    { key: "animation",    label: t.portfolio.categories.animation },
  ];

  const PORTFOLIO_ITEMS = [
    {
      id: 1,
      category: "product",
      title: "Tech Gadget Launch",
      img: "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 2,
      category: "storytelling",
      title: "Sustainable Future",
      img: "https://images.unsplash.com/photo-1497250681558-469c4fa2417d?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 3,
      category: "cinema",
      title: "Modern Villa 3D",
      img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 4,
      category: "animation",
      title: "Energy Drink Promo",
      img: "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 5,
      category: "avatars",
      title: "Cosmetics Reveal",
      img: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 6,
      category: "cinema",
      title: "Automotive Journey",
      img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const filteredItems =
    activeTab === "all"
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter((item) => item.category === activeTab);

  // Label lookup for the overlay tag
  const labelFor = (category: string) =>
    CATEGORIES.find((c) => c.key === category)?.label ?? category;

  return (
    <section id="portfolio" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 z-10 relative">
        <div
          className={`transition-all duration-1000 delay-300 ${
            isInView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* ── Title & Subtitle ── */}
          <div className="mb-8">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-3 text-foreground">
              {t.portfolio.title1}{" "}
              <span className="text-primary italic">{t.portfolio.title2}</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl">
              {t.portfolio.subtitle}
            </p>
          </div>

          {/* ── Filter Tabs (below title) ── */}
          <div className="pb-2 mb-10">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveTab(cat.key)}
                  className={`cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 border whitespace-nowrap select-none
                    ${
                      activeTab === cat.key
                        ? "bg-primary text-primary-foreground border-primary/60 shadow-lg shadow-primary/25"
                        : "text-muted-foreground border-border/25 hover:border-primary/40 hover:text-foreground bg-background"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Full-width Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedItems items={filteredItems} labelFor={labelFor} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* Separate component so AnimatePresence can re-trigger on filter change */
function AnimatedItems({
  items,
  labelFor,
}: {
  items: { id: number; category: string; title: string; img: string }[];
  labelFor: (cat: string) => string;
}) {
  return (
    <>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="group relative rounded-2xl overflow-hidden bg-card border border-border/20 aspect-[4/3] cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/10"
          style={{
            animationName: "fadeSlideIn",
            animationDuration: "0.45s",
            animationTimingFunction: "ease",
            animationFillMode: "both",
            animationDelay: `${idx * 80}ms`,
          }}
        >
          <style>{`
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <img
            src={item.img}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg transform scale-50 group-hover:scale-100 transition-all duration-500 drop-shadow-xl">
              <Play fill="currentColor" size={32} className="translate-x-0.5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="text-primary text-xs font-bold tracking-wider uppercase mb-2">
              {labelFor(item.category)}
            </div>
            <h3 className="text-white font-heading text-xl font-semibold">
              {item.title}
            </h3>
          </div>
        </div>
      ))}
    </>
  );
}
