"use client";

import Image from "next/image";
import { useLanguage, type Language } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { Toggle, ToggleButtonGroup } from "@/components/ui/toggle-group";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <ToggleButtonGroup
      aria-label={t.a11y.language}
      selectionMode="single"
      selectedKeys={[language]}
      onSelectionChange={(keys) => {
        const next = Array.from(keys)[0];
        if (next === "bg" || next === "en") setLanguage(next as Language);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/20 bg-muted/60 p-0.5 shadow-[0_6px_18px_rgba(15,23,42,0.10)]",
        className
      )}
    >
      <Toggle
        id="bg"
        aria-label={t.a11y.bulgarian}
        variant="default"
        size="default"
        className={cn(
          "relative h-8 w-8 cursor-pointer rounded-full px-0",
          "data-[selected]:bg-gradient-to-r data-[selected]:from-[var(--primary-gradient-start)] data-[selected]:to-[var(--primary-gradient-end)]",
          "data-[selected]:shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
          "data-[hovered]:bg-muted/80 data-[hovered]:text-foreground",
          "[&_.flag]:transition-[box-shadow,ring-color] [&_.flag]:duration-200 [&[data-selected]_.flag]:ring-white [&[data-selected]_.flag]:shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
        )}
      >
        <span className="grid h-full w-full place-items-center">
          <span className="flag grid h-5.5 w-5.5 place-items-center overflow-hidden rounded-full ring-2 ring-transparent">
            <Image
              src="/flags/bulgarian_flag.png"
              alt=""
              width={150}
              height={150}
              sizes="150px"
              quality={100}
              className="h-full w-full object-cover"
              priority={false}
            />
          </span>
        </span>
      </Toggle>

      <Toggle
        id="en"
        aria-label={t.a11y.english}
        variant="default"
        size="default"
        className={cn(
          "relative h-8 w-8 cursor-pointer rounded-full px-0",
          "data-[selected]:bg-gradient-to-r data-[selected]:from-[var(--primary-gradient-start)] data-[selected]:to-[var(--primary-gradient-end)]",
          "data-[selected]:shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
          "data-[hovered]:bg-muted/80 data-[hovered]:text-foreground",
          "[&_.flag]:transition-[box-shadow,ring-color] [&_.flag]:duration-200 [&[data-selected]_.flag]:ring-white [&[data-selected]_.flag]:shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
        )}
      >
        <span className="grid h-full w-full place-items-center">
          <span className="flag grid h-5.5 w-5.5 place-items-center overflow-hidden rounded-full ring-2 ring-transparent">
            <Image
              src="/flags/english_flag.png"
              alt=""
              width={150}
              height={150}
              sizes="150px"
              quality={100}
              className="h-full w-full object-cover"
              priority={false}
            />
          </span>
        </span>
      </Toggle>
    </ToggleButtonGroup>
  );
}
