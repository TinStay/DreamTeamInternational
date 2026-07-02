"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
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

export type ServiceStepSubItem = {
  id: string;
  title: string;
  content: string;
};

export type ServiceStep = {
  id: string;
  title: string;
  text?: string;
  items?: ServiceStepSubItem[];
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
  scrollable?: boolean;
};

const STEP_CONTENT_BG = "bg-neutral-50/40 dark:bg-slate-800/40";

function StepBody({ step }: { step: ServiceStep }) {
  const hasItems = Boolean(step.items?.length);

  return (
    <div className={cn("overflow-hidden rounded-b-lg border-t border-border", STEP_CONTENT_BG)}>
      {step.text ? (
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed text-muted-foreground",
            hasItems && "border-b border-border/60"
          )}
        >
          {step.text}
        </div>
      ) : null}
      {step.items?.map((item) => (
        <Collapsible
          key={item.id}
          className="border-t border-border/60 first:border-t-0"
          defaultOpen={false}
        >
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-neutral-100/50 dark:hover:bg-slate-800/50 [&[data-open]>svg]:rotate-180">
            <ChevronDown
              aria-hidden
              className="size-4 shrink-0 opacity-60 transition-transform duration-200"
            />
            {item.title}
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden px-4 pb-3 ps-10 text-sm leading-relaxed text-muted-foreground data-closed:animate-accordion-up data-open:animate-accordion-down">
            {item.content}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

export function ServiceStepsAccordion({
  steps,
  className,
  scrollable = false,
}: ServiceStepsAccordionProps) {
  const firstId = steps[0]?.id ?? "";

  return (
    <div
      className={cn(
        "w-full",
        scrollable && "min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-3",
        className
      )}
    >
      <Accordion
        defaultValue={firstId ? [firstId] : []}
        className="w-full space-y-2"
      >
        {steps.map((step, index) => {
          const style = STEP_STYLES[index % STEP_STYLES.length];
          const Icon = style.icon;

          return (
            <AccordionItem
              key={step.id}
              value={step.id}
              className="overflow-hidden rounded-lg border border-border/60 bg-card dark:border-slate-800"
            >
              <AccordionTrigger className="group/accordion-trigger shrink-0 cursor-pointer px-4 py-3 hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden">
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
              <AccordionContent className="overflow-hidden p-0 data-closed:animate-none data-open:animate-none [&>div]:!h-auto [&>div]:overflow-hidden [&>div]:pb-0 [&>div]:data-ending-style:!h-auto [&>div]:data-starting-style:!h-auto">
                <StepBody step={step} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
