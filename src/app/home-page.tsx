import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { HeroSection } from "@/components/hero-section";
import { ProcessSection } from "@/components/process-section";
import { PortfolioSection } from "@/components/portfolio-section";
import { PartnersSection } from "@/components/partners-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { InfiniteGridBackground } from "@/components/ui/the-infinite-grid";

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden relative">
      {/* Site-wide animated grid (replaces dot pattern) */}
      <div className="fixed inset-0 z-[-1] bg-background">
        <InfiniteGridBackground className="absolute inset-0 h-full w-full" />
      </div>

      <SiteHeader />

      <div className="flex-1 w-full relative z-10 flex flex-col">
        <HeroSection />

        <div className="relative">
          <PartnersSection />
        </div>

        <div className="relative">
          <PortfolioSection />
        </div>

        <div className="relative">
          <ContactSection />
        </div>

        <ProcessSection />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}

