"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { IconCheck, IconDownload, IconFileDescription, IconLoader2, IconMail, IconUser, IconX } from "@tabler/icons-react";
import { StatusChip } from "@/components/project-status-chip";
import { ProjectComments } from "@/components/project-comments";
import { SAMPLE_COMMENTS } from "@/lib/client-projects-sample";
import { summarizeLedger, type LedgerEntry } from "@/lib/credits";
import { formatVideoTime as fmtTime } from "@/lib/account-info";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z } from "@/lib/modal-layer";
import { formatBytes, isApproved, projectFromRow, PROJECT_STATUSES, statusLabelOf, timelineFor, type BriefFile, type ClientProject, type ProjectStatus, type RevisionEntry, type TimelineStep } from "@/lib/client-projects";
import { createClient } from "@/lib/supabase/client";
import { TeamDeliveryPanel } from "@/components/team-delivery-panel";
import { TeamProjectRequests } from "@/components/team-project-requests";
import { TeamCreditAdjuster } from "@/components/team-credit-adjuster";
import { RevisionLogEditor, TimelineEditor } from "@/components/team-project-editors";
import { cn } from "@/lib/utils";

/** The timeline / revision list as stored in Supabase (blank rows dropped). */
const timelineRows = (steps: TimelineStep[] | null) => (steps ?? []).filter((s) => s.title.trim()).map((s) => ({ ...s, title: s.title.trim() }));
const revisionRows = (list: RevisionEntry[]) => list.filter((r) => r.title.trim()).map((r) => ({ ...r, title: r.title.trim() }));

function SideTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{children}</h3>;
}

/**
 * One project, full screen, for the team: on the left everything the client gave us - who they are, the key facts, their
 * brief and answers - and on the right what we do with it: the files they attached (private, opened through short-lived
 * links), the delivery (the finished film and the files to download, uploaded to private Storage - `TeamDeliveryPanel`,
 * saved as they upload) and the controls to move it along (stage, next step, producer, due date, revisions used, the
 * timeline and the revision requests). Saving writes to Supabase, so the client sees the change in their Your Projects at once.
 */
export function TeamProjectPopup({
  project,
  sample,
  statusLabels,
  onClose,
  onSaved,
}: {
  project: ClientProject | null;
  sample: boolean;
  statusLabels: Record<ProjectStatus, string>;
  onClose: () => void;
  onSaved: (project: ClientProject) => void;
}) {
  return (
    <DialogPrimitive.Root open={project !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={cn("fixed inset-0 bg-black/80 backdrop-blur-md duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", MODAL_BACKDROP_Z)} />
        <DialogPrimitive.Popup
          data-lenis-prevent
          className={cn(
            "fixed inset-0 flex flex-col overflow-y-auto bg-[#0c0d10] text-white outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98] lg:flex-row lg:overflow-hidden",
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

  const field = "h-11 border-white/12 bg-black/30";
  const label = "mb-2 block text-sm font-semibold";

  return (
    <>
      <DialogPrimitive.Close aria-label={p.close} className={cn("absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/85 backdrop-blur-md transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/80", MODAL_CONTROL_Z)}>
        <IconX className="size-[18px]" aria-hidden />
      </DialogPrimitive.Close>

      {/* What the client gave us. */}
      <aside className="flex shrink-0 flex-col gap-6 overflow-y-auto border-b border-white/10 bg-[linear-gradient(180deg,#17181c,#101114)] p-6 lg:w-[24rem] lg:border-r lg:border-b-0 xl:w-[27rem] xl:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 pr-12 lg:pr-0">
            <StatusChip status={project.status} label={statusLabelOf(project, statusLabels)} approved={isApproved(project)} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{project.kind}</span>
          </div>
          <DialogPrimitive.Title className="mt-3 font-heading text-[clamp(22px,2.2vw,30px)] leading-[1.02] font-black uppercase text-[#ff8a1f]">{project.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{d.popupDescription}</DialogPrimitive.Description>
        </div>

        <section>
          <SideTitle>{d.client}</SideTitle>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
            <IconUser className="size-9 shrink-0 text-[#ffb066]" stroke={1.4} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{project.clientName ?? d.unknownClient}</p>
              {project.clientEmail ? <p className="truncate text-xs text-white/50">{project.clientEmail}</p> : null}
            </div>
            {project.clientEmail ? (
              <a href={`mailto:${project.clientEmail}?subject=${encodeURIComponent(project.title)}`} aria-label={d.emailClient} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/80 transition-[transform,background-color,color] duration-200 hover:scale-105 hover:bg-white/10 hover:text-white">
                <IconMail className="size-[18px]" aria-hidden />
              </a>
            ) : null}
          </div>
        </section>

        <dl className="grid grid-cols-2 gap-2.5 text-sm">
          {[
            [p.due, project.dueDate ? formatDateDisplay(project.dueDate.slice(0, 10)) : p.tbd],
            [p.length, project.durationSeconds ? formatVideoTime(project.durationSeconds) : p.tbd],
            [p.format, project.format ?? p.tbd],
            [d.submitted, project.createdAt ? formatDateDisplay(project.createdAt.slice(0, 10)) : p.tbd],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <dt className="text-xs text-white/45">{k}</dt>
              <dd className="mt-0.5 font-semibold break-words">{v}</dd>
            </div>
          ))}
        </dl>

        {project.brief || project.briefAnswers.length > 0 ? (
          <section>
            <SideTitle>{d.brief}</SideTitle>
            {project.brief ? <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-white/75">{project.brief}</p> : null}
            {project.briefAnswers.length > 0 ? (
              <dl className="mt-3 divide-y divide-white/8 rounded-xl border border-white/8 bg-white/[0.02]">
                {project.briefAnswers.map((a) => (
                  <div key={a.label} className="flex items-start justify-between gap-4 px-3.5 py-2.5 text-sm">
                    <dt className="shrink-0 text-white/45">{a.label}</dt>
                    <dd className="text-right font-medium break-words text-white/85">{a.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ) : null}

        {project.revisionHistory.length > 0 ? (
          <section>
            <SideTitle>{p.revisionsTitle}</SideTitle>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {project.revisionHistory.map((r, i) => (
                <li key={`${r.title}-${i}`} className="text-sm text-white/75">
                  {r.title}
                  {r.date ? <span className="text-white/40"> · {formatDateDisplay(r.date.slice(0, 10))}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </aside>

      {/* What we do with it. */}
      <section className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 pr-6 lg:p-8 xl:p-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div>
            <SideTitle>{d.filesTitle}</SideTitle>
            <p className="mt-1.5 text-sm text-white/50">{d.filesHint}</p>
            {project.briefFiles.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
                <IconFileDescription className="size-7 shrink-0 text-white/30" stroke={1.4} aria-hidden />
                {d.noFiles}
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2.5">
                {project.briefFiles.map((f) => (
                  <li key={f.path}>
                    <button
                      type="button"
                      onClick={() => void openFile(f)}
                      className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]"
                    >
                      <IconFileDescription className="size-6 shrink-0 text-[#ffb066]" stroke={1.5} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{f.name}</span>
                        <span className="text-xs text-white/45">{formatBytes(f.size)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#ff8a1f]">
                        {opening === f.path ? <IconLoader2 className="size-[18px] animate-spin" aria-hidden /> : <IconDownload className="size-[18px]" aria-hidden />}
                        {p.download}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {message ? (
              <p role="status" className="mt-3 text-sm text-[#ffb066]">
                {message}
              </p>
            ) : null}
          </div>

          <div>
            <SideTitle>{d.commentsTitle}</SideTitle>
            <p className="mt-1.5 mb-4 text-sm text-white/50">{d.commentsHint}</p>
            <ProjectComments projectId={project.id} sample={sample} asTeam seed={SAMPLE_COMMENTS[project.id] ?? []} />
          </div>

          <div>
            <SideTitle>{d.credits.title}</SideTitle>
            <p className="mt-1.5 text-sm text-white/50">{d.credits.hint}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-white/60">
                {d.credits.balance}: <span className="font-semibold text-white">{balance == null ? "…" : fmtTime(balance)}</span>
              </p>
              <div className="mt-4">
                {project.userId ? (
                  <TeamCreditAdjuster userId={project.userId} projectId={project.id} sample={sample} onApplied={(secs) => setBalance((b) => (b ?? 0) + secs)} />
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <SideTitle>{d.delivery.title}</SideTitle>
            <p className="mt-1.5 mb-4 text-sm text-white/50">{d.delivery.hint}</p>
            {project.approvedAt ? (
              <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                <IconCheck className="size-4" stroke={3} aria-hidden />
                {d.approved.replace("{date}", formatDateDisplay(project.approvedAt.slice(0, 10)))}
              </p>
            ) : null}
            <TeamDeliveryPanel project={project} sample={sample} onChange={(patch) => onSaved({ ...project, ...patch })} />
          </div>

          {/* The client's change requests (approve applies them) and their rating. */}
          <TeamProjectRequests projectId={project.id} sample={sample} onApplied={() => void reload()} />

          <div>
            <SideTitle>{d.manageTitle}</SideTitle>
            <p className="mt-1.5 text-sm text-white/50">{d.manageHint}</p>

            <p className={cn(label, "mt-5")}>{d.stage}</p>
            {locked ? (
              <p role="note" className="mb-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
                {d.approvedLocked.replace("{date}", formatDateDisplay(project.approvedAt!.slice(0, 10)))}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={d.stage}>
              {PROJECT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  disabled={locked && s !== status}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,color,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0",
                    status === s ? "border-transparent bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "border-white/15 text-white/65 hover:border-white/40 hover:text-white"
                  )}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label htmlFor="team-next" className={label}>{d.nextStep}</label>
              <textarea
                id="team-next"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                rows={3}
                placeholder={d.nextStepHint}
                className="w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/30 focus:border-[#ff8a1f]/70 focus:shadow-[0_0_0_3px_rgba(255,138,31,0.15)]"
              />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="team-manager" className={label}>{d.producer}</label>
                <Input id="team-manager" value={manager} onChange={(e) => setManager(e.target.value)} className={field} />
              </div>
              <div>
                <label htmlFor="team-due" className={label}>{p.due}</label>
                <Input id="team-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
              </div>
              <div>
                <label htmlFor="team-revisions" className={label}>{d.revisionsUsed} ({project.revisionsTotal} {d.included})</label>
                <Input id="team-revisions" type="number" min={0} value={revisions} onChange={(e) => setRevisions(e.target.value)} className={field} />
              </div>
            </div>

            <p className={cn(label, "mt-6")}>{d.timeline.title}</p>
            <TimelineEditor value={timeline} standard={timelineFor({ ...project, status, timeline: null }, statusLabels)} onChange={setTimeline} />

            <p className={cn(label, "mt-6")}>{d.revisionLog.title}</p>
            <p className="-mt-1 mb-3 text-sm text-white/50">{d.revisionLog.hint}</p>
            <RevisionLogEditor value={revisionLog} onChange={setRevisionLog} />

            <div className="mt-7 flex items-center gap-4">
              <button
                type="button"
                onClick={() => void save()}
                disabled={!dirty || saving}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {saving ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : null}
                {d.save}
              </button>
              {saved ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                  <IconCheck className="size-4" stroke={3} aria-hidden />
                  {d.saved}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
