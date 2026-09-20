"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { PARTNERS, heroPartnerRows, type Partner } from "@/lib/partners";
import { PartnerLogo } from "@/components/partner-logo";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/*
 * Every logo renders at ONE fixed height - no width cap, no min-width: a cap shrank the wide wordmarks (Palltex, RSG,
 * Smart Pharmacy) to two thirds of the others' height, and the client wants the marks the same height. The width
 * then follows each file's aspect ratio, so the files in `public/company_icons/` are trimmed to their ink (no
 * transparent margins - `sharp` on the alpha bounding box; a padded file would render visibly shorter).
 */
// The marquee rows (below lg): the hovered logo grows a good step, smoothly (the row itself pauses - see the track).
const imgClass =
  "h-8 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-125 sm:h-9 md:h-10";

// Static rows (lg+): a step smaller again (the client's ask) - 28px on a 1024px laptop, where the wider row (the dark
// theme's files are the wide ones) measures ~880px with its margins, 32px from xl and 36px from 2xl.
const staticImgClass =
  "h-7 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-125 xl:h-8 2xl:h-9";

const innerClass =
  "group mx-2.5 flex shrink-0 items-center justify-center md:mx-3.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity py-1.5";

const staticInnerClass =
  "group mx-2.5 flex shrink-0 items-center justify-center xl:mx-3 2xl:mx-3.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity py-1.5";

/** One full loop of the row (the logo list is rendered twice, so this is the time for one set to pass). */
const MARQUEE_DURATION_SEC = 70;

function PartnerMarqueeRow({
  partners,
  direction = "left",
  rowKey = "a",
}: {
  partners: Partner[];
  direction?: "left" | "right";
  rowKey?: string;
}) {
  const items = [...partners, ...partners];

  // CSS keyframes (`marquee-x`, translateX 0 → -50% over the doubled list) so the row can pause on hover.
  return (
    <div className="group/marquee flex w-full overflow-x-hidden overflow-y-visible">
      <div
        className={cn(
          "flex animate-marquee-x items-center whitespace-nowrap pl-10 will-change-transform group-hover/marquee:[animation-play-state:paused] motion-reduce:[animation-play-state:paused] md:pl-14",
          direction === "right" && "[animation-direction:reverse]"
        )}
        style={{ "--marquee-duration": `${MARQUEE_DURATION_SEC}s` } as CSSProperties}
      >
        {items.map((p, idx) =>
          p.href ? (
            <a
              key={`${rowKey}-${p.id}-${idx}`}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={innerClass}
            >
              <PartnerLogo p={p} imgClass={imgClass} sizes="(max-width: 640px) 30vw, 160px" />
            </a>
          ) : (
            <span key={`${rowKey}-${p.id}-${idx}`} className={`${innerClass} cursor-default`}>
              <PartnerLogo p={p} imgClass={imgClass} sizes="(max-width: 640px) 30vw, 160px" />
            </span>
          )
        )}
      </div>
    </div>
  );
}

/** Static row (lg+): every logo laid out once on one centred line (wraps only if a viewport is narrower than planned). */
function PartnerStaticRow({ partners }: { partners: Partner[] }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-y-1">
      {partners.map((p) =>
        p.href ? (
          <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer" className={staticInnerClass}>
            <PartnerLogo p={p} imgClass={staticImgClass} sizes="160px" />
          </a>
        ) : (
          <span key={p.id} className={`${staticInnerClass} cursor-default`}>
            <PartnerLogo p={p} imgClass={staticImgClass} sizes="160px" />
          </span>
        )
      )}
    </div>
  );
}

export function PartnersSection({
  className,
  rows = 2,
  layout = "marquee",
}: {
  className?: string;
  /** `1` puts every partner in a single row. */
  rows?: 1 | 2;
  /**
   * `static` = the rows sit still, centred, one line each (the hero) - from `lg`; below that the rows
   * would wrap into a pile, so phones and tablets get the two marquees running opposite ways instead.
   */
  layout?: "marquee" | "static";
}) {
  const { t } = useLanguage();
  // Two rows laid out by hand (`heroPartnerRows`: the key clients in the middle of each), or everyone in one.
  const [rowPartners, rowPartnersB] = rows === 1 ? [PARTNERS, []] : heroPartnerRows();
  const isStatic = layout === "static";

  return (
    <section
      className={cn(
        "relative overflow-x-hidden overflow-y-visible pt-10 pb-4 md:pt-12 md:pb-6",
        className
      )}
    >
      {/* Label between two hairlines. */}
      <div className="relative z-10 mx-auto mb-2 flex max-w-6xl items-center gap-4 px-4 md:mb-3 md:gap-6">
        <span className="h-px min-w-6 flex-1 bg-gradient-to-r from-transparent to-border" aria-hidden />
        <h2 className="shrink-0 text-center font-heading text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground/70 md:text-xs">
          {t.partners.title}
        </h2>
        <span className="h-px min-w-6 flex-1 bg-gradient-to-l from-transparent to-border" aria-hidden />
      </div>

      {/* Two rows - marquees running opposite ways (default, and below lg for the static layout), or still, centred. */}
      <div
        className={cn(
          "relative flex w-full flex-col items-center gap-2.5 overflow-x-hidden overflow-y-visible py-1 md:gap-3 md:py-1.5",
          isStatic && "lg:hidden"
        )}
      >
        <PartnerMarqueeRow partners={rowPartners} direction="left" rowKey="a" />
        {rowPartnersB.length > 0 ? <PartnerMarqueeRow partners={rowPartnersB} direction="right" rowKey="b" /> : null}
      </div>
      {isStatic ? (
        <div className="relative hidden w-full flex-col items-center gap-2 overflow-x-hidden overflow-y-visible py-1 lg:flex">
          <PartnerStaticRow partners={rowPartners} />
          {rowPartnersB.length > 0 ? <PartnerStaticRow partners={rowPartnersB} /> : null}
        </div>
      ) : null}
    </section>
  );
}
