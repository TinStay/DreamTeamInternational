"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { ServiceCard } from "@/components/ui/service-card";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { useLanguage } from "@/lib/i18n/language-context";
import { servicePath } from "@/lib/routes";
import { getServiceCardVariant, getServiceSlug } from "@/lib/services/constants";

export function ServicesPageView() {
  const { t, language } = useLanguage();

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 px-4 pb-28 pt-24 lg:pb-32 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl xl:max-w-[86rem]">
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
              return (
                <Link
                  key={item.imgSrc}
                  href={servicePath(language, slug)}
                  className="block w-full rounded-xl"
                >
                  <ServiceCard
                    title={item.title}
                    imgSrc={item.imgSrc}
                    imgAlt={item.imgAlt}
                    variant={getServiceCardVariant(index)}
                    linkLabel={t.services.learnMore}
                    className="w-full"
                  />
                </Link>
              );
            })}
          </div>

          <section id="contact" className="mt-14 lg:mt-16">
            <div className="mx-auto max-w-3xl">
              <ContactInquiryForm
                variant="card"
                formStateBg="Услуги (страница)"
                heading={
                  <>
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                      {t.services.ctaHeading}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t.services.ctaSubtitle}
                    </p>
                  </>
                }
              />
            </div>
          </section>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
