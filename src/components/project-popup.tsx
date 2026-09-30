"use client";

import { useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  IconArrowUpRight,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconDownload,
  IconFileDescription,
  IconMessageCircle,
  IconMovie,
  IconRuler2,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import { StatusChip } from "@/components/project-status-chip";
import { ProjectComments, type ProjectComment } from "@/components/project-comments";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z } from "@/lib/modal-layer";
import { progressOf, projectFilm, projectPoster, timelineFor, type ClientProject, type ProjectStatus } from "@/lib/client-projects";
import { SAMPLE_COMMENTS } from "@/lib/client-projects-sample";
import { cn } from "@/lib/utils";

const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";
type Tab = "overview" | "timeline" | "files" | "comments";

function SideTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{children}</h3>;
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <span className="mt-0.5 shrink-0 text-[#ffb066]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-white/45">{label}</p>
        <p className="text-sm font-semibold break-words">{value}</p>
      </div>
    </div>
  );
}

/**
 * A project, full screen: a left sidebar with what matters most - the status and progress, the key facts (due date,
 * length, format), what the client told us when ordering, the revisions (a dot for each one, used or left, and the
 * history) and the producer - and beside it the tabs: Overview first (the film large, where we are and what happens next,
 * the stages at a glance), then the full Timeline and the Files to download. On a phone the sidebar stacks above.
 */
export function ProjectPopup({ project, statusLabels, sample = false, seedComments = [] }: { project: ClientProject; statusLabels: Record<ProjectStatus, string>; sample?: boolean; seedComments?: ProjectComment[] }) {
  const { t } = useLanguage();
  const p = t.account.projectsPage;
  const [tab, setTab] = useState<Tab>("overview");
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [prefill, setPrefill] = useState("");
  /** Opens the comments tab, optionally with a starting text (a revision request). */
  const goComments = (text = "") => {
    setPrefill(text);
    setTab("comments");
  };
  const film = projectFilm(project);
  const poster = projectPoster(project);
  const steps = timelineFor(project, statusLabels);
  const current = steps.find((s) => s.current) ?? steps[steps.length - 1];
  const left = Math.max(0, project.revisionsTotal - project.revisionsUsed);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: p.tabs.overview },
    { key: "timeline", label: p.tabs.timeline },
    { key: "files", label: `${p.tabs.files}${project.files.length ? ` (${project.files.length})` : ""}` },
    { key: "comments", label: `${p.tabs.comments}${commentCount ? ` (${commentCount})` : ""}` },
  ];

  return (
    <>
      <DialogPrimitive.Close
        aria-label={p.close}
        className={cn(
          "absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/85 backdrop-blur-md transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/80",
          MODAL_CONTROL_Z
        )}
      >
        <IconX className="size-[18px]" aria-hidden />
      </DialogPrimitive.Close>

      {/* The sidebar: the most important things. */}
      <aside className="flex shrink-0 flex-col gap-6 overflow-y-auto border-b border-white/10 bg-[linear-gradient(180deg,#17181c,#101114)] p-6 lg:w-[23rem] lg:border-r lg:border-b-0 xl:w-[26rem] xl:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 pr-12 lg:pr-0">
            <StatusChip status={project.status} label={statusLabels[project.status]} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{project.kind}</span>
          </div>
          <DialogPrimitive.Title className="mt-3 font-heading text-[clamp(22px,2.2vw,30px)] leading-[1.02] font-black uppercase text-[#ff8a1f]">
            {project.title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{p.panelDescription}</DialogPrimitive.Description>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", PEARL_BAR)} style={{ width: `${progressOf(project)}%` }} />
            </div>
            <span className="text-xs font-semibold text-white/60">{progressOf(project)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Fact icon={<IconCalendarEvent className="size-[18px]" aria-hidden />} label={p.due} value={project.dueDate ? formatDateDisplay(project.dueDate.slice(0, 10)) : p.tbd} />
          <Fact icon={<IconClock className="size-[18px]" aria-hidden />} label={p.length} value={project.durationSeconds ? formatVideoTime(project.durationSeconds) : p.tbd} />
          <Fact icon={<IconRuler2 className="size-[18px]" aria-hidden />} label={p.format} value={project.format ?? p.tbd} />
          <Fact icon={<IconMovie className="size-[18px]" aria-hidden />} label={p.started} value={project.createdAt ? formatDateDisplay(project.createdAt.slice(0, 10)) : p.tbd} />
        </div>

        {/* What the client filled in when ordering. */}
        {project.briefAnswers.length > 0 || project.brief ? (
          <section>
            <SideTitle>{p.askedFor}</SideTitle>
            {project.brief ? <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-white/70">{project.brief}</p> : null}
            {project.briefAnswers.length > 0 ? (
              <dl className="mt-3 divide-y divide-white/8 rounded-xl border border-white/8 bg-white/[0.02]">
                {project.briefAnswers.map((a) => (
                  <div key={a.label} className="flex items-start justify-between gap-4 px-3.5 py-2.5 text-sm">
                    <dt className="shrink-0 text-white/45">{a.label}</dt>
                    <dd className="text-right font-medium text-white/85">{a.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ) : null}

        {/* Revisions: a dot for each, filled when used, and what was asked. */}
        <section>
          <div className="flex items-center justify-between">
            <SideTitle>{p.revisionsTitle}</SideTitle>
            <span className="text-xs font-semibold text-white/60">
              {left} {p.left}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2" aria-label={`${project.revisionsUsed} / ${project.revisionsTotal}`}>
            {Array.from({ length: Math.max(project.revisionsTotal, project.revisionsUsed) }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[11px] font-bold",
                  i < project.revisionsUsed ? "border-transparent bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "border-white/25 text-white/40"
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <ul className="mt-3 flex flex-col gap-1.5">
            {project.revisionHistory.length === 0 ? (
              <li className="text-sm text-white/45">{p.noRevisions}</li>
            ) : (
              project.revisionHistory.map((r, i) => (
                <li key={`${r.title}-${i}`} className="flex items-start gap-2 text-sm text-white/75">
                  <IconCheck className={cn("mt-0.5 size-4 shrink-0", r.done ? "text-[#ff8a1f]" : "text-white/30")} stroke={2.5} aria-hidden />
                  <span>
                    {r.title}
                    {r.date ? <span className="text-white/40"> · {formatDateDisplay(r.date.slice(0, 10))}</span> : null}
                  </span>
                </li>
              ))
            )}
          </ul>
          {left > 0 && project.status !== "brief" && project.status !== "scripting" ? (
            <button
              type="button"
              onClick={() => goComments(p.comments.revisionPrefill)}
              className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-[#ff8a1f]/55 text-sm font-semibold text-[#ffb066] transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#ff7a1a]/10"
            >
              {p.requestRevision}
            </button>
          ) : null}
        </section>

        {/* The producer. */}
        <section className="mt-auto">
          <SideTitle>{p.producer}</SideTitle>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <IconUserCircle className="size-9 shrink-0 text-[#ffb066]" stroke={1.4} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{project.managerName ?? p.teamName}</p>
              <p className="text-xs text-white/45">{p.producerLine}</p>
            </div>
            <button type="button" onClick={() => goComments()} aria-label={p.messageUs} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/80 transition-[transform,background-color,color] duration-200 hover:scale-105 hover:bg-white/10 hover:text-white">
              <IconMessageCircle className="size-[18px]" aria-hidden />
            </button>
          </div>
        </section>
      </aside>

      {/* The main area: tabs, the overview first. */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center gap-1.5 border-b border-white/10 bg-[#101114]/90 px-6 py-3 pr-16 backdrop-blur-md xl:px-10" role="tablist">
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color] duration-200 ease-out",
                tab === x.key ? "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "text-white/55 hover:bg-white/8 hover:text-white"
              )}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div className="p-6 xl:p-10">
          {tab === "overview" ? (
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(90%_90%_at_50%_100%,rgba(255,110,20,0.22),transparent_65%),#0d0e10] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95)]">
                {film ? (
                  <video src={film} poster={poster ?? undefined} controls playsInline preload="metadata" className="absolute inset-0 size-full bg-black object-cover" />
                ) : (
                  <>
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element -- client poster, tiny, never optimised
                      <img src={poster} alt="" className="absolute inset-0 size-full object-cover opacity-70" />
                    ) : null}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
                      <IconMovie className="size-10 text-white/35" stroke={1.4} aria-hidden />
                      <p className="max-w-[34ch] text-sm text-white/55">{p.notReady}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <SideTitle>{p.whereWeAre}</SideTitle>
                  <p className="mt-2 font-heading text-lg font-black uppercase">{current?.title}</p>
                  {current?.note ? <p className="mt-1.5 text-sm leading-relaxed text-white/60">{current.note}</p> : null}
                </div>
                <div className="rounded-2xl border border-[#ff8a1f]/30 bg-[#ff7a1a]/[0.06] p-5">
                  <SideTitle>{p.nextStep}</SideTitle>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{project.nextStep ?? p.nextStepDefault}</p>
                </div>
              </div>

              {/* The stages at a glance. */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <SideTitle>{p.tabs.timeline}</SideTitle>
                <ol className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-0">
                  {steps.map((step, i) => (
                    <li key={`${step.title}-${i}`} className="relative flex flex-1 items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                      {i < steps.length - 1 ? (
                        <span aria-hidden className={cn("absolute top-[13px] left-[27px] hidden h-px w-[calc(100%-27px)] sm:block", step.done ? "bg-[#ff8a1f]/60" : "bg-white/12")} />
                      ) : null}
                      <span
                        className={cn(
                          "relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full border",
                          step.done
                            ? "border-transparent bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white"
                            : step.current
                              ? "border-[#ff8a1f] bg-[#ff8a1f]/15 shadow-[0_0_14px_rgba(255,138,31,0.55)]"
                              : "border-white/20 bg-[#141518]"
                        )}
                      >
                        {step.done ? <IconCheck className="size-3.5" stroke={3} aria-hidden /> : step.current ? <span className="size-2 animate-pulse rounded-full bg-[#ff8a1f]" aria-hidden /> : null}
                      </span>
                      <span className={cn("pr-2 text-xs font-semibold", step.done || step.current ? "text-white" : "text-white/40")}>{step.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}

          {tab === "timeline" ? (
            <ol className="mx-auto max-w-2xl">
              {steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
                  {index < steps.length - 1 ? <span aria-hidden className={cn("absolute top-7 bottom-0 left-[13px] w-px", step.done ? "bg-[#ff8a1f]/60" : "bg-white/12")} /> : null}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex size-[27px] shrink-0 items-center justify-center rounded-full border",
                      step.done
                        ? "border-transparent bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white"
                        : step.current
                          ? "border-[#ff8a1f] bg-[#ff8a1f]/15 shadow-[0_0_14px_rgba(255,138,31,0.55)]"
                          : "border-white/20 bg-[#141518]"
                    )}
                  >
                    {step.done ? <IconCheck className="size-3.5" stroke={3} aria-hidden /> : step.current ? <span className="size-2 animate-pulse rounded-full bg-[#ff8a1f]" aria-hidden /> : null}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className={cn("text-base font-semibold", step.done || step.current ? "text-white" : "text-white/45")}>{step.title}</p>
                    {step.date ? <p className="mt-0.5 text-xs text-white/45">{formatDateDisplay(step.date.slice(0, 10))}</p> : null}
                    {step.note ? <p className="mt-1.5 text-sm leading-relaxed text-white/60">{step.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          {tab === "comments" ? (
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-1 font-heading text-lg font-black uppercase">{p.tabs.comments}</h2>
              <p className="mb-5 text-sm text-white/50">{p.comments.intro}</p>
              <ProjectComments projectId={project.id} sample={sample} prefill={prefill} seed={seedComments} onCount={setCommentCount} />
            </div>
          ) : null}

          {tab === "files" ? (
            <div className="mx-auto max-w-2xl">
              {project.files.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
                  <IconFileDescription className="size-9 text-white/30" stroke={1.4} aria-hidden />
                  <p className="max-w-[40ch] text-sm text-white/55">{p.noFiles}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {project.files.map((f) => (
                    <li key={f.name}>
                      <a
                        href={f.url}
                        download
                        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]"
                      >
                        <IconFileDescription className="size-6 shrink-0 text-[#ffb066]" stroke={1.5} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{f.name}</span>
                          {f.size ? <span className="text-xs text-white/45">{f.size}</span> : null}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#ff8a1f]">
                          <IconDownload className="size-[18px]" aria-hidden />
                          {p.download}
                          <IconArrowUpRight className="size-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

/** The popup's frame: fills the screen, sidebar left, main right (stacked and scrolling as one on a phone). */
export function ProjectPopupFrame({ project, statusLabels, onClose, sample = false }: { project: ClientProject | null; statusLabels: Record<ProjectStatus, string>; onClose: () => void; sample?: boolean }) {
  return (
    <DialogPrimitive.Root open={project !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn("fixed inset-0 bg-black/80 backdrop-blur-md duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", MODAL_BACKDROP_Z)}
        />
        <DialogPrimitive.Popup
          data-lenis-prevent
          className={cn(
            "fixed inset-0 flex flex-col overflow-y-auto bg-[#0c0d10] text-white outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98] lg:flex-row lg:overflow-hidden",
            MODAL_CONTENT_Z
          )}
        >
          {project ? <ProjectPopup key={project.id} project={project} statusLabels={statusLabels} sample={sample} seedComments={SAMPLE_COMMENTS[project.id] ?? []} /> : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
