import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { HeroSection } from "@/components/hero-section";
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
import { JourneyScene, ScrollJourney } from "@/components/ui/scroll-journey";
import { atomsBackdrop, blobRightBackdrop, journeyMorph, linesBackdrop, servicesBackdrop, wavesBackdrop } from "@/components/ui/journey-backdrops";
import { OSMO_HANDOFF_VH } from "@/components/projects/showcase-timeline";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";

export function HomePage() {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS} data-snap-sections>
      {/* data-snap-sections: on phones the projects stage snaps to its scenes (`SnapStop`, globals.css). */}
      {/* Site-wide animated grid (replaces dot pattern) */}
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="flex-1 w-full relative z-10 flex flex-col">
        {/* Opening journey: the hero's headline / CTAs / partners strip leave as the services + quote wizard
            arrive (its first step IS the services grid); the wizard then leaves into the projects stage below.
            The hero keeps its own top (no header padding, no overlap above it). */}
        <ScrollJourney overlapFirst={false} leaveLast overlap={0.5}>
          {/* The hero is the landing view: pinned from the top of the page, no room of its own. */}
          <JourneyScene className="pt-0" hold={0}>
            {/* Partners marquee lives inside the hero (bottom strip over the video). */}
            <HeroSection />
          </JourneyScene>
          {/* Extra room so the wizard never starts leaving while someone is still on a short step. */}
          <JourneyScene hold={0.45} backdrop={servicesBackdrop}>
            <QuoteFormSection />
          </JourneyScene>
        </ScrollJourney>

        {/* Full portfolio lives on /portfolio (hero CTA + nav). Scroll-driven
            showcase below (sticky stage, full-screen clip per project); the
            filterable list lives on /projects. It overlaps the wizard's tail like
            a journey scene, so its cinema headline is already rising while the
            wizard's parts leave (plain flow under reduced motion). */}
        <div className="relative -mt-[45svh] motion-reduce:mt-0">
          <ProjectsShowcase />
        </div>

        {/* The journey keeps going after the stage: each section is a sticky scene
            whose title and components fly in from different sides and leave again
            (`JourneyItem`s inside the sections) before the next one arrives. */}
        {/* Quick pacing: a section changes within about three wheel ticks. One shape travels the whole journey
            (journey-backdrops.tsx, `journeyMorph`): the canvas comes up `OSMO_HANDOFF_VH` before the stats arrive and
            takes the OSMO copy circle over from the showcase and slides it into the ring behind the stats, splits into
            the two particle lines the review cards travel between, closes into the frame behind the trainings (with
            atoms drifting around), then the outer signal ring behind the contact details; the FAQ gets its blob and
            smaller atoms. The reviews scene drops the header pad: its own sticky stage
            (title + card conveyor) carries it. */}
        <ScrollJourney overlap={0.7} morph={journeyMorph} prelude={OSMO_HANDOFF_VH}>
          <JourneyScene>
            <CompanyStatsSection />
          </JourneyScene>
          {/* The reviews bring their own runway (the card conveyor), so no extra room. */}
          <JourneyScene className="pt-0" hold={0} backdrop={linesBackdrop}>
            <ReviewsSection />
          </JourneyScene>
          <JourneyScene backdrop={atomsBackdrop}>
            <TrainingSection />
          </JourneyScene>
          <JourneyScene backdrop={wavesBackdrop}>
            <ContactSection />
          </JourneyScene>
          <JourneyScene>
            <ProcessSection />
          </JourneyScene>
          <JourneyScene backdrop={blobRightBackdrop}>
            <FaqSection />
          </JourneyScene>
        </ScrollJourney>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}

