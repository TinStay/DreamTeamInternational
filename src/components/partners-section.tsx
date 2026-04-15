"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { motion } from "framer-motion";

export function PartnersSection() {
  const { t } = useLanguage();

  const placeholders = [
    { name: "Acme Corp",   icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 22 22 22" /></svg> },
    { name: "GlobalTech",  icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg> },
    { name: "Nexus",       icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16v16H4z" /><path d="M4 4l16 16" /></svg> },
    { name: "Horizon",     icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
    { name: "Pinnacle",    icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 22h20L12 2z" /><path d="M12 2v20" /></svg> },
    { name: "Quantum",     icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
  ];

  const marqueeItems = [...placeholders, ...placeholders, ...placeholders];

  return (
    <section className="py-12 overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-4 z-10 relative mb-8">
        <h2 className="text-center font-heading font-medium text-muted-foreground text-sm tracking-widest uppercase">
          {t.partners.title}
        </h2>
      </div>

      <div className="relative w-full overflow-hidden flex flex-col items-center">
        {/* No edge fades — transparent section shares global gradient */}
        <div className="w-full flex">
          <motion.div
            className="flex gap-20 md:gap-28 items-center whitespace-nowrap pl-20 md:pl-28"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 30, repeat: Infinity }}
          >
            {marqueeItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 text-muted-foreground/60 hover:text-foreground transition-colors duration-300 group">
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <span className="font-heading font-bold text-2xl tracking-wide">{item.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
