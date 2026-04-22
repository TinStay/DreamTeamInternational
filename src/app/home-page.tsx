import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { HeroSection } from "@/components/hero-section";
import { ProcessSection } from "@/components/process-section";
import { PortfolioSection } from "@/components/portfolio-section";
import { PartnersSection } from "@/components/partners-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden relative">
      {/* Background that covers everything */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-background">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
            "dark:[background-image:radial-gradient(rgba(82,82,82,0.35)_1px,transparent_1px)]",
          )}
        />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
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

