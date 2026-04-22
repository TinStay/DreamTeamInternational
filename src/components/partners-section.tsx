"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { motion } from "framer-motion";
import Image from "next/image";

export function PartnersSection() {
  const { t } = useLanguage();

  const ICONS = [
    "/company_icons/infinity_properties_logo-Photoroom.png",
    "/company_icons/designedbygg.png",
    "/company_icons/storoy_alliance_logo-Photoroom.png",
    "/company_icons/hubchev_properties_logo-Photoroom.png",
    "/company_icons/asia_event_agency.png",
    "/company_icons/c2 financial.png",
    "/company_icons/boleron.png",
    "/company_icons/oikia_logo-Photoroom.png",
    "/company_icons/rsg_logo-Photoroom.png",
    "/company_icons/Smart-Pharmacy-Presentation1-5-2.png",
    "/company_icons/valtcan.png",
  ];

  const items = [...ICONS, ...ICONS];

  const altFromPath = (path: string) => {
    const file = path.split("/").pop() ?? path;
    return file.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, "");
  };

  return (
    <section className="py-10 md:py-12 overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-4 z-10 relative mb-5 md:mb-7">
        <h2 className="text-center font-heading font-semibold text-muted-foreground/70 text-base md:text-lg tracking-widest uppercase">
          {t.partners.title}
        </h2>
      </div>

      <div className="relative w-full overflow-hidden flex flex-col items-center">
        <div className="w-full flex">
          <motion.div
            className="flex items-center whitespace-nowrap pl-10 md:pl-14 will-change-transform"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 26, repeat: Infinity }}
          >
            {items.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className="mx-6 md:mx-8 opacity-80 hover:opacity-100 transition-opacity"
              >
                <Image
                  src={src}
                  alt={altFromPath(src)}
                  width={320}
                  height={120}
                  className="h-16 w-auto sm:h-20 md:h-24 object-contain"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
