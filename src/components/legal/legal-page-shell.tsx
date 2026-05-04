import type { ReactNode } from "react";
import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LegalPageShellProps = {
  homeHref: string;
  homeLabel: string;
  docTitle: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  backLabel: string;
  children: ReactNode;
};

export function LegalPageShell({
  homeHref,
  homeLabel,
  docTitle,
  lastUpdatedLabel,
  lastUpdated,
  backLabel,
  children,
}: LegalPageShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <div className="relative flex-1 w-full pt-24 pb-28 px-4 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-20%,rgba(99,102,241,0.14),transparent),radial-gradient(ellipse_70%_45%_at_100%_40%,rgba(112,51,255,0.08),transparent),radial-gradient(ellipse_55%_38%_at_0%_55%,rgba(14,165,233,0.06),transparent)]" />

        <div className="mx-auto w-full max-w-4xl">
          <nav
            className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              href={homeHref}
              className="inline-flex items-center rounded-full border border-border/30 bg-background/70 px-3 py-1 transition-colors hover:text-primary backdrop-blur"
            >
              {homeLabel}
            </Link>
            <span className="text-border" aria-hidden>
              /
            </span>
            <span className="rounded-full border border-border/20 bg-background/50 px-3 py-1 text-foreground/90 backdrop-blur">
              {docTitle}
            </span>
          </nav>

          <Link
            href={homeHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-7 inline-flex items-center text-muted-foreground hover:text-primary"
            )}
          >
            <IconChevronLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>

          <article className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/80 backdrop-blur-md shadow-[0_24px_90px_rgba(15,23,42,0.10)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.40)] p-8 md:p-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <header className="border-b border-border/20 pb-8 mb-10">
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {docTitle}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/80">{lastUpdatedLabel}</span>{" "}
                  {lastUpdated}
                </p>
                <span className="h-5 w-px bg-border/40" aria-hidden />
                <span className="inline-flex items-center rounded-full border border-border/30 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
                  DreamTeam Technology
                </span>
              </div>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h2:scroll-mt-28 prose-h2:text-xl prose-h2:md:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-foreground prose-p:text-[0.9375rem] prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              {children}
            </div>
          </article>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </main>
  );
}
