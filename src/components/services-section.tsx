"use client";

import { useMemo } from "react";
import { ServiceCard } from "@/components/ui/service-card";
import { Modal, ModalBody, ModalTrigger } from "@/components/ui/animated-modal";
import { ServiceModalContent } from "@/components/service-modal-content";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

const SERVICE_VARIANTS = ["red", "default", "gray", "blue"] as const;

export function ServicesSection({ className }: { className?: string }) {
  const { t } = useLanguage();

  const cards = useMemo(
    () =>
      t.services.items.map((item, index) => ({
        ...item,
        variant: SERVICE_VARIANTS[index] ?? "default",
      })),
    [t.services.items]
  );

  return (
    <section id="services" className={cn("relative w-full overflow-visible py-10 sm:py-14", className)}>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mb-8 sm:mb-10">
          <h2 className="font-heading mb-3 text-4xl font-bold text-foreground md:text-5xl">
            {t.services.title1}{" "}
            <span className="text-section-accent">{t.services.title2}</span>
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">{t.services.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map((service) => (
            <Modal key={service.title}>
              <ModalTrigger className="block w-full rounded-xl">
                <ServiceCard
                  title={service.title}
                  imgSrc={service.imgSrc}
                  imgAlt={service.imgAlt}
                  variant={service.variant}
                  linkLabel={t.services.learnMore}
                  className="w-full"
                />
              </ModalTrigger>
              <ModalBody>
                <ServiceModalContent service={service} />
              </ModalBody>
            </Modal>
          ))}
        </div>
      </div>
    </section>
  );
}
