"use client";

import Link from "next/link";
import { FeatureShowcase } from "@/components/ui/feature-showcase";
import { ModalContent, ModalFooter, ModalClose } from "@/components/ui/animated-modal";
import { primaryCtaClassName, secondaryCtaClassName } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { contactProcessPath } from "@/lib/routes";

import type { en } from "@/lib/i18n/en";

type ServiceItem = (typeof en.services.items)[number];

export function ServiceModalContent({ service }: { service: ServiceItem }) {
  const { t, language } = useLanguage();
  const contactHref = contactProcessPath(language);
  const { modal } = service;

  return (
    <>
      <ModalContent className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-3 sm:px-5 sm:pt-5 lg:pb-3">
        <FeatureShowcase
          variant="modal"
          title={service.title}
          description={modal.description}
          stats={modal.stats}
          steps={modal.steps}
          tabs={modal.tabs}
          defaultTab={modal.defaultTab}
          panelMinHeight={560}
        />
      </ModalContent>

      <ModalFooter className="gap-4 py-3 pt-2 lg:py-3 ">
        <ModalClose className={secondaryCtaClassName}>{t.services.modal.close}</ModalClose>
        <Link href={contactHref} className={primaryCtaClassName}>
          {t.services.modal.contactCta}
        </Link>
      </ModalFooter>
    </>
  );
}
