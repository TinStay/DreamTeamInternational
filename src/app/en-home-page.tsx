import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { EnHeroSection } from "@/components/en-hero-section";
import { QuoteFormSection } from "@/components/quote-form/quote-form-section";
import { ProjectsShowcase } from "@/components/projects-showcase";
import { ContactSection } from "@/components/contact-section";
import { ProcessSection } from "@/components/process-section";
import { CompanyStatsSection } from "@/components/company-stats-section";
import { TrainingSection } from "@/components/training/training-section";
import { ReviewsSection } from "@/components/reviews-section";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";

// The English home page (/en) — its own file so /en can take its own layout without touching the Bulgarian one (/bg,
// `home-page.tsx`). One continuous scroll: the sections simply follow each other in normal flow on the cream ground
// (the site's smooth scrolling still glides the wheel) — no scroll journeys, no pinned scenes, no paged opening, and
// the case studies as plain rows instead of the sticky stage.
export function EnHomePage() {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col">
        <EnHeroSection />
        <div className="pt-16 sm:pt-20">
          <QuoteFormSection />
        </div>
        <ProjectsShowcase layout="list" className="pt-20 sm:pt-28" />
        <CompanyStatsSection className="pt-16 sm:pt-24" />
        <ReviewsSection />
        <TrainingSection />
        <ContactSection />
        <ProcessSection />
        <FaqSection />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
