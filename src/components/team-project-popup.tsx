"use client";

import { useEffect, useState } from "react";
import { notifyProject } from "@/lib/notify-project";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  IconCalendarFilled,
  IconCheck,
  IconCircleCheckFilled,
  IconClockFilled,
  IconDownload,
  IconFileDescription,
  IconFileFilled,
  IconLoader2,
  IconMailFilled,
  IconMessageFilled,
  IconVideoFilled,
  IconX,
} from "@tabler/icons-react";
import { StatusChip } from "@/components/project-status-chip";
import { Fact, PEARL_BAR, PEARL_DISC, SectionHead, SideTitle, StepDot, TimelineView } from "@/components/project-ui";
import { FormatIcon } from "@/components/format-icon";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { ProjectComments } from "@/components/project-comments";
import { SAMPLE_COMMENTS } from "@/lib/client-projects-sample";
import { summarizeLedger, type LedgerEntry } from "@/lib/credits";
import { formatVideoTime as fmtTime } from "@/lib/account-info";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z } from "@/lib/modal-layer";
import { formatBytes, isApproved, progressOf, projectFromRow, PROJECT_STATUSES, statusLabelOf, timelineFor, type BriefFile, type ClientProject, type ProjectStatus, type RevisionEntry, type TimelineStep } from "@/lib/client-projects";
import { createClient } from "@/lib/supabase/client";
import { TeamDeliveryPanel } from "@/components/team-delivery-panel";
import { TeamProjectRequests } from "@/components/team-project-requests";
import { TeamCreditAdjuster } from "@/components/team-credit-adjuster";
import { RevisionLogEditor, TimelineEditor } from "@/components/team-project-editors";
import { cn } from "@/lib/utils";

/** The timeline / revision list as stored in Supabase (blank rows dropped). */
const timelineRows = (steps: TimelineStep[] | null) => (steps ?? []).filter((s) => s.title.trim()).map((s) => ({ ...s, title: s.title.trim() }));
const revisionRows = (list: RevisionEntry[]) => list.filter((r) => r.title.trim()).map((r) => ({ ...r, title: r.title.trim() }));

/** The drawer's quick buttons (email the client, jump to the comments / the delivery). */
const DRAWER_ACTION =
  "group inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.03] px-2 text-sm font-semibold text-white/85 transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]";

/**
 * One project, full screen, for the team - laid out like the client's own project page (`project-detail-view.tsx`, the
 * same drawer + content and the same parts from `project-ui.tsx`), so both sides read the same:
 * - **the drawer** (left, sticky): the status and progress, the **stage** as five big rows - the current one lit, one click
 *   to change it (locked once the client approved) -, the key facts, the client with Email / Comments / Delivery buttons,
 *   the details the team sets (producer, due date, revisions used), the brief, and **Save** pinned at its foot with
 *   whether anything is unsaved;
 * - **the content**, in the client page's order: the timeline (as the client will see it, with its editor under it), the
 *   next step, the film and the delivery files (uploaded straight to private Storage - `TeamDeliveryPanel`, saved as they
 *   upload), the comments, the client's files (opened through short-lived links), change requests and the revision log,
 *   and the client's video time.
 * Saving writes to Supabase, so the client sees the change on their project at once (a new stage emails them).
 */
export function TeamProjectPopup({
  project,
  sample,
  statusLabels,
  onClose,
  onSaved,
  focus = null,
}: {
  project: ClientProject | null;
  sample: boolean;
  statusLabels: Record<ProjectStatus, string>;
  onClose: () => void;
  onSaved: (project: ClientProject) => void;
  /** `comments`: opened to reply (the dashboard's Reply buttons) - the reply box takes the cursor, scrolled into view. */
  focus?: "comments" | null;
}) {
  const projectId = project?.id;
  useEffect(() => {
    if (!projectId || focus !== "comments") return;
    // After the window's own opening animation (and its first focus), so the reply box keeps the cursor.
    const timer = window.setTimeout(() => document.getElementById(`comment-${projectId}`)?.focus(), 450);
    return () => window.clearTimeout(timer);
  }, [projectId, focus]);

  return (
    <DialogPrimitive.Root open={project !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={cn("fixed inset-0 bg-black/80 backdrop-blur-md duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", MODAL_BACKDROP_Z)} />
        <DialogPrimitive.Popup
          data-lenis-prevent
          className={cn(
            "fixed inset-0 overflow-y-auto overscroll-contain bg-[#0c0d10] text-white outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98]",
            MODAL_CONTENT_Z
          )}
        >
          {project ? <Body key={project.id} project={project} sample={sample} statusLabels={statusLabels} onSaved={onSaved} /> : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Body({ project, sample, statusLabels, onSaved }: { project: ClientProject; sample: boolean; statusLabels: Record<ProjectStatus, string>; onSaved: (p: ClientProject) => void }) {
  const { t } = useLanguage();
  const d = t.team;
  const p = t.account.projectsPage;

  const [status, setStatus] = useState<ProjectStatus>(project.status);
  // An approved film closes the project: its stage stays Delivered (the database refuses anything else too).
  const locked = isApproved(project);
  const [nextStep, setNextStep] = useState(project.nextStep ?? "");
  const [manager, setManager] = useState(project.managerName ?? "");
  const [due, setDue] = useState(project.dueDate?.slice(0, 10) ?? "");
  const [revisions, setRevisions] = useState(String(project.revisionsUsed));
  const [timeline, setTimeline] = useState<TimelineStep[] | null>(project.timeline);
  const [revisionLog, setRevisionLog] = useState<RevisionEntry[]>(project.revisionHistory);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  // The client's video seconds (the team reads every ledger) and a way to add or take back seconds by hand.
  const [balance, setBalance] = useState<number | null>(sample ? 60 : null);
  useEffect(() => {
    if (sample || !project.userId) return;
    let alive = true;
    void createClient()
      .from("credit_ledger")
      .select("seconds, kind, plan_key, created_at")
      .eq("user_id", project.userId)
      .then(({ data }) => {
        if (alive) setBalance(data ? summarizeLedger(data as LedgerEntry[]).balance : 0);
      });
    return () => {
      alive = false;
    };
  }, [sample, project.userId]);

  /** An approved change request changed the project in the database: read it again (and the date field with it). */
  async function reload() {
    const { data } = await createClient().from("projects").select("*").eq("id", project.id).maybeSingle();
    if (!data) return;
    const next = { ...project, ...projectFromRow(data as Record<string, unknown>), commentCount: project.commentCount, awaitingReply: project.awaitingReply };
    setDue(next.dueDate?.slice(0, 10) ?? "");
    onSaved(next);
  }

  const dirty =
    status !== project.status ||
    nextStep !== (project.nextStep ?? "") ||
    manager !== (project.managerName ?? "") ||
    due !== (project.dueDate?.slice(0, 10) ?? "") ||
    revisions !== String(project.revisionsUsed) ||
    JSON.stringify(timelineRows(timeline)) !== JSON.stringify(timelineRows(project.timeline)) ||
    JSON.stringify(revisionRows(revisionLog)) !== JSON.stringify(revisionRows(project.revisionHistory));

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setMessage(null);
    const patch = {
      status,
      next_step: nextStep.trim() || null,
      manager_name: manager.trim() || null,
      due_date: due || null,
      revisions_used: Math.max(0, Number.parseInt(revisions, 10) || 0),
      timeline: timelineRows(timeline),
      revisions: revisionRows(revisionLog),
      updated_at: new Date().toISOString(),
    };
    if (!sample) {
      const { error } = await createClient().from("projects").update(patch).eq("id", project.id);
      if (error) {
        setMessage(d.saveError);
        setSaving(false);
        return;
      }
      // A new stage: the client gets the email for it (ready for review carries Approve / Request a revision).
      if (status !== project.status) notifyProject(project.id, "status");
    }
    onSaved({
      ...project,
      status,
      nextStep: patch.next_step,
      managerName: patch.manager_name,
      dueDate: patch.due_date,
      revisionsUsed: patch.revisions_used,
      timeline: patch.timeline.length > 0 ? patch.timeline : null,
      revisionHistory: patch.revisions,
    });
    setTimeline(patch.timeline.length > 0 ? patch.timeline : null);
    setRevisionLog(patch.revisions);
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  async function openFile(file: BriefFile) {
    if (sample) {
      setMessage(d.sampleFile);
      return;
    }
    setOpening(file.path);
    setMessage(null);
    const { data, error } = await createClient().storage.from("project-files").createSignedUrl(file.path, 120, { download: file.name });
    setOpening(null);
    if (error || !data?.signedUrl) {
      setMessage(d.fileError);
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = file.name;
    a.rel = "noopener";
    a.click();
  }

  const field = "h-11 border-white/12 bg-black/30 text-base";
  const label = "mb-2 block text-[15px] font-semibold";
  // The timeline as the client will see it once saved - the stage and the custom steps being edited.
  const steps = timelineFor({ ...project, status, timeline }, statusLabels);
  const progress = progressOf({ ...project, status });
  const left = Math.max(0, project.revisionsTotal - project.revisionsUsed);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <DialogPrimitive.Close aria-label={p.close} className={cn("fixed top-4 right-4 flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/85 backdrop-blur-md transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/80", MODAL_CONTROL_Z)}>
        <IconX className="size-5" aria-hidden />
      </DialogPrimitive.Close>

      <div className="mx-auto w-full px-[max(1.25rem,2.5vw)] pt-6 pb-16 lg:pt-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* The drawer, as on the client's page: the status and the stage control first, the facts, the client, the
              details we set, the brief and the revisions - and Save at its foot, always in reach. */}
          <aside className="flex shrink-0 flex-col gap-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#17181c,#101114)] p-6 lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:w-[28rem] lg:overflow-y-auto lg:overscroll-contain xl:w-[30rem] xl:p-7">
            <div className="pr-12 lg:pr-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusChip status={status} label={statusLabelOf({ ...project, status }, statusLabels)} approved={isApproved(project)} />
                <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white/50">{project.kind}</span>
              </div>
              <DialogPrimitive.Title className="mt-3 font-heading text-[clamp(24px,2.4vw,34px)] leading-[1.02] font-black uppercase text-[#ff8a1f]">{project.title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">{d.popupDescription}</DialogPrimitive.Description>
              {project.approvedAt ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                  <IconCircleCheckFilled className="size-4" aria-hidden />
                  {d.approved.replace("{date}", formatDateDisplay(project.approvedAt.slice(0, 10)))}
                </p>
              ) : null}
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={cn("h-full rounded-full transition-[width] duration-500", PEARL_BAR)} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-sm font-semibold text-white/70">{progress}%</span>
              </div>
            </div>

            {/* The stage - big, clear, one click to change it. */}
            <section>
              <SideTitle>{d.stage}</SideTitle>
              <p className="mt-1 text-sm text-white/50">{d.stageHint}</p>
              {locked ? (
                <p role="note" className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
                  {d.approvedLocked.replace("{date}", formatDateDisplay(project.approvedAt!.slice(0, 10)))}
                </p>
              ) : null}
              <div className="mt-3 flex flex-col gap-1.5" role="radiogroup" aria-label={d.stage}>
                {PROJECT_STATUSES.map((s, i) => {
                  const on = status === s;
                  const done = PROJECT_STATUSES.indexOf(status) > i;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={locked && !on}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "group flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:translate-x-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0",
                        on
                          ? "border-[#ff8a1f]/70 bg-[#ff7a1a]/14 shadow-[0_10px_30px_-14px_rgba(255,106,20,0.8)]"
                          : "border-white/8 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]",
                      )}
                    >
                      <StepDot done={done} current={on} />
                      <span className={cn("flex-1 text-base font-semibold", on ? "text-white" : done ? "text-white/80" : "text-white/55")}>{statusLabels[s]}</span>
                      {on ? <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white", PEARL_DISC)}>{d.currentStage}</span> : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-2.5">
              <Fact icon={<IconCalendarFilled className="size-6" aria-hidden />} label={p.due} value={due ? formatDateDisplay(due) : p.tbd} />
              <Fact icon={<IconClockFilled className="size-6" aria-hidden />} label={p.length} value={project.durationSeconds ? formatVideoTime(project.durationSeconds) : p.tbd} />
              <Fact icon={<FormatIcon format={project.format} className="size-6" />} label={p.format} value={project.format ?? p.tbd} />
              <Fact
                icon={<IconCircleCheckFilled className="size-6" aria-hidden />}
                label={p.revisionsLeft}
                value={p.revisionsLeftValue.replace("{left}", String(left)).replace("{total}", String(project.revisionsTotal))}
              />
            </div>

            {/* The client, and the ways to reach them. */}
            <section>
              <SideTitle>{d.client}</SideTitle>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                <InitialsAvatar name={project.clientName ?? project.clientEmail} className="size-11 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{project.clientName ?? d.unknownClient}</p>
                  {project.clientEmail ? <p className="truncate text-sm text-white/50">{project.clientEmail}</p> : null}
                  <p className="text-sm text-white/40">
                    {d.submitted} {project.createdAt ? formatDateDisplay(project.createdAt.slice(0, 10)) : p.tbd}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {project.clientEmail ? (
                  <a href={`mailto:${project.clientEmail}?subject=${encodeURIComponent(project.title)}`} className={DRAWER_ACTION}>
                    <IconMailFilled className="size-[18px] text-[#ff8a1f]" aria-hidden />
                    {d.emailClient.split(" ")[0]}
                  </a>
                ) : (
                  <span />
                )}
                <button type="button" onClick={() => jump(`team-comments-${project.id}`)} className={DRAWER_ACTION}>
                  <IconMessageFilled className="size-[18px] text-[#ff8a1f]" aria-hidden />
                  {d.jumpComments}
                </button>
                <button type="button" onClick={() => jump(`team-delivery-${project.id}`)} className={DRAWER_ACTION}>
                  <IconVideoFilled className="size-[18px] text-[#ff8a1f]" aria-hidden />
                  {d.jumpDelivery}
                </button>
              </div>
            </section>

            {/* What the team sets: producer, due date, revisions used. */}
            <section>
              <SideTitle>{d.detailsTitle}</SideTitle>
              <div className="mt-3 grid gap-4">
                <div>
                  <label htmlFor="team-manager" className={label}>{d.producer}</label>
                  <Input id="team-manager" value={manager} onChange={(e) => setManager(e.target.value)} className={field} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="team-due" className={label}>{p.due}</label>
                    <Input id="team-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
                  </div>
                  <div>
                    <label htmlFor="team-revisions" className={label}>
                      {d.revisionsUsed} <span className="font-normal text-white/45">/ {project.revisionsTotal}</span>
                    </label>
                    <Input id="team-revisions" type="number" min={0} value={revisions} onChange={(e) => setRevisions(e.target.value)} className={field} />
                  </div>
                </div>
              </div>
            </section>

            {project.brief || project.briefAnswers.length > 0 ? (
              <section>
                <SideTitle>{d.brief}</SideTitle>
                {project.brief ? <p className="mt-2.5 text-[15px] leading-relaxed whitespace-pre-line text-white/80">{project.brief}</p> : null}
                {project.briefAnswers.length > 0 ? (
                  <dl className="mt-3 divide-y divide-white/8 rounded-xl border border-white/8 bg-white/[0.02]">
                    {project.briefAnswers.map((a) => (
                      <div key={a.label} className="flex items-start justify-between gap-4 px-3.5 py-2.5 text-[15px]">
                        <dt className="shrink-0 text-white/50">{a.label}</dt>
                        <dd className="text-right font-medium break-words text-white/85">{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </section>
            ) : null}

            {/* Save - pinned to the drawer's foot while it scrolls, with whether anything is waiting to be saved. */}
            <div className="sticky -bottom-6 -mx-6 mt-auto border-t border-white/10 bg-[#111215]/95 px-6 pt-4 pb-6 backdrop-blur xl:-bottom-7 xl:-mx-7 xl:px-7 xl:pb-7">
              <p className={cn("mb-3 flex items-center gap-2 text-sm font-semibold", dirty ? "text-[#ffb066]" : saved ? "text-emerald-300" : "text-white/40")}>
                {dirty ? <span className="size-2 rounded-full bg-[#ff8a1f] shadow-[0_0_10px_#ff8a1f]" /> : <IconCheck className="size-4" stroke={3} aria-hidden />}
                {dirty ? d.unsaved : d.allSaved}
              </p>
              <button
                type="button"
                onClick={() => void save()}
                disabled={!dirty || saving}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-base font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {saving ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : null}
                {d.save}
              </button>
              {message ? (
                <p role="status" className="mt-3 text-sm text-[#ffb066]">
                  {message}
                </p>
              ) : null}
            </div>
          </aside>

          {/* The content, in the client page's order - laid out by its own width. */}
          <div className="@container min-w-0 flex-1">
            <div className="flex flex-col gap-10">
              <section aria-labelledby={`team-timeline-${project.id}`}>
                <SectionHead id={`team-timeline-${project.id}`} title={p.tabs.timeline} icon={<IconCalendarFilled className="size-[18px]" aria-hidden />} />
                <TimelineView steps={steps} />
                <details className="group/edit mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 open:bg-white/[0.03]">
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-[#ffb066] transition-colors hover:text-[#ff8a1f]">{d.editTimeline}</summary>
                  <div className="mt-4">
                    <TimelineEditor value={timeline} standard={timelineFor({ ...project, status, timeline: null }, statusLabels)} onChange={setTimeline} />
                  </div>
                </details>
              </section>

              {/* What happens next - the client sees this on their project. */}
              <div className="rounded-2xl border border-[#ff8a1f]/30 bg-[#ff7a1a]/[0.06] p-5">
                <label htmlFor="team-next">
                  <SideTitle>{d.nextStep}</SideTitle>
                </label>
                <textarea
                  id="team-next"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  rows={3}
                  placeholder={d.nextStepHint}
                  className="mt-3 w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-base text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/30 focus:border-[#ff8a1f]/70 focus:shadow-[0_0_0_3px_rgba(255,138,31,0.15)]"
                />
              </div>

              <section id={`team-delivery-${project.id}`} aria-labelledby={`team-film-${project.id}`} className="scroll-mt-6">
                <SectionHead id={`team-film-${project.id}`} title={d.delivery.title} icon={<IconVideoFilled className="size-[18px]" aria-hidden />} />
                <p className="-mt-2 mb-4 text-[15px] text-white/55">{d.delivery.hint}</p>
                <TeamDeliveryPanel project={project} sample={sample} onChange={(patch) => onSaved({ ...project, ...patch })} />
              </section>

              <section id={`team-comments-${project.id}`} aria-labelledby={`team-comments-head-${project.id}`} className="scroll-mt-6">
                <SectionHead id={`team-comments-head-${project.id}`} title={d.commentsTitle} icon={<IconMessageFilled className="size-[18px]" aria-hidden />} />
                <p className="-mt-2 mb-5 text-[15px] text-white/55">{d.commentsHint}</p>
                <ProjectComments projectId={project.id} sample={sample} asTeam seed={SAMPLE_COMMENTS[project.id] ?? []} />
              </section>

              <section aria-labelledby={`team-files-${project.id}`}>
                <SectionHead id={`team-files-${project.id}`} title={d.filesTitle} count={project.briefFiles.length} icon={<IconFileFilled className="size-[18px]" aria-hidden />} />
                <p className="-mt-2 mb-4 text-[15px] text-white/55">{d.filesHint}</p>
                {project.briefFiles.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-[15px] text-white/55">
                    <IconFileDescription className="size-7 shrink-0 text-white/25" stroke={1.4} aria-hidden />
                    {d.noFiles}
                  </div>
                ) : (
                  <ul className="grid gap-2.5 @2xl:grid-cols-2 @5xl:grid-cols-3">
                    {project.briefFiles.map((f) => (
                      <li key={f.path}>
                        <button
                          type="button"
                          onClick={() => void openFile(f)}
                          className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]"
                        >
                          <IconFileFilled className="size-6 shrink-0 text-[#ff8a1f]" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-semibold">{f.name}</span>
                            <span className="text-sm text-white/45">{formatBytes(f.size)}</span>
                          </span>
                          {opening === f.path ? <IconLoader2 className="size-[18px] animate-spin text-[#ff8a1f]" aria-hidden /> : <IconDownload className="size-[18px] text-[#ff8a1f] transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden />}
                          <span className="sr-only">{p.download}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* The client's change requests (approve applies them) and their rating, then the revision log. */}
              <TeamProjectRequests projectId={project.id} sample={sample} onApplied={() => void reload()} />

              <section aria-labelledby={`team-revisions-${project.id}`}>
                <SectionHead id={`team-revisions-${project.id}`} title={d.revisionLog.title} icon={<IconCircleCheckFilled className="size-[18px]" aria-hidden />} />
                <p className="-mt-2 mb-4 text-[15px] text-white/55">{d.revisionLog.hint}</p>
                <RevisionLogEditor value={revisionLog} onChange={setRevisionLog} />
              </section>

              <section aria-labelledby={`team-credits-${project.id}`}>
                <SectionHead id={`team-credits-${project.id}`} title={d.credits.title} icon={<IconClockFilled className="size-[18px]" aria-hidden />} />
                <p className="-mt-2 mb-4 text-[15px] text-white/55">{d.credits.hint}</p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[15px] text-white/60">
                    {d.credits.balance}: <span className="font-semibold text-white">{balance == null ? "…" : fmtTime(balance)}</span>
                  </p>
                  <div className="mt-4">
                    {project.userId ? (
                      <TeamCreditAdjuster userId={project.userId} projectId={project.id} sample={sample} onApplied={(secs) => setBalance((b) => (b ?? 0) + secs)} />
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
