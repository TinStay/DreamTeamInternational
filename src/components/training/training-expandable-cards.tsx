"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconHourglassFilled } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { primaryGradientInteractiveClassName } from "@/components/ui/button";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z } from "@/lib/modal-layer";
import { cn } from "@/lib/utils";

export type TrainingExpandableCard = {
  id: string;
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  /** When true, CTA is non-interactive and a “coming soon” chip is shown. */
  comingSoon?: boolean;
  comingSoonLabel?: string;
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
  const [portalReady, setPortalReady] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

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
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const modalLayer =
    portalReady &&
    createPortal(
      <>
        <AnimatePresence>
          {active && typeof active === "object" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "fixed inset-0 h-full w-full bg-black/40 backdrop-blur-[2px]",
                MODAL_BACKDROP_Z
              )}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {active && typeof active === "object" ? (
            <div
              className={cn(
                "fixed inset-0 flex md:items-center md:justify-center md:p-4",
                MODAL_CONTENT_Z
              )}
            >
              <motion.button
                key={`close-${active.id}-${id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                type="button"
                className={cn(
                  "absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-background/95 shadow-md backdrop-blur-sm md:top-4 md:hidden",
                  MODAL_CONTROL_Z
                )}
                onClick={() => setActive(null)}
                aria-label="Close"
              >
                <CloseIcon />
              </motion.button>
              <motion.div
                layoutId={`card-${active.id}-${id}`}
                ref={ref}
                className="relative flex h-[100dvh] min-h-0 w-full max-w-none flex-col overflow-hidden overscroll-contain rounded-none border-0 bg-card shadow-none md:h-auto md:max-h-[min(90dvh,880px)] md:w-[min(92vw,56rem)] md:max-w-[min(92vw,56rem)] md:grid md:grid-cols-[minmax(220px,36%)_1fr] md:grid-rows-[auto_minmax(0,1fr)] md:rounded-3xl md:border md:border-border/30 md:shadow-2xl"
              >
                <motion.div
                  layoutId={`image-${active.id}-${id}`}
                  className="shrink-0 border-border/25 md:row-span-2 md:min-h-0 md:border-r md:border-b-0"
                >
                  <img
                    width={560}
                    height={320}
                    src={active.src}
                    alt={active.title}
                    className="h-[min(38vh,300px)] w-full object-cover object-center sm:h-[min(40vh,320px)] md:h-full md:min-h-[260px] lg:min-h-[300px]"
                  />
                </motion.div>

                <div className="flex shrink-0 flex-col gap-3 border-b border-border/20 p-4 sm:gap-4 md:col-start-2 md:row-start-1 md:border-b md:p-6 md:pb-5">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.h3
                        layoutId={`title-${active.id}-${id}`}
                        className="font-heading text-lg font-semibold text-foreground"
                      >
                        {active.title}
                      </motion.h3>
                      {active.comingSoon && active.comingSoonLabel ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-50">
                          <IconHourglassFilled className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {active.comingSoonLabel}
                        </span>
                      ) : null}
                    </div>
                    <motion.p
                      layoutId={`description-${active.id}-${id}`}
                      className="text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]"
                    >
                      {active.description}
                    </motion.p>
                  </div>

                  {active.comingSoon ? (
                    <motion.span
                      layoutId={`button-${active.id}-${id}`}
                      className={cn(
                        "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-sm font-semibold shadow-md sm:w-auto sm:self-end",
                        primaryGradientInteractiveClassName,
                        "pointer-events-none cursor-not-allowed opacity-55"
                      )}
                      aria-disabled
                    >
                      <IconHourglassFilled className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {active.ctaText}
                    </motion.span>
                  ) : (
                    <motion.a
                      layoutId={`button-${active.id}-${id}`}
                      href={active.ctaLink}
                      target={active.ctaLink.startsWith("http") ? "_blank" : undefined}
                      rel={active.ctaLink.startsWith("http") ? "noopener noreferrer" : undefined}
                      className={cn(
                        "inline-flex w-full shrink-0 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold shadow-md sm:w-auto sm:self-end",
                        primaryGradientInteractiveClassName
                      )}
                    >
                      {active.ctaText}
                    </motion.a>
                  )}
                </div>

                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1 text-sm leading-relaxed text-muted-foreground md:col-start-2 md:row-start-2 md:px-6 md:pb-6 md:pt-0"
                >
                  {typeof active.content === "function" ? active.content() : active.content}
                </motion.div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </>,
      document.body
    );

  return (
    <>
      {modalLayer}

      <motion.ul
        className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-7 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.14, delayChildren: 0.08 },
          },
        }}
      >
        {cards.map((card) => (
          <motion.li
            key={card.id}
            className="list-none"
            variants={{
              hidden: { opacity: 0, y: 32, scale: 0.97 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
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
              className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/80 p-5 shadow-md backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-card hover:shadow-lg md:p-6"
            >
              <div className="flex w-full flex-col gap-4">
                <motion.div layoutId={`image-${card.id}-${id}`} className="overflow-hidden rounded-xl">
                  <img
                    width={560}
                    height={360}
                    src={card.src}
                    alt={card.title}
                    className="h-52 w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02] sm:h-56 md:h-60"
                  />
                </motion.div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <motion.h3
                      layoutId={`title-${card.id}-${id}`}
                      className="font-heading text-center text-lg font-semibold text-foreground md:text-left"
                    >
                      {card.title}
                    </motion.h3>
                    {card.comingSoon && card.comingSoonLabel ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-50">
                        <IconHourglassFilled className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {card.comingSoonLabel}
                      </span>
                    ) : null}
                  </div>
                  <motion.p
                    layoutId={`description-${card.id}-${id}`}
                    className="text-center text-base leading-snug text-muted-foreground md:text-left"
                  >
                    {card.description}
                  </motion.p>
                </div>
                <motion.span
                  layoutId={`button-${card.id}-${id}`}
                  className={cn(
                    "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-center text-sm font-semibold shadow-md md:text-base",
                    primaryGradientInteractiveClassName,
                    card.comingSoon
                      ? "pointer-events-none cursor-not-allowed opacity-55"
                      : "group-hover:scale-[1.03] group-hover:shadow-[0_12px_30px_var(--primary-elevated-shadow)] group-hover:from-[color-mix(in_srgb,var(--primary-gradient-start)_86%,white)] group-hover:to-[color-mix(in_srgb,var(--primary-gradient-end)_84%,#f3ecff)]"
                  )}
                  aria-disabled={card.comingSoon ? true : undefined}
                >
                  {card.comingSoon ? (
                    <IconHourglassFilled className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  ) : null}
                  {card.ctaText}
                </motion.span>
              </div>
            </motion.div>
          </motion.li>
        ))}
      </motion.ul>
    </>
  );
}
