"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ServiceCard } from "@/components/ui/service-card";
import { useLanguage } from "@/lib/i18n/language-context";
import { servicePath } from "@/lib/routes";
import { getServiceCardVariant, getServiceSlug } from "@/lib/services/constants";
import { cn } from "@/lib/utils";

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
        <div className="mb-8 sm:mb-10">
          <h2 className="font-heading mb-3 text-4xl font-bold text-foreground md:text-5xl">
            {t.services.title1}{" "}
            <span className="text-section-accent">{t.services.title2}</span>
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">{t.services.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map((service) => {
            const slug = getServiceSlug(service.imgSrc);
            return (
              <Link
                key={service.imgSrc}
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
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
