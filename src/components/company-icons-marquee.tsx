"use client";

import Image from "next/image";

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

function altFromPath(path: string) {
  const file = path.split("/").pop() ?? path;
  return file.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, "");
}

export function CompanyIconsMarquee() {
  const items = [...ICONS, ...ICONS];

  return (
    <section className="py-3 overflow-hidden">
      <style>{`
        @keyframes companyMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <div className="relative w-full overflow-hidden">
        <div
          className="flex w-max items-center gap-10 md:gap-14 whitespace-nowrap pl-10 md:pl-14 will-change-transform"
          style={{ animation: "companyMarquee 26s linear infinite" }}
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
        </div>
      </div>
    </section>
  );
}

