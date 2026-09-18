"use client";

import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { ContactSection } from "@/components/contact-section";
import { ProjectsSection } from "@/components/projects-section";
import { QuoteFormSection } from "@/components/quote-form/quote-form-section";

export function ProjectsPageView() {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-20 pt-24 lg:pb-24 lg:pt-32">
        <div className="mx-auto w-full max-w-none px-4 lg:px-8">
          <PageBreadcrumbs className="mb-2" />
        </div>
        <ProjectsSection variant="page" />
        {/* The service cards + step form (the header's CTA lands here, `#quote`), then the contact form. */}
        <QuoteFormSection />
        <ContactSection />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
