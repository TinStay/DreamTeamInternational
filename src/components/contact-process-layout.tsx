import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { ProcessSection } from "@/components/process-section";
import { ContactSection } from "@/components/contact-section";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";

export function ContactProcessLayout() {
  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-8 pt-24 sm:pt-24 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl px-4">
          <PageBreadcrumbs className="mb-6" />
        </div>
        <ContactSection className="pt-0 sm:pt-0 lg:pt-0" />
        <ProcessSection />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
