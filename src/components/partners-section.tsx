"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { motion } from "motion/react";
import { PARTNERS, type Partner } from "@/lib/partners";
import { PartnerLogo } from "@/components/partner-logo";
import { cn } from "@/lib/utils";

const imgClass =
  "h-[4.25rem] w-auto min-h-[4.25rem] min-w-[120px] max-w-[min(190px,36vw)] object-contain transition-transform duration-200 group-hover:scale-[1.05] sm:h-[4.5rem] sm:min-h-[4.5rem] sm:min-w-[115px] sm:max-w-[min(190px,24vw)] md:h-[5rem] md:min-h-[5rem] md:min-w-[130px] md:max-w-[205px]";

const innerClass =
  "group mx-4 flex shrink-0 items-center justify-center md:mx-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity py-2";

const MARQUEE_DURATION_SEC = 42;

function PartnerMarqueeRow({
  partners,
  direction,
  rowKey,
}: {
  partners: Partner[];
  direction: "left" | "right";
  rowKey: string;
}) {
  const items = [...partners, ...partners];
  const animate =
    direction === "left"
      ? ({ x: ["0%", "-50%"] } satisfies { x: string[] })
      : ({ x: ["-50%", "0%"] } satisfies { x: string[] });

  return (
    <div className="flex w-full overflow-x-hidden overflow-y-visible">
      <motion.div
        className="flex items-center whitespace-nowrap pl-10 will-change-transform md:pl-14"
        animate={animate as { x: string[] }}
        transition={{ ease: "linear", duration: MARQUEE_DURATION_SEC, repeat: Infinity }}
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
              <PartnerLogo p={p} imgClass={imgClass} sizes="(max-width: 640px) 36vw, 205px" />
            </a>
          ) : (
            <span key={`${rowKey}-${p.id}-${idx}`} className={`${innerClass} cursor-default`}>
              <PartnerLogo p={p} imgClass={imgClass} sizes="(max-width: 640px) 36vw, 205px" />
            </span>
          )
        )}
      </motion.div>
    </div>
  );
}

export function PartnersSection({
  className,
  rows = 2,
}: {
  className?: string;
  /** `1` puts every partner in a single row (used inside the hero). */
  rows?: 1 | 2;
}) {
  const { t } = useLanguage();
  const mid = rows === 1 ? PARTNERS.length : Math.ceil(PARTNERS.length / 2);
  const rowPartners = PARTNERS.slice(0, mid);
  const rowPartnersB = PARTNERS.slice(mid);

  return (
    <section
      className={cn(
        "relative overflow-x-hidden overflow-y-visible pt-10 pb-4 md:pt-12 md:pb-6",
        className
      )}
    >
      <div className="relative z-10 mx-auto mb-1 max-w-6xl px-4 md:mb-2">
        <h2 className="text-center font-heading text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground/70 md:text-xs">
          {t.partners.title}
        </h2>
      </div>

      {/* Scrolling marquee rows at every breakpoint */}
      <div className="relative flex w-full flex-col items-center gap-4 overflow-x-hidden overflow-y-visible py-1 md:gap-5 md:py-2">
        <PartnerMarqueeRow partners={rowPartners} direction="left" rowKey="a" />
        {rowPartnersB.length > 0 ? (
          <PartnerMarqueeRow partners={rowPartnersB} direction="right" rowKey="b" />
        ) : null}
      </div>
    </section>
  );
}
