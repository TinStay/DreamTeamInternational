"use client";

import { useCallback, useMemo, useState } from "react";
import { notifyProject } from "@/lib/notify-project";
import { motion } from "motion/react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { IconAlertTriangle, IconArrowRight, IconChevronLeft, IconLoader2, IconSend, IconX } from "@tabler/icons-react";
import { ScriptStep } from "@/components/quote-form/steps/script-step";
import { GoalStep } from "@/components/quote-form/steps/goal-step";
import { VideoStep } from "@/components/quote-form/steps/video-step";
import { DetailsStep } from "@/components/quote-form/steps/details-step";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { EMAIL_RE } from "@/lib/server/form-guards";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z } from "@/lib/modal-layer";
import { QUOTE_FORM_DEFAULTS, formatLengthSec, isQuoteStepValid, type QuoteFieldUpdater, type QuoteFormData } from "@/lib/quote-form/constants";
import { projectFromRow, type ClientProject } from "@/lib/client-projects";
import { formatDateDisplay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { notifyCreditsChanged, useCredits } from "@/lib/supabase/use-credits";
import { formatVideoTime } from "@/lib/account-info";
import { pricingPath } from "@/lib/routes";
import Link from "next/link";
import type { CreditSummary } from "@/lib/credits";
import { cn } from "@/lib/utils";

/** The website's video order form, minus its last (contact) screen - the client is signed in, so we already know who they are. */
const STEPS = ["script", "goal", "video", "details"] as const;
type Step = (typeof STEPS)[number];

const enter = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

/** What sample mode pretends the client has, so the form can be tried without an account or a purchase. */
const SAMPLE_CREDITS: CreditSummary = { balance: 120, added: 120, planKey: "creator" };

const sumBytes = (files: File[]) => files.reduce((n, f) => n + f.size, 0);

/**
 * "Submit a project": the video order form in a popup - the same four steps as the Keplerbay site's form (script, goal,
 * video details, distribution and timing) with a progress bar, ending in Submit instead of the contact screen. Submitting
 * creates the project in the client's account right away (Supabase `projects`, status "Brief received", with everything they
 * answered) and lets our team know by email (with any files they attached). In sample mode nothing is saved: the project is
 * only added to the page.
 */
export function SubmitProjectDialog({
  open,
  onOpenChange,
  sample,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sample: boolean;
  /** `notified` is false when files were attached but the email to our team could not be sent. */
  onCreated: (project: ClientProject, notified: boolean) => void;
}) {
  const { t, language } = useLanguage();
  const s = t.account.projectsPage.submit;
  const q = t.quoteForm;
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<QuoteFormData>({ ...QUOTE_FORM_DEFAULTS, service: "video" });
  const [scriptFiles, setScriptFiles] = useState<File[]>([]);
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const credits = useCredits(!sample, sample ? SAMPLE_CREDITS : undefined);
  const available = credits?.balance ?? 0;
  // The project spends the length they chose (if they said "you recommend", the length shown is what is reserved).
  const needed = data.lengthSec;
  const short = credits !== null && needed > available;

  const step: Step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canProceed = isQuoteStepValid(step, data, EMAIL_RE) && !(isLast && (short || credits === null));
  const scriptBytes = useMemo(() => sumBytes(scriptFiles), [scriptFiles]);
  const refBytes = useMemo(() => sumBytes(refFiles), [refFiles]);

  // Stable and updater-aware, exactly like the website's form (steps never close over `data`).
  const update = useCallback<QuoteFieldUpdater>((field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: typeof value === "function" ? (value as (p: QuoteFormData[typeof field]) => QuoteFormData[typeof field])(prev[field]) : value,
    }));
  }, []);

  const reset = () => {
    setStepIndex(0);
    setData({ ...QUOTE_FORM_DEFAULTS, service: "video" });
    setScriptFiles([]);
    setRefFiles([]);
    setName("");
    setError(null);
    setSubmitting(false);
  };

  const autoTitle = () => {
    if (name.trim()) return name.trim();
    if (data.goal === "other" && data.goalOther.trim()) return data.goalOther.trim().slice(0, 60);
    return (data.goal && s.autoTitles[data.goal]) || s.autoTitleDefault;
  };

  /** What they answered, as label / value rows for the project's sidebar. */
  const answers = () => {
    const a = s.answers;
    const rows: { label: string; value: string }[] = [];
    if (data.goal) rows.push({ label: a.goal, value: data.goal === "other" && data.goalOther.trim() ? data.goalOther.trim() : q.video.goals[data.goal] });
    if (data.script) rows.push({ label: a.script, value: q.script.options[data.script].label });
    rows.push({ label: a.length, value: data.lengthFlexible ? q.video.lengthFlexibleLabel : formatLengthSec(data.lengthSec, { seconds: q.video.seconds, minutes: q.video.minutes, lengthMax: q.video.lengthMax }) });
    if (data.formats.length) rows.push({ label: a.format, value: data.formats.map((f) => q.video.formats[f].label).join(", ") });
    if (data.voiceover) rows.push({ label: a.voiceover, value: q.style.voices[data.voiceover] });
    if (data.platforms.length) rows.push({ label: a.platforms, value: data.platforms.map((p) => q.details.platforms[p]).join(", ") });
    if (data.refLinks.trim()) rows.push({ label: a.examples, value: data.refLinks.trim() });
    rows.push({ label: a.deadline, value: data.deadlineFlexible || !data.deadline ? q.details.noDeadline : formatDateDisplay(data.deadline) });
    if (data.notes.trim()) rows.push({ label: a.notes, value: data.notes.trim().slice(0, 4000) });
    const attached = scriptFiles.length + refFiles.length;
    if (attached) rows.push({ label: a.files, value: [...scriptFiles, ...refFiles].map((f) => f.name).join(", ") });
    return rows;
  };

  const formatLabel = () => {
    if (data.formats.length === 0) return null;
    return data.formats.map((f) => (f === "vertical" ? "9:16 vertical" : "16:9 horizontal")).join(" + ");
  };

  async function submit() {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const row = {
        title: autoTitle(),
        kind: s.kind,
        brief: data.scriptText.trim().slice(0, 10000) || null,
        format: formatLabel(),
        duration_seconds: needed,
        due_date: data.deadlineFlexible || !data.deadline ? null : data.deadline,
        brief_answers: answers(),
        next_step: s.nextStep,
      };

      let project: ClientProject;
      const notified = true;
      const attachments = [...scriptFiles, ...refFiles];
      if (sample) {
        project = projectFromRow({
          ...row,
          id: `local-${Date.now()}`,
          status: "brief",
          revisions_total: 2,
          revisions_used: 0,
          created_at: new Date().toISOString(),
          client_name: "You",
          brief_files: attachments.map((f) => ({ name: f.name, path: `sample/${f.name}`, size: f.size })),
        });
      } else {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("not signed in");
        const meta = (auth.user.user_metadata ?? {}) as { full_name?: string; name?: string };
        const clientName = meta.full_name || meta.name || auth.user.email?.split("@")[0] || "Client";

        // The files go to the client's own folder in the private bucket, filed under the new project's id (made here so
        // the folder and the row agree); the team dashboard reads them from there.
        const id = crypto.randomUUID();
        const briefFiles: { name: string; path: string; size: number }[] = [];
        for (const file of attachments) {
          const safe = file.name.replace(/[^\w.\- ]+/g, "_");
          const path = `${auth.user.id}/${id}/${Date.now()}-${safe}`;
          const { error: uploadError } = await supabase.storage.from("project-files").upload(path, file, { contentType: file.type || undefined });
          if (uploadError) throw uploadError;
          briefFiles.push({ name: file.name, path, size: file.size });
        }

        const { data: inserted, error: insertError } = await supabase.rpc("submit_project", {
          p_id: id,
          p_title: row.title,
          p_kind: row.kind,
          p_brief: row.brief,
          p_format: row.format,
          p_duration: needed,
          p_due: row.due_date,
          p_answers: row.brief_answers,
          p_next_step: row.next_step,
          p_files: briefFiles,
          p_client_name: clientName,
          p_client_email: auth.user.email ?? null,
        });
        if (insertError || !inserted) throw insertError ?? new Error("insert failed");
        project = projectFromRow(inserted as Record<string, unknown>);
        // The client's "brief received" email.
        notifyProject(project.id, "submitted");

        // Tell the team by email too (no attachments: the files are in the dashboard). The project is already saved,
        // so a failure here changes nothing for the client.
        try {
          const fd = new FormData();
          fd.append(
            "payload",
            JSON.stringify({
              ...data,
              service: "video",
              name: clientName,
              email: auth.user.email ?? "",
              termsAccepted: true,
              notes: [`New project in the dashboard: ${project.title} (${project.id})`, attachments.length ? `Files (${attachments.length}): ${attachments.map((f) => f.name).join(", ")}` : "", data.notes].filter(Boolean).join("\n\n"),
              language,
            })
          );
          await fetch("/api/quote", { method: "POST", body: fd });
        } catch {
          /* the dashboard has it */
        }
      }

      notifyCreditsChanged();
      onCreated(project, notified);
      onOpenChange(false);
      reset();
    } catch (e) {
      setError(String((e as { message?: string })?.message ?? "").includes("insufficient_credits") ? s.insufficient : s.error);
    } finally {
      setSubmitting(false);
    }
  }

  const goNext = () => {
    if (!canProceed) return;
    if (isLast) void submit();
    else setStepIndex((i) => i + 1);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn("fixed inset-0 bg-black/75 backdrop-blur-md duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", MODAL_BACKDROP_Z)}
        />
        <DialogPrimitive.Popup
          data-lenis-prevent
          className={cn(
            "fixed inset-0 m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(160deg,#1b1c21_0%,#101114_70%)] text-white shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95)] outline-none duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-6 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            MODAL_CONTENT_Z
          )}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-[linear-gradient(90deg,transparent,#ff8a1f_25%,#ffd2a1_50%,#ff8a1f_75%,transparent)]" />

          {/* Header: title, step, progress. */}
          <div className="shrink-0 border-b border-white/10 px-5 pt-5 pb-4 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogPrimitive.Title className="font-heading text-[clamp(20px,2.2vw,28px)] leading-[1.05] font-black uppercase">
                  {s.title1} <span className="text-section-accent">{s.title2}</span>
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1.5 text-sm text-white/55">
                  {q.stepOf.replace("{current}", String(stepIndex + 1)).replace("{total}", String(STEPS.length))} · {q.steps[step]}
                </DialogPrimitive.Description>
              </div>
              <div className="ml-auto mr-2 hidden shrink-0 rounded-full border border-white/12 px-3.5 py-1.5 text-xs text-white/60 sm:block">
                {s.available}: <span className={cn("font-semibold", short ? "text-red-300" : "text-white")}>{credits === null ? "…" : formatVideoTime(available)}</span>
              </div>
              <DialogPrimitive.Close
                aria-label={s.close}
                className={cn("flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/85 transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/70", MODAL_CONTROL_Z)}
              >
                <IconX className="size-4" aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={stepIndex + 1}>
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ff5e00,#ffb066)]"
                initial={false}
                animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          {/* The step. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goNext();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
              <motion.div key={step} variants={enter} initial="hidden" animate="visible">
                {step === "script" && <ScriptStep data={data} update={update} scriptFiles={scriptFiles} onScriptFiles={setScriptFiles} otherBytes={refBytes} />}
                {step === "goal" && <GoalStep data={data} update={update} />}
                {step === "video" && <VideoStep data={data} update={update} refFiles={refFiles} onRefFiles={setRefFiles} otherBytes={scriptBytes} />}
                {step === "details" && (
                  <>
                    <DetailsStep data={data} update={update} />
                    <div className="mt-6 max-w-md">
                      <label htmlFor="project-name" className="mb-2.5 block text-sm font-semibold">
                        {s.nameLabel}
                      </label>
                      <Input id="project-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={s.namePlaceholder} className="border-border/40 bg-card-elevated" />
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            {/* Footer: Back / Next (Submit on the last step). */}
            <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-8">
              {step === "video" || step === "details" ? (
                <p className={cn("mb-3 text-sm", short ? "text-red-300" : "text-white/60")}>
                  {short ? (
                    <>
                      {s.notEnough.replace("{needed}", formatVideoTime(needed)).replace("{available}", formatVideoTime(available))}{" "}
                      <Link href={pricingPath(language)} className="font-semibold text-[#ffb066] underline underline-offset-2 hover:text-white">
                        {s.buyPack}
                      </Link>
                    </>
                  ) : (
                    s.cost.replace("{needed}", formatVideoTime(needed)).replace("{available}", formatVideoTime(available))
                  )}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <IconAlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {error}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => (stepIndex === 0 ? onOpenChange(false) : setStepIndex((i) => i - 1))}
                  disabled={submitting}
                  className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/85 transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IconChevronLeft className="size-4" aria-hidden />
                  {q.back}
                </button>
                <button
                  type="submit"
                  disabled={!canProceed || submitting}
                  className="group inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,1)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
                >
                  {isLast ? (submitting ? q.sending : s.submit) : q.next}
                  {submitting ? (
                    <IconLoader2 className="size-4 animate-spin" aria-hidden />
                  ) : isLast ? (
                    <IconSend className="size-4" aria-hidden />
                  ) : (
                    <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
