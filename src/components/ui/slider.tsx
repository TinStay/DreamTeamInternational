"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

/**
 * Base UI slider styled to match the site's primitives — muted track with a
 * brand-gradient fill. Single-thumb by default; pass `value`/`onValueChange`
 * from the parent.
 */
function Slider({ className, ...props }: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn("w-full", className)} {...props}>
      <SliderPrimitive.Control className="flex w-full cursor-pointer touch-none items-center py-3 select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50">
        <SliderPrimitive.Track className="relative h-1.5 w-full rounded-full bg-muted select-none">
          <SliderPrimitive.Indicator className="rounded-full bg-primary-gradient select-none" />
          <SliderPrimitive.Thumb className="size-5 rounded-full border border-border bg-background shadow-[0_2px_10px_rgba(15,23,42,0.25)] transition-shadow select-none hover:shadow-[0_2px_14px_var(--primary-soft-glow)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-foreground" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
