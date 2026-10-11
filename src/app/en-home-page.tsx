import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { EnHeroSection } from "@/components/en-hero-section";
import { VideoPackSection } from "@/components/video-pack-section";
import { PackagesSection } from "@/components/packages-section";
import { AiPartnersSection } from "@/components/ai-partners-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { ReviewsSection } from "@/components/reviews-section";
import { ClientSpotlight } from "@/components/client-spotlight";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// The English home page (/en) — its own file so /en can take its own layout without touching the Bulgarian one (/bg,
// `home-page.tsx`). One continuous scroll: the sections simply follow each other in normal flow on the cream ground
// (the site's smooth scrolling still glides the wheel) — no scroll journeys, no pinned scenes, no paged opening, and
// no case studies (the hero's "View Our Work" opens /portfolio).
export function EnHomePage() {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col">
        {/* The first screen: "Get your AI video pack now" and the rail of video categories; the tiger hero follows. */}
        {/* Every section rises into place with the scroll (`ScrollReveal`, scroll-linked - it reverses on the way back up);
            the first screen eases back as it leaves, handing over to the hero. */}
        <ScrollReveal leave rise={0} from={1}>
          <VideoPackSection />
        </ScrollReveal>
        <ScrollReveal>
          <EnHeroSection />
        </ScrollReveal>
        {/* "Find the package that fits your needs" - the kinds of video we make (was the services + quote wizard; the
            wizard lives on /services and /contact). */}
        {/* Its cards tip up one after another with the scroll (the section animates itself). */}
        <PackagesSection />
        {/* The AI companies whose models we work with, scrolling by in an orange card. */}
        {/* The band opens out, the title and logos slide in from the sides (its own animation). */}
        <AiPartnersSection />
        {/* How it works - right after the packages. */}
        {/* The heading and cards rise in sequence (its own animation). */}
        <HowItWorksSection />
        {/* What our clients say, led by the MindGuard founders' words. */}
        <ScrollReveal>
          <ReviewsSection spotlight={<ClientSpotlight />} />
        </ScrollReveal>
        <ScrollReveal>
          <FaqSection />
        </ScrollReveal>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
