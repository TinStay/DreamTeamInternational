"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

export type TrainingExpandableCard = {
  id: string;
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: React.ReactNode | (() => React.ReactNode);
};

function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-foreground"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
}

type TrainingExpandableCardsProps = {
  cards: TrainingExpandableCard[];
};

export function TrainingExpandableCards({ cards }: TrainingExpandableCardsProps) {
  const [active, setActive] = useState<TrainingExpandableCard | boolean | null>(null);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 h-full w-full bg-black/40 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0 z-[100] flex md:items-center md:justify-center md:p-4">
            <motion.button
              key={`close-${active.id}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              type="button"
              className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[110] flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-background/95 shadow-md backdrop-blur-sm md:top-4 md:hidden"
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="relative flex h-[100dvh] min-h-0 w-full max-w-none flex-col overflow-y-auto overscroll-contain rounded-none border-0 bg-card shadow-none md:max-h-[90dvh] md:w-[60vw] md:max-w-[60vw] md:rounded-3xl md:border md:border-border/30 md:shadow-2xl"
            >
              <motion.div layoutId={`image-${active.id}-${id}`} className="shrink-0">
                <img
                  width={560}
                  height={320}
                  src={active.src}
                  alt={active.title}
                  className="h-[min(42vh,320px)] w-full object-cover object-center md:h-56 md:rounded-t-3xl"
                />
              </motion.div>

              <div className="shrink-0 flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <motion.h3
                    layoutId={`title-${active.id}-${id}`}
                    className="font-heading text-lg font-semibold text-foreground"
                  >
                    {active.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${active.id}-${id}`}
                    className="mt-1 text-sm text-muted-foreground"
                  >
                    {active.description}
                  </motion.p>
                </div>

                <motion.a
                  layoutId={`button-${active.id}-${id}`}
                  href={active.ctaLink}
                  target={active.ctaLink.startsWith("http") ? "_blank" : undefined}
                  rel={active.ctaLink.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-[filter] hover:brightness-110"
                >
                  {active.ctaText}
                </motion.a>
              </div>

              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm leading-relaxed text-muted-foreground md:pb-6"
              >
                {typeof active.content === "function" ? active.content() : active.content}
              </motion.div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.id} className="list-none">
            <motion.div
              layoutId={`card-${card.id}-${id}`}
              role="button"
              tabIndex={0}
              onClick={() => setActive(card)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive(card);
                }
              }}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card"
            >
              <div className="flex w-full flex-col gap-3">
                <motion.div layoutId={`image-${card.id}-${id}`} className="overflow-hidden rounded-xl">
                  <img
                    width={400}
                    height={240}
                    src={card.src}
                    alt={card.title}
                    className="h-44 w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </motion.div>
                <div className="flex flex-col gap-1">
                  <motion.h3
                    layoutId={`title-${card.id}-${id}`}
                    className="font-heading text-center text-base font-semibold text-foreground md:text-left"
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${card.id}-${id}`}
                    className="text-center text-sm text-muted-foreground md:text-left"
                  >
                    {card.description}
                  </motion.p>
                </div>
                <motion.span
                  layoutId={`button-${card.id}-${id}`}
                  className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-md transition-[filter] group-hover:brightness-110"
                >
                  {card.ctaText}
                </motion.span>
              </div>
            </motion.div>
          </li>
        ))}
      </ul>
    </>
  );
}
