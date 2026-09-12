"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { CardBody, CardContainer } from "@/components/ui/3d-card";
import { ServiceCard } from "@/components/ui/service-card";
import { useLanguage } from "@/lib/i18n/language-context";
import { servicePath } from "@/lib/routes";
import { getServiceCardVariant, getServiceSlug } from "@/lib/services/constants";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Cards tilt up out of the page one after another as the grid scrolls into view. */
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 64, rotateX: 14, scale: 0.94, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: EASE },
  },
};

export function ServicesSection({ className }: { className?: string }) {
  const { t, language } = useLanguage();

  const cards = useMemo(
    () =>
      t.services.items.map((item, index) => ({
        ...item,
        variant: getServiceCardVariant(index),
      })),
    [t.services.items]
  );

  return (
    <section id="services" className={cn("relative w-full overflow-visible py-10 sm:py-14", className)}>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="font-heading mb-3 text-4xl font-bold text-foreground md:text-5xl">
            {t.services.title1}{" "}
            <span className="text-section-accent">{t.services.title2}</span>
          </h2>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">{t.services.subtitle}</p>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 [perspective:1200px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={gridVariants}
        >
          {cards.map((service) => {
            const slug = getServiceSlug(service.imgSrc);
            return (
              <motion.div
                key={service.imgSrc}
                variants={cardVariants}
                style={{ transformOrigin: "50% 100%" }}
                className="will-change-transform"
              >
                {/* Pointer-tracked 3D tilt; the card's title/icon/link lift out of the plane. */}
                <CardContainer containerClassName="py-0 w-full" className="w-full">
                  <CardBody className="h-auto w-full">
                    <Link
                      href={slug ? servicePath(language, slug) : "#"}
                      className="block w-full rounded-xl"
                    >
                      <ServiceCard
                        title={service.title}
                        imgSrc={service.imgSrc}
                        imgAlt={service.imgAlt}
                        variant={service.variant}
                        linkLabel={t.services.learnMore}
                        className="w-full"
                        depth
                      />
                    </Link>
                  </CardBody>
                </CardContainer>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
