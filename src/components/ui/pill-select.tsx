"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import type { ReactNode } from "react";
import { IconArrowsSort, IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type PillSelectOption<T extends string> = { value: T; label: string };

/**
 * The app's dropdown: a pill the height of the filter chips (a sort icon, the chosen label, a chevron that turns), and a
 * dark glass menu that drops in under it - rows nudge on hover, the chosen one carries an orange tick. Built on base-ui's
 * Select, so it is a real listbox (arrow keys, type-ahead, Escape). `label` is the accessible name - there is no visible
 * caption, the pill is the field.
 */
export function PillSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  icon,
}: {
  value: T;
  onChange: (value: T) => void;
  options: PillSelectOption<T>[];
  label: string;
  className?: string;
  /** The icon at the start of the pill (a sort icon by default). */
  icon?: ReactNode;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => v != null && onChange(v as T)} items={options}>
      <SelectPrimitive.Trigger
        aria-label={label}
        className={cn(
          "group inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] ps-3.5 pe-3 text-sm font-semibold text-white/85 outline-none transition-[transform,border-color,background-color,color,box-shadow] duration-200 ease-out hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.08] hover:text-white focus-visible:border-[#ff8a1f]/70 data-[popup-open]:border-[#ff8a1f]/60 data-[popup-open]:bg-white/[0.08] data-[popup-open]:text-white data-[popup-open]:shadow-[0_0_0_4px_rgba(255,122,26,0.12)]",
          className
        )}
      >
        {icon ?? <IconArrowsSort className="size-4 text-[#ff8a1f]" aria-hidden />}
        <SelectPrimitive.Value>{() => current?.label ?? ""}</SelectPrimitive.Value>
        <IconChevronDown className="size-4 text-white/50 transition-transform duration-200 ease-out group-data-[popup-open]:rotate-180 group-data-[popup-open]:text-[#ff8a1f]" aria-hidden />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner side="bottom" align="end" sideOffset={8} alignItemWithTrigger={false} className="isolate z-[80]">
          <SelectPrimitive.Popup
            className="min-w-[max(var(--anchor-width),12rem)] origin-(--transform-origin) rounded-2xl border border-white/12 bg-[linear-gradient(160deg,rgba(30,31,36,0.97),rgba(16,17,20,0.97))] p-1.5 text-white shadow-[0_24px_60px_-18px_rgba(0,0,0,0.95)] outline-none backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out data-[ending-style]:-translate-y-1 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
          >
            <SelectPrimitive.List>
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className="group/item flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 outline-none transition-[background-color,color,transform] duration-150 ease-out select-none data-[highlighted]:translate-x-0.5 data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-white data-[selected]:font-semibold data-[selected]:text-white"
                >
                  <SelectPrimitive.ItemText className="flex-1 whitespace-nowrap">{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="flex size-5 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white">
                    <IconCheck className="size-3" stroke={3} aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
