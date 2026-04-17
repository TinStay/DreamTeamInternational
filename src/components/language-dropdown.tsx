"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export function LanguageDropdown({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const flag = language === "bg" ? "🇧🇬" : "🇺🇸";

  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as "bg" | "en")}>
      <SelectTrigger
        aria-label="Language"
        className={cn(
          "w-12 justify-center gap-1 bg-background/30 border-border/20 text-foreground/90 hover:bg-background/40",
          className
        )}
      >
        <span className="text-base leading-none">{flag}</span>
        <SelectValue className="hidden" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="bg">🇧🇬 Български</SelectItem>
        <SelectItem value="en">🇺🇸 English</SelectItem>
      </SelectContent>
    </Select>
  );
}

