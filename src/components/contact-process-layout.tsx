import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { ProcessSection } from "@/components/process-section";
import { ContactSection } from "@/components/contact-section";
import { ContactQuoteCta } from "@/components/contact-quote-cta";
import { QuoteFormSection } from "@/components/quote-form/quote-form-section";
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
        {/* The form + details, with the review badges under the social icons. */}
        <ContactSection className="pt-0 sm:pt-0 lg:pt-0" reviews />
        {/* Under the form: the slim quote card, whose pill scrolls on to the service cards + wizard right below. */}
        <div className="mx-auto w-full max-w-7xl px-4">
          <ContactQuoteCta className="mb-2" />
        </div>
        {/* The home page's service cards + step form (`#quote`). */}
        <QuoteFormSection />
        <ProcessSection />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
