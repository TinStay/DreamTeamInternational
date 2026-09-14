"use client";

import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { FeatureShowcase } from "@/components/ui/feature-showcase";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { QuoteFormSection } from "@/components/quote-form/quote-form-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { getServiceIconBySlug, getServiceKey } from "@/lib/services/constants";

export function ServiceDetailPageView({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const icon = getServiceIconBySlug(slug);
  const service = icon
    ? t.services.items.find((item) => item.imgSrc === icon)
    : undefined;

  // Server route already 404s unknown slugs; guard defensively.
  if (!service) return null;
  const { modal } = service;
  const serviceKey = icon ? getServiceKey(icon) : undefined;

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 w-full flex-1 px-4 pb-24 pt-24 lg:pb-28 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl xl:max-w-[86rem]">
          <PageBreadcrumbs className="mb-6" />

          {/* Desktop: title, description, chips and accordion on the left;
              image carousel on the right. (Reused former modal content.) */}
          <FeatureShowcase
            variant="section"
            titleAs="h1"
            eyebrow=""
            title={service.title}
            description={modal.description}
            stats={modal.stats}
            steps={modal.steps}
            tabs={modal.tabs}
            defaultTab={modal.defaultTab}
            className="bg-transparent px-0 py-0 md:py-0"
            // The main CTA, a size up: scrolls to the wizard below, already on this service's first step.
            action={
              <ButtonWithIcon href="#quote" surface="auto" size="lg">
                {t.services.quoteCta}
              </ButtonWithIcon>
            }
          />
        </div>
      </div>

      {/* The quote wizard, opened straight on this service's flow (its cards step is one "back" away). */}
      <div className="relative z-10 w-full pb-16 lg:pb-20">
        <QuoteFormSection initialService={serviceKey} />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
