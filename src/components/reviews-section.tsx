"use client";

import * as React from "react";

import { useLanguage } from "@/lib/i18n/language-context";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { Testimonial } from "@/components/ui/testimonial";
import { cn } from "@/lib/utils";

const COLUMN_DURATIONS = [55, 75, 62];

/** 1 column below md, 2 below lg, 3 from lg — matches the Tailwind breakpoints. */
function useVisibleColumns(): number {
  const [columns, setColumns] = React.useState(3);
  React.useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const apply = () => setColumns(lg.matches ? 3 : md.matches ? 2 : 1);
    apply();
    md.addEventListener("change", apply);
    lg.addEventListener("change", apply);
    return () => {
      md.removeEventListener("change", apply);
      lg.removeEventListener("change", apply);
    };
  }, []);
  return columns;
}

export function ReviewsSection({ className }: { className?: string }) {
  const { t } = useLanguage();
  const r = t.reviews;

  // Split across however many columns are actually visible, so every review
  // is shown at every breakpoint (a fixed 3-way split would hide two thirds
  // of them on phones behind display:none).
  const visibleColumns = useVisibleColumns();
  const items = r.items;
  const columns = React.useMemo(() => {
    const cols: (typeof items)[] = Array.from({ length: visibleColumns }, () => []);
    items.forEach((item, index) => {
      cols[index % visibleColumns].push(item);
    });
    return cols;
  }, [items, visibleColumns]);

  return (
    <section
      id="reviews"
      className={cn("relative w-full overflow-hidden py-16 sm:py-20", className)}
    >
      <div className="relative z-10 mx-auto mb-8 w-full max-w-7xl px-4 lg:mb-10">
        <h2 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
          {r.title1}{" "}
          <span className="text-section-accent">{r.title2}</span>
        </h2>
      </div>

      {/* Vertically scrolling review columns (paused on hover). */}
      <div className="mx-auto flex max-h-[44rem] w-full max-w-7xl justify-center gap-6 overflow-hidden px-4 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
        {columns.map((column, columnIndex) => (
          <InfiniteSlider
            key={columnIndex}
            duration={COLUMN_DURATIONS[columnIndex % COLUMN_DURATIONS.length]}
            className="min-w-0 flex-1"
          >
            {column.map((review) => (
              <div key={review.name} className="pt-10">
                <Testimonial
                  name={review.name}
                  role={review.role}
                  text={review.text}
                  rating={review.rating}
                  initials={review.initials}
                  color={review.color}
                  className="w-full"
                />
              </div>
            ))}
          </InfiniteSlider>
        ))}
      </div>
    </section>
  );
}
