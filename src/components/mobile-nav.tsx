"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { Home, Layers, Video, CreditCard, Mail, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/lib/i18n/language-context";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm rounded-[2rem] liquid-glass px-2 py-3 flex items-center justify-between border border-border/20 shadow-2xl bg-background/80 backdrop-blur-md">
        
        {/* Left Side (Home, Process) */}
        <div className="flex justify-around items-center w-[40%]">
          <Link href="/" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group px-2 py-1 select-none">
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium tracking-wide">{t.mobileNav.home}</span>
          </Link>
          
          <Link href="#process" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group px-2 py-1 select-none">
            <Layers size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium tracking-wide">{t.mobileNav.process}</span>
          </Link>
        </div>

        {/* Center Hamburger */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 -mt-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger render={
              <button className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all outline-none" />
            }>
              <Menu size={24} />
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl border-t-0 liquid-glass p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border/40 rounded-full" />
              <div className="flex flex-col h-full pt-16 pb-8 px-6 overflow-y-auto">
                <div className="flex flex-col items-center mb-8 pb-8 border-b border-border/20">
                  <img src="/logo-1.png" alt="DreamTeam Technology" className="h-10 w-auto mb-6 grayscale dark:invert" />
                  <div className="flex gap-4">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>

                <div className="flex flex-col gap-6 text-xl font-heading font-medium">
                  <Link href="#process" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none">
                    <Layers /> {t.header.process}
                  </Link>
                  <Link href="#portfolio" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none">
                    <Video /> {t.header.portfolio}
                  </Link>
                  <Link href="#order-form" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none">
                    <CreditCard /> {t.header.pricing}
                  </Link>
                  <Link href="#contact" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors select-none">
                    <Mail /> {t.header.contact}
                  </Link>
                </div>

                <div className="mt-auto pt-8">
                  <p className="text-sm text-muted-foreground mb-4">{t.mobileNav.ready}</p>
                  <Link 
                    href="#contact" 
                    onClick={() => setIsOpen(false)}
                    className="w-full h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg select-none"
                  >
                    {t.header.chat}
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Right Side (Work, Contact) */}
        <div className="flex justify-around items-center w-[40%]">
          <Link href="#portfolio" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group px-2 py-1 select-none">
            <Video size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium tracking-wide">{t.mobileNav.work}</span>
          </Link>
          
          <Link href="#contact" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group px-2 py-1 select-none">
            <Mail size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium tracking-wide">{t.mobileNav.contact}</span>
          </Link>
        </div>

      </div>
    </>
  );
}
