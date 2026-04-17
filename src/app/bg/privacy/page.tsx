import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Политика за поверителност | DreamTeam Technology",
  alternates: {
    canonical: "/bg/privacy",
    languages: {
      en: "/privacy",
      bg: "/bg/privacy",
    },
  },
};

export default function PrivacyPageBg() {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="flex-1 w-full pt-32 pb-24 px-4 max-w-4xl mx-auto">
        <Link
          href="/bg"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "mb-8 pl-0 hover:bg-transparent hover:scale-105 transition-transform text-muted-foreground hover:text-primary"
          )}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Обратно към началото
        </Link>

        <div className="liquid-glass rounded-3xl p-8 md:p-12 border border-border/20 shadow-xl prose prose-invert max-w-none prose-headings:font-heading prose-a:text-primary">
          <h1 className="text-4xl font-bold mb-8">Политика за поверителност</h1>

          <p className="text-muted-foreground mb-6">
            Последна актуализация: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-6 text-foreground/80 leading-relaxed">
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              1. Преглед
            </h2>
            <p>
              Тази политика описва как събираме, използваме и защитаваме вашата
              информация при използване на сайта и услугите ни.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              2. Каква информация събираме
            </h2>
            <p>
              Възможно е да събираме информация, която предоставяте чрез формите
              за контакт, както и базови аналитични данни.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              3. Контакт
            </h2>
            <p>
              Ако имате въпроси, пишете ни на{" "}
              <a href="mailto:info@dreamteam.technology">info@dreamteam.technology</a>.
            </p>
          </section>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </main>
  );
}

