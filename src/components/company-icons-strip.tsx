"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Explicit list (matches the provided filenames/order)
const ICONS = [
  "/company_icons/asia_event_agency.png",
  "/company_icons/boleron.png",
  "/company_icons/c2 financial.png",
  "/company_icons/designedbygg.png",
  "/company_icons/hubchev_properties_logo-Photoroom.png",
  "/company_icons/infinity_properties_logo-Photoroom.png",
  "/company_icons/oikia_logo-Photoroom.png",
  "/company_icons/rsg_logo-Photoroom.png",
  "/company_icons/Smart-Pharmacy-Presentation1-5-2.png",
  "/company_icons/storoy_alliance_logo-Photoroom.png",
  "/company_icons/valtcan.png",
];

function altFromPath(path: string) {
  const file = path.split("/").pop() ?? path;
  return file.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, "");
}

export function CompanyIconsStrip() {
  const items = [...ICONS, ...ICONS, ...ICONS];

  return (
    <section className="py-3 overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex items-center gap-10 md:gap-14 whitespace-nowrap pl-10 md:pl-14"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 28, repeat: Infinity }}
        >
          {items.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="h-14 md:h-16 w-auto opacity-80 hover:opacity-100 transition-opacity"
            >
              <Image
                src={src}
                alt={altFromPath(src)}
                width={220}
                height={80}
                className="h-14 md:h-16 w-auto object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

