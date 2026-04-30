"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { motion } from "framer-motion";
import Image from "next/image";

export function PartnersSection() {
  const { t } = useLanguage();

  // TODO: Replace placeholder hrefs with the real partner websites.
  const PARTNERS = [
    { src: "/company_icons/asia_event_agency.png", href: "https://example.com" },
    { src: "/company_icons/infinity_properties_logo-Photoroom.png", href: "https://example.com" },
    { src: "/company_icons/storoy_alliance_logo-Photoroom.png", href: "https://example.com" },
    { src: "/company_icons/boleron.png", href: "https://example.com" },
    { src: "/company_icons/oikia_logo-Photoroom.png", href: "https://example.com" },
    { src: "/company_icons/rsg_logo-Photoroom.png", href: "https://example.com" },
    { src: "/company_icons/Smart-Pharmacy-Presentation1-5-2.png", href: "https://example.com" },
    { src: "/company_icons/hubchev_properties_logo-Photoroom.png", href: "https://example.com" },
    { src: "/company_icons/valtcan.png", href: "https://example.com" },
    { src: "/company_icons/c2 financial.png", href: "https://example.com" },
    { src: "/company_icons/designedbygg.png", href: "https://example.com" },
  ] as const;

  const items = [...PARTNERS, ...PARTNERS];

  const altFromPath = (path: string) => {
    const file = path.split("/").pop() ?? path;
    return file.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, "");
  };

  return (
    <section className="pt-10 pb-4 md:pt-12 md:pb-6 overflow-x-hidden overflow-y-visible relative">
      <div className="max-w-6xl mx-auto px-4 z-10 relative mb-4 md:mb-5">
        <h2 className="text-center font-heading font-semibold text-muted-foreground/70 text-base md:text-lg tracking-widest uppercase">
          {t.partners.title}
        </h2>
      </div>

      <div className="relative w-full overflow-x-hidden overflow-y-visible flex flex-col items-center py-3">
        <div className="w-full flex">
          <motion.div
            className="flex items-center whitespace-nowrap pl-10 md:pl-14 will-change-transform"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 42, repeat: Infinity }}
          >
            {items.map(({ src, href }, idx) => (
              <a
                key={`${src}-${idx}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mx-8 flex shrink-0 items-center justify-center md:mx-12 cursor-pointer opacity-80 hover:opacity-100 transition-opacity py-2"
                aria-label={altFromPath(src)}
              >
                <Image
                  src={src}
                  alt={altFromPath(src)}
                  width={400}
                  height={140}
                  sizes="(max-width: 640px) 45vw, 280px"
                  className="h-24 w-auto min-h-24 min-w-[200px] max-w-[min(320px,42vw)] object-contain transition-transform duration-200 group-hover:scale-[1.06] sm:h-28 sm:min-h-28 sm:min-w-[220px] sm:max-w-[min(360px,38vw)] md:h-32 md:min-h-32 md:min-w-[240px] md:max-w-[380px]"
                />
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
