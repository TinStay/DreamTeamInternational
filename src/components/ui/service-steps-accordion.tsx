"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  Clapperboard,
  FileText,
  Folder,
  Handshake,
  MinusIcon,
  PlusIcon,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ServiceStep = {
  id: string;
  title: string;
  text: string;
};

const STEP_STYLES: Array<{
  icon: LucideIcon;
  textColor: string;
  bgColor: string;
}> = [
  { icon: FileText, textColor: "text-blue-500", bgColor: "bg-blue-500/10" },
  { icon: Folder, textColor: "text-orange-400", bgColor: "bg-orange-400/10" },
  { icon: Handshake, textColor: "text-teal-400", bgColor: "bg-teal-400/10" },
  { icon: Users, textColor: "text-red-500", bgColor: "bg-red-500/10" },
  { icon: Clapperboard, textColor: "text-violet-500", bgColor: "bg-violet-500/10" },
  { icon: Sparkles, textColor: "text-amber-500", bgColor: "bg-amber-500/10" },
];

type ServiceStepsAccordionProps = {
  steps: ServiceStep[];
  className?: string;
};

export function ServiceStepsAccordion({ steps, className }: ServiceStepsAccordionProps) {
  const firstId = steps[0]?.id ?? "";

  return (
    <Accordion
      multiple
      defaultValue={firstId ? [firstId] : []}
      className={cn("w-full -space-y-1", className)}
    >
      {steps.map((step, index) => {
        const style = STEP_STYLES[index % STEP_STYLES.length];
        const Icon = style.icon;

        return (
          <AccordionItem
            key={step.id}
            value={step.id}
            className="overflow-hidden border bg-background first:rounded-t-lg last:rounded-b-lg last:border-b"
          >
            <AccordionTrigger className="group/accordion-trigger cursor-pointer px-4 py-3 hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "shrink-0 rounded-xl p-2.5",
                      style.bgColor,
                      style.textColor
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <span className="flex-1 text-left text-base font-bold">{step.title}</span>
                </div>
                <div className="relative size-4 shrink-0">
                  <PlusIcon className="absolute inset-0 size-4 text-muted-foreground transition-opacity duration-200 group-aria-expanded/accordion-trigger:opacity-0" />
                  <MinusIcon className="absolute inset-0 size-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-aria-expanded/accordion-trigger:opacity-100" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border bg-accent p-0 text-sm text-muted-foreground">
              <div className="px-4 py-3">{step.text}</div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
