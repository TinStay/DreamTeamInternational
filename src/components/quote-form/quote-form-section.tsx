"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconSend,
} from "@tabler/icons-react";

import {
  Button,
  ctaPillClassName,
  primaryGradientInteractiveClassName,
} from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { EMAIL_RE } from "@/lib/server/form-guards";
import { servicesPath } from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/social-links";
import {
  QUOTE_FORM_DEFAULTS,
  QUOTE_STEPS,
  isQuoteStepValid,
  type QuoteFieldUpdater,
  type QuoteFormData,
} from "@/lib/quote-form/constants";
import { cn } from "@/lib/utils";
import { ScriptStep } from "./steps/script-step";
import { VideoStep } from "./steps/video-step";
import { GoalStep } from "./steps/goal-step";
import { DetailsStep } from "./steps/details-step";
import { ContactStep } from "./steps/contact-step";

/**
 * Enter-only step transition. Exit animations are deliberately avoided:
 * AnimatePresence exit-gated unmounts hang with the current motion/React
 * versions, freezing the wizard on the outgoing step.
 */
const contentVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

/** Staggered enter animation for the confirmation screen. */
const successItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const successIconVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function sumBytes(files: File[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}

/**
 * Multi-step "request a quote" form (video service) — sits right after the
 * hero. Each step is its own component under `./steps`; answers post to
 * `/api/quote` together with any uploaded files.
 */
export function QuoteFormSection({ className }: { className?: string }) {
  const { t, language } = useLanguage();
  const q = t.quoteForm;
  const cardRef = React.useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = React.useState(0);
  const [data, setData] = React.useState<QuoteFormData>(QUOTE_FORM_DEFAULTS);
  const [scriptFiles, setScriptFiles] = React.useState<File[]>([]);
  const [refFiles, setRefFiles] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Stable across renders and updater-aware, so step handlers never need to
  // close over `data` (see `QuoteFieldUpdater`). No field holds a function, so
  // `typeof === "function"` safely discriminates value from updater.
  const update = React.useCallback<QuoteFieldUpdater>((field, value) => {
    setData((prev) => ({
      ...prev,
      [field]:
        typeof value === "function"
          ? (value as (p: QuoteFormData[typeof field]) => QuoteFormData[typeof field])(
              prev[field]
            )
          : value,
    }));
  }, []);

  const stepKey = QUOTE_STEPS[currentStep];
  const isLastStep = currentStep === QUOTE_STEPS.length - 1;
  const canProceed = isQuoteStepValid(stepKey, data, EMAIL_RE);

  const scriptBytes = React.useMemo(() => sumBytes(scriptFiles), [scriptFiles]);
  const refBytes = React.useMemo(() => sumBytes(refFiles), [refFiles]);

  // Scroll AFTER the new step commits — scrolling before the re-render loses
  // to the browser's scroll anchoring when the steps differ in height.
  const pendingScrollRef = React.useRef(false);
  React.useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    const el = cardRef.current;
    if (!el) return;
    // Mobile: always return to the top of the form on step change; desktop
    // only when the card top scrolled out of view.
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile || el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentStep]);

  function goTo(step: number) {
    pendingScrollRef.current = true;
    setCurrentStep(step);
  }

  async function handleSubmit() {
    if (!canProceed || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify({ ...data, language }));
      for (const file of scriptFiles) fd.append("scriptFile", file);
      for (const file of refFiles) fd.append("refFile", file);

      const res = await fetch("/api/quote", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setData(QUOTE_FORM_DEFAULTS);
    setScriptFiles([]);
    setRefFiles([]);
    setSubmitError(false);
    setSubmitted(false);
    setCurrentStep(0);
  }

  return (
    <section
      id="quote"
      // scroll-mt keeps the heading clear of the fixed header on #quote navigation.
      className={cn("relative w-full scroll-mt-24 py-10 sm:py-14", className)}
    >
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        <div className="mb-8 sm:mb-10">
          <h2 className="font-heading mb-3 text-4xl font-bold text-foreground md:text-5xl">
            {q.title1} <span className="text-section-accent">{q.title2}</span>
          </h2>
        </div>

        <div ref={cardRef} className="scroll-mt-24">
          {/* Stepper temporarily disabled (kept for a future revision).
          <div className="mb-6">
            <div className="mb-2 flex justify-between">
              {QUOTE_STEPS.map((key, index) => {
                const reachable = index <= currentStep && !submitted;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!reachable}
                    onClick={() => reachable && goTo(index)}
                    aria-label={q.steps[key]}
                    className={cn(
                      "flex flex-col items-center gap-1.5",
                      reachable ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <span
                      className={cn(
                        "size-3.5 rounded-full transition-all duration-300",
                        index < currentStep || submitted
                          ? "bg-primary-gradient"
                          : index === currentStep
                            ? "bg-primary-gradient ring-4 ring-primary/20"
                            : "bg-muted"
                      )}
                    />
                    <span
                      className={cn(
                        "hidden text-xs sm:block",
                        index === currentStep && !submitted
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {q.steps[key]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary-gradient"
                initial={false}
                animate={{
                  width: submitted
                    ? "100%"
                    : `${(currentStep / (QUOTE_STEPS.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          */}

          {/* Form card */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isLastStep) void handleSubmit();
            }}
            className={cn(
              "rounded-3xl border border-border/30 bg-card p-6 text-card-foreground shadow-elevated-soft sm:p-8",
              // Confirmation screen: slightly tighter side padding.
              submitted && "px-4 sm:px-6"
            )}
          >
            {/* Honeypot: hidden from users, catches bots that fill every field. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
            >
              <label htmlFor="quote-website">Company website</label>
              <input
                id="quote-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={data.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>

            {submitted ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
                }}
                className="mx-auto grid max-w-3xl grid-cols-1 items-center gap-8 lg:grid-cols-2"
              >
                {/* Left column: large confirmation icon (also on top on mobile). */}
                <motion.div variants={successIconVariants} className="flex justify-center">
                  <Image
                    src="/request_form/confirmation_icon.png"
                    alt=""
                    width={512}
                    height={512}
                    sizes="288px"
                    className="size-40 object-contain drop-shadow-[0_18px_54px_var(--primary-soft-glow)] sm:size-52 lg:size-72"
                  />
                </motion.div>

                {/* Right column: text, CTAs, socials. */}
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <motion.h3
                    variants={successItemVariants}
                    className="font-heading text-xl font-bold break-words text-foreground sm:text-2xl md:text-3xl"
                  >
                    {q.successTitle}
                  </motion.h3>
                  <motion.p
                    variants={successItemVariants}
                    className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground"
                  >
                    {q.successBody}
                  </motion.p>

                  <motion.div
                    variants={successItemVariants}
                    className="mt-7 flex flex-col items-center gap-3 sm:flex-row"
                  >
                    <Link
                      href={servicesPath(language)}
                      className={cn(primaryGradientInteractiveClassName, ctaPillClassName)}
                    >
                      {q.successCta}
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="h-11 rounded-full px-6"
                    >
                      {q.successAgain}
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={successItemVariants}
                    className="mt-8 flex items-center gap-6"
                  >
                    {SOCIAL_LINKS.map((social) => (
                      <a
                        key={social.alt}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center transition-transform hover:scale-110"
                      >
                        <Image
                          src={social.src}
                          alt={social.alt}
                          width={256}
                          height={256}
                          sizes="40px"
                          className="size-10 shrink-0 object-contain opacity-90 transition-opacity hover:opacity-100"
                        />
                      </a>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div
                  key={stepKey}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {stepKey === "script" && (
                    <ScriptStep
                      data={data}
                      update={update}
                      scriptFiles={scriptFiles}
                      onScriptFiles={setScriptFiles}
                      otherBytes={refBytes}
                    />
                  )}
                  {stepKey === "goal" && <GoalStep data={data} update={update} />}
                  {stepKey === "video" && (
                    <VideoStep
                      data={data}
                      update={update}
                      refFiles={refFiles}
                      onRefFiles={setRefFiles}
                      otherBytes={scriptBytes}
                    />
                  )}
                  {stepKey === "details" && <DetailsStep data={data} update={update} />}
                  {stepKey === "contact" && <ContactStep data={data} update={update} />}
                </motion.div>

                <div className="mt-8 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goTo(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0 || isSubmitting}
                    className="h-10 rounded-full px-5"
                  >
                    <IconChevronLeft className="size-4" /> {q.back}
                  </Button>

                  {isLastStep ? (
                    <Button
                      type="submit"
                      disabled={!canProceed || isSubmitting}
                      className="h-10 rounded-full px-6 font-bold"
                    >
                      {isSubmitting ? (
                        <>
                          <IconLoader2 className="size-4 animate-spin" /> {q.sending}
                        </>
                      ) : (
                        <>
                          {q.submit}
                          <IconSend className="size-4" fill="currentColor" stroke="none" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => goTo(currentStep + 1)}
                      disabled={!canProceed}
                      className="h-10 rounded-full px-6 font-bold"
                    >
                      {q.next} <IconChevronRight className="size-4" />
                    </Button>
                  )}
                </div>

                {submitError ? (
                  <div
                    role="alert"
                    className="mt-5 flex gap-3 rounded-2xl border border-destructive/25 bg-gradient-to-br from-destructive/10 via-background to-background p-4 dark:from-destructive/15"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
                      <IconAlertTriangle className="size-5" stroke={2.25} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-destructive">
                        {t.contact.sendErrorTitle}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {t.contact.sendErrorBody}
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
