import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Условия | DreamTeam Technology",
  alternates: {
    canonical: "/bg/terms",
    languages: {
      en: "/terms",
      bg: "/bg/terms",
    },
  },
};

export default function TermsPageBg() {
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
          <h1 className="text-4xl font-bold mb-8">Условия</h1>

          <p className="text-muted-foreground mb-6">
            Последна актуализация: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-6 text-foreground/80 leading-relaxed">
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              1. Въведение
            </h2>
            <p>
              Добре дошли в DreamTeam Technology. С достъпа до нашия сайт и
              използването на услугите ни за видео продукция, вие приемате тези
              условия...
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              2. Предоставяни услуги
            </h2>
            <p>
              Специализираме в AI видео продукция. Финалните материали, стилът и
              обхватът на всеки проект се определят в конкретната поръчка.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              3. Интелектуална собственост
            </h2>
            <p>
              Освен ако не е договорено друго, вие запазвате правата върху вашите
              материали, а ние запазваме определени права върху суровите AI
              активи. Пълните търговски права върху финалното експортирано видео
              се прехвърлят след окончателно плащане.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              4. Ревизии и възстановявания
            </h2>
            <p>
              Предлагаме ревизии според избрания пакет. Възстановяванията се
              разглеждат индивидуално преди започване на продукцията.
            </p>
          </section>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </main>
  );
}

