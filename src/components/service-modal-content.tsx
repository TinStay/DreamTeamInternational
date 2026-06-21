"use client";

import Link from "next/link";
import { FeatureShowcase } from "@/components/ui/feature-showcase";
import { ModalContent, ModalFooter, useModal } from "@/components/ui/animated-modal";
import { primaryCtaClassName, secondaryCtaClassName } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { contactProcessPath } from "@/lib/routes";
import { navigateToPortfolio } from "@/lib/portfolio-navigation";
import {
  getServicePortfolioLink,
  SERVICE_MODAL_PANEL_MIN_HEIGHT,
  SERVICE_MODAL_PORTFOLIO_NAV_DELAY_MS,
} from "@/lib/services/constants";
import type { ServiceItem } from "@/lib/services/types";

export function ServiceModalContent({ service }: { service: ServiceItem }) {
  const { t, language } = useLanguage();
  const { setOpen } = useModal();
  const contactHref = contactProcessPath(language);
  const { modal } = service;
  const portfolioLink = getServicePortfolioLink(service.imgSrc);

  const handleGoToPortfolio = () => {
    setOpen(false);
    window.setTimeout(
      () => navigateToPortfolio(portfolioLink?.category),
      SERVICE_MODAL_PORTFOLIO_NAV_DELAY_MS
    );
  };

  return (
    <>
      <ModalContent className="bg-white dark:bg-neutral-950 max-lg:px-5 max-lg:pt-5 max-lg:pb-4 sm:max-lg:px-6 lg:min-h-0 lg:overflow-hidden lg:pb-3">
        <FeatureShowcase
          variant="modal"
          title={service.title}
          description={modal.description}
          stats={modal.stats}
          steps={modal.steps}
          tabs={modal.tabs}
          defaultTab={modal.defaultTab}
          panelMinHeight={SERVICE_MODAL_PANEL_MIN_HEIGHT}
        />
      </ModalContent>

      <ModalFooter className="flex-wrap gap-3 border-t border-border/60 bg-gray-100 px-5 py-3 pt-3 dark:border-neutral-800 dark:bg-neutral-950 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-lg:px-6 lg:py-3">
        {portfolioLink ? (
          <button type="button" onClick={handleGoToPortfolio} className={secondaryCtaClassName}>
            {t.services.modal.goToPortfolio}
          </button>
        ) : null}
        <Link href={contactHref} className={primaryCtaClassName}>
          {t.services.modal.contactCta}
        </Link>
      </ModalFooter>
    </>
  );
}
