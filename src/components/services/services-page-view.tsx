"use client";

import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { ServiceCard } from "@/components/ui/service-card";
import { ContactSection } from "@/components/contact-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { servicePath } from "@/lib/routes";
import { getServiceCardVariant, getServiceSlug } from "@/lib/services/constants";

export function ServicesPageView() {
  const { t, language } = useLanguage();
  const router = useRouter();

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 flex-col pb-8 pt-24 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl px-4 xl:max-w-[86rem]">
          <PageBreadcrumbs className="mb-6" />

          <header className="mb-10 lg:mb-12">
            <h1 className="mb-6 font-heading text-4xl font-bold text-foreground md:text-5xl">
              {t.services.title1}{" "}
              <span className="text-section-accent">{t.services.title2}</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{t.services.subtitle}</p>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {t.services.items.map((item, index) => {
              const slug = getServiceSlug(item.imgSrc);
              if (!slug) return null;
              const href = servicePath(language, slug);
              return (
                // The whole card opens the service page (`href`); the quote pill opens the same page on its wizard,
                // already on that service's flow (`#quote`).
                <ServiceCard
                  key={item.imgSrc}
                  title={item.title}
                  imgSrc={item.imgSrc}
                  imgAlt={item.imgAlt}
                  variant={getServiceCardVariant(index)}
                  linkLabel={t.services.learnMore}
                  href={href}
                  cta={{ label: t.services.quoteCta, onClick: () => router.push(`${href}#quote`) }}
                  className="w-full"
                />
              );
            })}
          </div>
        </div>
        {/* The contact section (the form + the details), as on the home page, instead of a bare form. */}
        <ContactSection className="mt-6 lg:mt-10" />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
