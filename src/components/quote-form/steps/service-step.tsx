"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

import { JourneyItem, type JourneySide } from "@/components/ui/scroll-journey";
import { ServiceCard } from "@/components/ui/service-card";
import { useLanguage } from "@/lib/i18n/language-context";
import { servicePath } from "@/lib/routes";
import { getServiceCardVariant, getServiceKey, getServiceSlug } from "@/lib/services/constants";
import type { QuoteServiceKey } from "@/lib/quote-form/constants";

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

/** Home journey: where each card arrives from. */
const CARD_SIDES: JourneySide[] = ["left", "right", "left", "right"];

/**
 * First step of the quote wizard: the service cards (the same cards as
 * `/services`), each with the primary "get a quote" pill that picks the
 * service and moves the wizard on, plus the "learn more" link to its page.
 */
export function ServiceStep({ onPick }: { onPick: (service: QuoteServiceKey) => void }) {
  const { t, language } = useLanguage();

  const cards = useMemo(
    () =>
      t.services.items.map((item, index) => ({
        ...item,
        variant: getServiceCardVariant(index),
        service: getServiceKey(item.imgSrc),
        slug: getServiceSlug(item.imgSrc),
      })),
    [t.services.items]
  );

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 [perspective:1200px]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={gridVariants}
    >
      {cards.map((service, index) => (
        <JourneyItem key={service.imgSrc} index={index} from={CARD_SIDES[index % CARD_SIDES.length]}>
          <motion.div variants={cardVariants} style={{ transformOrigin: "50% 100%" }} className="will-change-transform">
            <ServiceCard
              title={service.title}
              imgSrc={service.imgSrc}
              imgAlt={service.imgAlt}
              variant={service.variant}
              linkLabel={t.services.learnMore}
              href={service.slug ? servicePath(language, service.slug) : undefined}
              cta={
                service.service
                  ? { label: t.services.quoteCta, onClick: () => onPick(service.service as QuoteServiceKey) }
                  : undefined
              }
              className="w-full"
            />
          </motion.div>
        </JourneyItem>
      ))}
    </motion.div>
  );
}
