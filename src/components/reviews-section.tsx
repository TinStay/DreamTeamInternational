"use client";

import * as React from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

import { useLanguage } from "@/lib/i18n/language-context";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { Testimonial } from "@/components/ui/testimonial";
import { JourneyItem, useJourney, type JourneySide } from "@/components/ui/scroll-journey";
import { cn } from "@/lib/utils";

const COLUMN_DURATIONS = [55, 75, 62];
const COLUMN_SIDES: JourneySide[] = ["left", "bottom", "right"];

/* Home journey: the card conveyor ---------------------------------------- */

/** The floating header's lane (px): the stage sticks below it, clear of the header pill (which ends ~84px down). */
const STAGE_TOP = 112;
/** Rows kept on stage: the cards fill the viewport three rows deep, the rest scroll through. */
const ROWS_ON_STAGE = 3;
/** Rows never stretch past this (px) on tall screens - a card with too much air under its text stops reading as one. */
const ROW_MAX = 240;
/** Soft edge (px) at the top and bottom of the stage - the cards leave and appear through it. */
const EDGE = 28;
/** Room above the first row: the (compact) avatars sit half above their card. */
const TOP_INSET = EDGE + 28;
/** The cards travel this much faster than the page - a touch livelier than plain scrolling. */
const SPEED = 1.2;
/** Track smoothing - stiff, so a wheel tick glides instead of stepping. */
const SPRING = { stiffness: 260, damping: 36, mass: 0.5, restDelta: 0.001 };

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

type Review = { name: string; role: string; text: string; rating: number; initials: string; color: string };

/**
 * Home journey: the reviews stacked close together in one grid (two columns from md) that rides a sticky,
 * viewport-high stage under the heading - three rows fill it, and scrolling slides the whole stack up
 * through soft edges, the top rows leaving as the next ones appear from below. The stage sticks while
 * its runway scrolls; the runway is exactly as long as the stack's travel (at `SPEED`), so the stack
 * has reached its last row the moment the stage lets go and the scene can hand over.
 */
function ReviewConveyor({ items, heading }: { items: Review[]; heading: React.ReactNode }) {
  const runwayRef = React.useRef<HTMLDivElement>(null);
  const windowRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [rowMin, setRowMin] = React.useState(0);
  const [travel, setTravel] = React.useState(0);

  // Measure the window left under the heading (the stage's height is CSS: the viewport under the header lane and
  // above the mobile dock) and the stack itself: rows get at least a third of the window so three fill it, and the
  // stack travels by however much of it does not fit between the soft edges.
  React.useLayoutEffect(() => {
    const win = windowRef.current;
    const track = trackRef.current;
    if (!win || !track) return;
    const measure = () => {
      const windowHeight = win.clientHeight;
      const gap = parseFloat(getComputedStyle(track).rowGap) || 0;
      setRowMin(Math.min(ROW_MAX, Math.max(0, (windowHeight - TOP_INSET - EDGE - (ROWS_ON_STAGE - 1) * gap) / ROWS_ON_STAGE)));
      setTravel(Math.max(0, track.offsetHeight + TOP_INSET + EDGE - windowHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(win);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // The runway's scroll: 0 when its top reaches the viewport top (the stage, `STAGE_TOP` down, sticks), 1 when its
  // bottom meets the viewport bottom - on desktop the moment the stage lets go; below `lg` (mobile dock) the moment
  // the scene's hand-over begins, so the stack is at rest for that last dock-high stretch while the parts fade.
  const { scrollYProgress } = useScroll({ target: runwayRef, offset: ["start 0px", "end 100%"] });
  const progress = useSpring(scrollYProgress, SPRING);
  const y = useTransform(progress, (p) => -p * travel);

  return (
    <div
      ref={runwayRef}
      className="relative w-full"
      style={{ paddingTop: STAGE_TOP, height: `calc(100svh - var(--journey-dock) + ${Math.round(travel / SPEED)}px)` }}
    >
      <div
        className="sticky flex flex-col"
        style={{ top: STAGE_TOP, height: `calc(100svh - ${STAGE_TOP}px - var(--journey-dock))` }}
      >
        {heading}
        <JourneyItem index={0} from="bottom" className="relative min-h-0 flex-1">
          <div
            ref={windowRef}
            className="absolute inset-0 overflow-hidden"
            style={{ maskImage: `linear-gradient(to bottom, transparent, black ${EDGE}px, black calc(100% - ${EDGE}px), transparent)` }}
          >
            <motion.div
              ref={trackRef}
              // Odd card at the end of a two-column stack: centred across both columns.
              className="absolute inset-x-0 mx-auto grid w-[calc(100%-2rem)] grid-cols-1 gap-3 md:w-[min(72rem,calc(84vw-4rem))] md:grid-cols-2 md:gap-4 md:[&>*:nth-child(odd):last-child]:col-span-2 md:[&>*:nth-child(odd):last-child]:w-[calc(50%-0.5rem)] md:[&>*:nth-child(odd):last-child]:justify-self-center"
              style={{ top: TOP_INSET, y, gridAutoRows: rowMin > 0 ? `minmax(${Math.round(rowMin)}px, auto)` : undefined }}
            >
              {items.map((review) => (
                <div key={review.name} className="flex">
                  <Testimonial
                    name={review.name}
                    role={review.role}
                    text={review.text}
                    rating={review.rating}
                    initials={review.initials}
                    color={review.color}
                    compact
                    className="w-full max-w-none"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </JourneyItem>
      </div>
    </div>
  );
}

export function ReviewsSection({ className }: { className?: string }) {
  const { t } = useLanguage();
  const r = t.reviews;
  const journey = useJourney();

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

  // Journey part (home): the heading arrives first, then the conveyor; it sits inside the sticky stage so it stays
  // put while the cards scroll through under it.
  const heading = (
    <JourneyItem
      kind="title"
      className={cn("relative z-10 mx-auto w-full max-w-7xl shrink-0 px-4 text-center", journey ? "mb-4" : "mb-8 lg:mb-10")}
    >
      <h2 className="font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl text-foreground">
        {r.title1} <span className="text-section-accent">{r.title2}</span>
      </h2>
    </JourneyItem>
  );

  return (
    <section
      id="reviews"
      // overflow-clip, never hidden: the conveyor stage inside is sticky and must stick to the viewport, not the section.
      className={cn("relative w-full overflow-x-clip", !journey && "py-16 sm:py-20", className)}
    >
      {journey ? (
        <ReviewConveyor items={items} heading={heading} />
      ) : (
        <>
          {heading}
          {/* Elsewhere (reduced motion): vertically scrolling review columns (paused on hover). */}
          <div className="mx-auto flex max-h-[44rem] w-full max-w-7xl justify-center gap-6 overflow-hidden px-4 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
            {columns.map((column, columnIndex) => (
              <JourneyItem
                key={columnIndex}
                index={columnIndex}
                from={COLUMN_SIDES[columnIndex % COLUMN_SIDES.length]}
                className="min-w-0 flex-1"
              >
                <InfiniteSlider duration={COLUMN_DURATIONS[columnIndex % COLUMN_DURATIONS.length]} className="w-full">
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
              </JourneyItem>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
