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

      <div className="relative flex-1 w-full pt-28 lg:pt-32 pb-28 px-4">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(112,51,255,0.06),transparent)]" />

        <div className="max-w-3xl mx-auto">
          <nav
            className="text-sm text-muted-foreground mb-3 flex items-center gap-2 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href={homeHref} className="hover:text-primary transition-colors">
              {homeLabel}
            </Link>
            <span className="text-border" aria-hidden>
              /
            </span>
            <span className="text-foreground font-medium">{docTitle}</span>
          </nav>

          <Link
            href={homeHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-6 inline-flex items-center text-muted-foreground hover:text-primary"
            )}
          >
            <IconChevronLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>

          <article className="rounded-3xl border border-border/30 bg-card/80 backdrop-blur-md shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] p-8 md:p-12">
            <header className="border-b border-border/20 pb-8 mb-10">
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {docTitle}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">{lastUpdatedLabel}</span>{" "}
                {lastUpdated}
              </p>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-xl prose-h2:md:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-foreground prose-p:text-[0.9375rem] prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
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
