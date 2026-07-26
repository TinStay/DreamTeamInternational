import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { HeroSection } from "@/components/hero-section";
import { PortfolioSection } from "@/components/portfolio-section";
import { ServicesSection } from "@/components/services-section";
import { PartnersSection } from "@/components/partners-section";
import { ContactSection } from "@/components/contact-section";
import { ProcessSection } from "@/components/process-section";
import { CompanyStatsSection } from "@/components/company-stats-section";
import { TrainingSection } from "@/components/training/training-section";
import { ReviewsSection } from "@/components/reviews-section";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";

export function HomePage() {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      {/* Site-wide animated grid (replaces dot pattern) */}
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="flex-1 w-full relative z-10 flex flex-col">
        <HeroSection />

        <div className="relative">
          <PartnersSection />
        </div>

        <div className="relative">
          <ServicesSection />
        </div>

        <div className="relative">
          <PortfolioSection />
        </div>

        <div className="relative">
          <CompanyStatsSection />
        </div>

        <div className="relative">
          <ReviewsSection />
        </div>

        <div className="relative">
          <TrainingSection />
        </div>

        <div className="relative">
          <ContactSection />
        </div>

        <div className="relative">
          <ProcessSection />
        </div>

        <div className="relative">
          <FaqSection />
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}

