import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Terms & Conditions | DreamTeam Technology",
  alternates: {
    canonical: "/terms",
    languages: {
      en: "/terms",
      bg: "/bg/terms",
    },
  },
};

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />
      
      <div className="flex-1 w-full pt-32 pb-24 px-4 max-w-4xl mx-auto">
        <Link 
          href="/"
          className={cn(
             buttonVariants({ variant: "ghost" }),
             "mb-8 pl-0 hover:bg-transparent hover:scale-105 transition-transform text-muted-foreground hover:text-primary"
          )}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>
        
        <div className="liquid-glass rounded-3xl p-8 md:p-12 border border-border/20 shadow-xl prose prose-invert max-w-none prose-headings:font-heading prose-a:text-primary">
          <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
          
          <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="space-y-6 text-foreground/80 leading-relaxed">
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p>Welcome to DreamTeam Technology. By accessing our website and using our video production services, you agree to these terms...</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Services Provided</h2>
            <p>We specialize in AI video production. The final deliverables, style, and scope of each project are defined in the specific order agreement.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Intellectual Property</h2>
            <p>Unless explicitly agreed otherwise, you retain rights to your own materials, while we retain certain rights to the raw AI generation assets. Full commercial rights to the final exported video are transferred to you upon final payment.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Revisions & Refunds</h2>
            <p>We offer revisions based on the selected package. Refunds are handled on a case-by-case basis before production begins.</p>
          </section>
        </div>
      </div>
      
      <Footer />
      <MobileNav />
    </main>
  );
}
