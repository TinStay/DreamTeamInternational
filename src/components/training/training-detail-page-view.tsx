"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronLeft, IconExternalLink } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { homePath } from "@/lib/routes";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Button, buttonVariants, primaryGradientInteractiveClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { TrainingModalDetails, TrainingModalIncludes } from "./training-modal-rich";

function getSlugFromPathname(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const trainingIdx = parts.indexOf("training");
  if (trainingIdx === -1) return null;
  const raw = parts[trainingIdx + 1] ?? null;
  return raw ? decodeURIComponent(raw).toLowerCase() : null;
}

export function TrainingDetailPageView({ slug: slugProp }: { slug?: string }) {
  const { t, language } = useLanguage();
  const tr = t.training;
  const homeHref = homePath(language);
  const formRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "";

  const slug = (slugProp?.toLowerCase() ?? getSlugFromPathname(pathname) ?? "").trim();

  const copy = useMemo(() => {
    if (slug === "individual") return tr.cards.individual;
    if (slug === "skool") return tr.cards.skool;
    if (slug === "corporate") return tr.cards.corporate;
    return tr.cards.individual;
  }, [slug, tr.cards]);

  const isSkool = slug === "skool";

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>

      <SiteHeader />

      <div className="relative z-10 flex w-full flex-1 px-4 pb-24 pt-24 lg:pb-28 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl xl:max-w-[86rem] 2xl:max-w-[96rem]">
          <PageBreadcrumbs className="mb-6" />

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            {/* Left */}
            <section className="rounded-3xl bg-background p-5 shadow-sm ring-1 ring-border/25 sm:p-7">
              <div className="overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
                <img
                  src={copy.image}
                  alt={copy.title}
                  width={1200}
                  height={800}
                  className="h-60 w-full object-cover object-center sm:h-72 lg:h-80"
                />
              </div>

              <header className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {tr.eyebrow}
                </p>
                <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {copy.title}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {copy.suitableFor}
                </p>
              </header>

              <div className="mt-8">
                <TrainingModalIncludes copy={copy} />
              </div>
            </section>

            {/* Right */}
            <aside className="flex flex-col gap-4">
              <div className="rounded-3xl bg-background p-4 shadow-sm ring-1 ring-border/20 sm:p-6">
                <TrainingModalDetails copy={copy} />
              </div>

              <div
                ref={formRef}
                className="rounded-3xl bg-background p-4 shadow-sm ring-1 ring-border/20 sm:p-6"
              >
                {isSkool ? (
                  <div className="flex flex-col gap-3">
                    <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                      {tr.cards.skool.cta}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {copy.modalIntro}
                    </p>
                    <Link
                      href={tr.skoolUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "default", size: "default" }),
                        primaryGradientInteractiveClassName,
                        "h-11 rounded-full px-5 font-semibold cursor-pointer"
                      )}
                    >
                      {tr.cards.skool.cta}
                      <IconExternalLink className="ml-2 h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                ) : (
                  <ContactInquiryForm
                    variant="plain"
                    subject={`Training inquiry: ${copy.title}`}
                    formStateBg={`Форма: Обучения (страница) — ${copy.title}`}
                    showTrainingTarget
                    heading={
                      <>
                        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground md:text-xl">
                          {tr.modalInquiryTitle}
                        </h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {tr.modalInquirySubtitle}
                        </p>
                      </>
                    }
                    className="max-w-none"
                  />
                )}
              </div>
            </aside>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className={cn(
                "h-11 rounded-full px-5 font-semibold cursor-pointer",
                primaryGradientInteractiveClassName
              )}
              onClick={() => {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {tr.cards.individual.cta}
            </Button>

            <Link
              href={homeHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "h-11 rounded-full px-5 font-semibold cursor-pointer"
              )}
            >
              <IconChevronLeft className="mr-2 h-4 w-4" aria-hidden />
              {t.legal.backToHome}
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}

