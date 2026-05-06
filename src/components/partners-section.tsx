"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Partner = {
  id: string;
  light: string | null;
  dark: string | null;
  href?: string;
  ariaLabel: string;
};

const ICON_BASE = "/company_icons/";

const PARTNERS: Partner[] = [
  {
    id: "asia",
    light: "asia_agency_logo_light.png",
    dark: "asia_agency_logo_dark.png",
    href: "https://asiaeventagency.com/",
    ariaLabel: "Asia Event Agency",
  },
  {
    id: "boleron",
    light: "boleron_logo_light.png",
    dark: null,
    href: "https://boleron.bg/",
    ariaLabel: "Boleron",
  },
  {
    id: "designedbygg",
    light: "designedbygg_logo_light.png",
    dark: "designedbygg_logo_dark.png",
    href: "http://designedby.gg/",
    ariaLabel: "Designed by GG",
  },
  {
    id: "hubchev",
    light: null,
    dark: "hubchev_logo_dark.png",
    href: "https://hubchevproperties.com/",
    ariaLabel: "Hubchev Properties",
  },
  {
    id: "imotalert",
    light: "imot_alert_logo_light.png",
    dark: "imot_alert_logo_dark.png",
    href: "https://www.imotalert.bg/",
    ariaLabel: "ImotAlert",
  },
  {
    id: "infinity",
    light: "infinity_logo_light.png",
    dark: "infinity_logo_dark.png",
    href: "https://infinityproperty.bg/",
    ariaLabel: "Infinity Property",
  },
  {
    id: "oikia",
    light: "oikia_logo_light.png",
    dark: "oikia_logo_dark.png",
    href: "https://www.oikia.com/",
    ariaLabel: "Oikia",
  },
  {
    id: "palltex",
    light: "pallteximot_logo_light.png",
    dark: null,
    href: "https://palltex.bg/",
    ariaLabel: "Palltex",
  },
  {
    id: "rsg",
    light: "rsg_logo_light.png",
    dark: "rsg_logo_dark.png",
    href: "https://rsgarch.com/",
    ariaLabel: "RSG Architects",
  },
  {
    id: "smartpharmacy",
    light: "smartpharmacy_logo_light.png",
    dark: null,
    href: "https://smartpharmacy.bg/",
    ariaLabel: "Smart Pharmacy",
  },
  {
    id: "stroy-alliance",
    light: "stroy_alliance_logo_light.png",
    dark: "stroy_alliance_logo_dark.png",
    href: "https://stroyalianceinvest.eu/",
    ariaLabel: "Stroy Alliance Invest",
  },
  {
    id: "valtcan",
    light: "valtcan_logo_light.png",
    dark: "valtcan_logo_dark.png",
    href: "https://www.valtcan.com/",
    ariaLabel: "Valtcan",
  },
];

const imgClass =
  "h-20 w-auto min-h-20 min-w-[170px] max-w-[min(280px,40vw)] object-contain transition-transform duration-200 group-hover:scale-[1.05] sm:h-24 sm:min-h-24 sm:min-w-[190px] sm:max-w-[min(320px,36vw)] md:h-28 md:min-h-28 md:min-w-[210px] md:max-w-[340px]";

function PartnerLogo({ p }: { p: Partner }) {
  if (p.light && p.dark) {
    /* Grid stack: both images stay in layout so the strip keeps width in dark mode (absolute+hidden collapsed before). */
    return (
      <span className="inline-grid place-items-center [grid-template-columns:1fr] [grid-template-rows:1fr]">
        <Image
          src={`${ICON_BASE}${p.light}`}
          alt={p.ariaLabel}
          width={400}
          height={140}
          sizes="(max-width: 640px) 45vw, 280px"
          className={cn(
            imgClass,
            "col-start-1 row-start-1 opacity-100 dark:pointer-events-none dark:opacity-0"
          )}
        />
        <Image
          src={`${ICON_BASE}${p.dark}`}
          alt=""
          width={400}
          height={140}
          sizes="(max-width: 640px) 45vw, 280px"
          className={cn(
            imgClass,
            "col-start-1 row-start-1 opacity-0 pointer-events-none dark:pointer-events-auto dark:opacity-100"
          )}
          aria-hidden
        />
      </span>
    );
  }

  const single = p.light ?? p.dark;
  if (!single) return null;

  return (
    <Image
      src={`${ICON_BASE}${single}`}
      alt={p.ariaLabel}
      width={400}
      height={140}
      sizes="(max-width: 640px) 45vw, 280px"
      className={imgClass}
    />
  );
}

const innerClass =
  "group mx-8 flex shrink-0 items-center justify-center md:mx-12 cursor-pointer opacity-80 hover:opacity-100 transition-opacity py-2";

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
              <PartnerLogo p={p} />
            </a>
          ) : (
            <span key={`${rowKey}-${p.id}-${idx}`} className={`${innerClass} cursor-default`}>
              <PartnerLogo p={p} />
            </span>
          )
        )}
      </motion.div>
    </div>
  );
}

export function PartnersSection() {
  const { t } = useLanguage();
  const mid = Math.ceil(PARTNERS.length / 2);
  const rowPartners = PARTNERS.slice(0, mid);
  const rowPartnersB = PARTNERS.slice(mid);

  return (
    <section className="relative overflow-x-hidden overflow-y-visible pt-10 pb-4 md:pt-12 md:pb-6">
      <div className="relative z-10 mx-auto mb-4 max-w-6xl px-4 md:mb-5">
        <h2 className="text-center font-heading text-base font-semibold uppercase tracking-widest text-muted-foreground/70 md:text-lg">
          {t.partners.title}
        </h2>
      </div>

      <div className="relative flex w-full flex-col items-center gap-5 overflow-x-hidden overflow-y-visible py-3 md:gap-6">
        <PartnerMarqueeRow partners={rowPartners} direction="left" rowKey="a" />
        {rowPartnersB.length > 0 ? (
          <PartnerMarqueeRow partners={rowPartnersB} direction="right" rowKey="b" />
        ) : null}
      </div>
    </section>
  );
}
