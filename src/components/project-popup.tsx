"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconDownload,
  IconFileDescription,
  IconLoader2,
  IconMessageCircle,
  IconMovie,
  IconPlayerPlayFilled,
  IconRefresh,
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
import { DELIVERY_BUCKET, formatBytes, progressOf, projectFilm, projectPoster, timelineFor, type ClientProject, type ProjectFile, type ProjectStatus } from "@/lib/client-projects";
import { SAMPLE_COMMENTS } from "@/lib/client-projects-sample";
import { downloadPrivate, signedUrl } from "@/lib/supabase/storage";
import { ProjectReviewCard } from "@/components/project-review-card";
import { cn } from "@/lib/utils";

const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";

/** A section title in the main column, with an optional count. */
function SectionHead({ id, title, count }: { id: string; title: string; count?: number }) {
  return (
    <h2 id={id} className="mb-4 flex items-baseline gap-2 font-heading text-lg font-black uppercase">
      {title}
      {count ? <span className="text-sm font-semibold text-white/40">{count}</span> : null}
    </h2>
  );
}

/**
 * Where the film will play, before there is one: the poster (if any) dimmed under a slow light, a glowing play disc in a
 * turning dashed ring, the stage it is in and how far along. CSS animations only, still under reduced motion.
 */
function FilmInTheMaking({ poster, loading, stage, progress, label }: { poster: string | null; loading: boolean; stage: string; progress: number; label: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(70%_80%_at_50%_100%,rgba(255,110,20,0.20),transparent_70%),radial-gradient(60%_60%_at_15%_0%,rgba(255,176,102,0.08),transparent_70%),#0b0c0e]">
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- client poster, never optimised
        <img src={poster} alt="" className="absolute inset-0 size-full object-cover opacity-25 blur-[2px]" />
      ) : null}
      {/* A faint grid and a film strip's sprocket holes along the edges. */}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-5 bg-[repeating-linear-gradient(90deg,transparent_0_14px,rgba(255,255,255,0.07)_14px_26px)] [mask-image:linear-gradient(90deg,transparent,black_20%,black_80%,transparent)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-5 bg-[repeating-linear-gradient(90deg,transparent_0_14px,rgba(255,255,255,0.07)_14px_26px)] [mask-image:linear-gradient(90deg,transparent,black_20%,black_80%,transparent)]" />

      <div className="relative flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
        <div className="relative flex size-24 items-center justify-center sm:size-28">
          <span aria-hidden className="absolute inset-0 rounded-full border border-dashed border-[#ff8a1f]/45 motion-safe:animate-[spin_14s_linear_infinite]" />
          <span aria-hidden className="absolute inset-3 rounded-full bg-[#ff7a1a]/10 motion-safe:animate-pulse" />
          <span className="relative flex size-14 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] shadow-[0_0_40px_rgba(255,122,26,0.55)] sm:size-16">
            {loading ? <IconLoader2 className="size-6 animate-spin text-white" aria-hidden /> : <IconPlayerPlayFilled className="ml-0.5 size-6 text-white" aria-hidden />}
          </span>
        </div>
        <div>
          {stage && !loading ? <p className="font-heading text-sm font-black uppercase tracking-[0.12em] text-[#ffb066]">{stage}</p> : null}
          <p className="mt-1.5 max-w-[36ch] text-sm text-white/60">{label}</p>
        </div>
        {!loading ? (
          <div className="flex w-full max-w-xs items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", PEARL_BAR)} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-white/55">{progress}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

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
 * history) and the producer - and beside it ONE scrolling page, no tabs: where we are and what happens next, the files to
 * download, the timeline, the film (or, until it exists, `FilmInTheMaking`) and the comments under it. On a phone the
 * sidebar stacks above.
 * The finished film and the files the team uploaded live in private Storage and open through short-lived signed links;
 * a video in review carries the approve / request-a-revision card (`ProjectReviewCard`).
 */
export function ProjectPopup({
  project: initial,
  statusLabels,
  sample = false,
  seedComments = [],
  onChange,
}: {
  project: ClientProject;
  statusLabels: Record<ProjectStatus, string>;
  sample?: boolean;
  seedComments?: ProjectComment[];
  onChange?: (project: ClientProject) => void;
}) {
  const { t } = useLanguage();
  const p = t.account.projectsPage;
  // The client's own approval or revision request changes the project here before the page has refetched it.
  const [project, setProject] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [prefill, setPrefill] = useState("");
  // Bumped to remount the comment box with a new starting text (its draft is set once, on mount).
  const [prefillKey, setPrefillKey] = useState(0);
  const commentsRef = useRef<HTMLElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  /**
   * Brings the comments into view, optionally with a starting text (a revision request). `scrollIntoView` is right
   * here: it scrolls the popup's own scroller (`data-lenis-prevent`), never the page that Lenis drives.
   */
  const goComments = (text = "") => {
    if (text) {
      setPrefill(text);
      setPrefillKey((k) => k + 1);
    }
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // The uploaded film plays through a signed link (an hour); older rows and the samples play their Bunny film.
  const delivery = project.deliveryVideo;
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);
  useEffect(() => {
    if (sample || !delivery) return;
    let alive = true;
    void signedUrl(DELIVERY_BUCKET, delivery.path, 3600).then((url) => {
      if (alive && url) setSigned({ path: delivery.path, url });
    });
    return () => {
      alive = false;
    };
  }, [sample, delivery]);
  const film = delivery && !sample ? (signed?.path === delivery.path ? signed.url : null) : projectFilm(project);
  const filmLoading = Boolean(delivery && !sample && !film);
  const poster = projectPoster(project);
  const steps = timelineFor(project, statusLabels);
  const current = steps.find((s) => s.current) ?? steps[steps.length - 1];
  const left = Math.max(0, project.revisionsTotal - project.revisionsUsed);

  // What there is to download: the finished film first, then the team's files.
  const downloads: ProjectFile[] = [
    ...(delivery ? [{ name: delivery.name, url: null, path: delivery.path, size: formatBytes(delivery.size) || null }] : []),
    ...project.files,
  ];
  async function openFile(f: ProjectFile) {
    setFileError(null);
    if (f.path) {
      if (sample || !(await downloadPrivate(DELIVERY_BUCKET, f.path, f.name))) setFileError(p.fileError);
    } else if (f.url && f.url !== "#") {
      window.open(f.url, "_blank", "noopener");
    }
  }

  function applied(next: ClientProject, message: string) {
    setProject(next);
    setNotice(message);
    setRevisionOpen(false);
    onChange?.(next);
  }

  /** The sidebar's "Request a revision": the review card's form on a video in review, a comment otherwise. */
  function requestRevision() {
    if (project.status === "review") {
      setRevisionOpen(true);
      reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      goComments(p.comments.revisionPrefill);
    }
  }

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
      <aside className="flex shrink-0 flex-col gap-6 overflow-y-auto border-b border-white/10 bg-[linear-gradient(180deg,#17181c,#101114)] p-6 lg:w-[28rem] lg:border-r lg:border-b-0 xl:w-[32rem] xl:p-9 2xl:w-[36rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 pr-12 lg:pr-0">
            <StatusChip status={project.status} label={statusLabels[project.status]} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{project.kind}</span>
          </div>
          <DialogPrimitive.Title className="mt-3 font-heading text-[clamp(22px,2.2vw,30px)] leading-[1.02] font-black uppercase text-[#ff8a1f]">
            {project.title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{p.panelDescription}</DialogPrimitive.Description>
          {project.approvedAt ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <IconCheck className="size-3.5" stroke={3} aria-hidden />
              {p.review.approvedOn.replace("{date}", formatDateDisplay(project.approvedAt.slice(0, 10)))}
            </p>
          ) : null}
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
          <Fact icon={<IconRefresh className="size-[18px]" aria-hidden />} label={p.revisionsLeft} value={p.revisionsLeftValue.replace("{left}", String(left)).replace("{total}", String(project.revisionsTotal))} />
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
              onClick={requestRevision}
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

      {/* The main area: one scrolling page - where we are, the files, the timeline, the film, the comments. */}
      <section className="min-h-0 min-w-0 flex-1 lg:overflow-y-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6 pt-8 lg:pt-10 xl:p-10">
          {notice ? (
            <p role="status" className="rounded-xl border border-[#ff8a1f]/35 bg-[#ff7a1a]/[0.08] px-4 py-3 text-sm leading-relaxed text-white/85">
              {notice}
            </p>
          ) : null}
          {project.status === "review" ? (
            <div ref={reviewRef} className="scroll-mt-6">
              <ProjectReviewCard project={project} sample={sample} revisionOpen={revisionOpen} onRevisionOpen={setRevisionOpen} onDone={applied} />
            </div>
          ) : null}

          {/* Where we are and what happens next. */}
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

          {/* Files to download. */}
          <section aria-labelledby="project-files">
            <SectionHead id="project-files" title={p.tabs.files} count={downloads.length} />
            {fileError ? (
              <p role="alert" className="mb-3 text-sm text-[#ffb066]">
                {fileError}
              </p>
            ) : null}
            {downloads.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <IconFileDescription className="size-7 shrink-0 text-white/30" stroke={1.4} aria-hidden />
                <p className="text-sm text-white/55">{p.noFiles}</p>
              </div>
            ) : (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {downloads.map((f, i) => (
                  <li key={`${f.path ?? f.url}-${i}`}>
                    <button
                      type="button"
                      onClick={() => void openFile(f)}
                      className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]"
                    >
                      {delivery && i === 0 ? (
                        <IconMovie className="size-6 shrink-0 text-[#ffb066]" stroke={1.5} aria-hidden />
                      ) : (
                        <IconFileDescription className="size-6 shrink-0 text-[#ffb066]" stroke={1.5} aria-hidden />
                      )}
                      <span className="min-w-0 flex-1">
                        {delivery && i === 0 ? <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff8a1f]">{p.videoFile}</span> : null}
                        <span className="block truncate text-sm font-semibold">{f.name}</span>
                        {f.size ? <span className="text-xs text-white/45">{f.size}</span> : null}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#ff8a1f]">
                        <IconDownload className="size-[18px] transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden />
                        <span className="sr-only sm:not-sr-only">{p.download}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* The timeline: every stage with its date and note. */}
          <section aria-labelledby="project-timeline">
            <SectionHead id="project-timeline" title={p.tabs.timeline} />
            <ol className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              {steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
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
          </section>

          {/* The film - or, until it exists, a picture of it being made. */}
          <section aria-labelledby="project-film">
            <SectionHead id="project-film" title={p.videoFile} />
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e10] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95)]">
              {film ? (
                <video src={film} poster={poster ?? undefined} controls playsInline preload="metadata" className="absolute inset-0 size-full bg-black object-contain" />
              ) : (
                <FilmInTheMaking poster={poster} loading={filmLoading} stage={current?.title ?? ""} progress={progressOf(project)} label={filmLoading ? p.loadingVideo : p.notReady} />
              )}
            </div>
          </section>

          {/* Comments, under the film. */}
          <section ref={commentsRef} aria-labelledby="project-comments" className="scroll-mt-6">
            <SectionHead id="project-comments" title={p.tabs.comments} count={commentCount ?? undefined} />
            <p className="-mt-2 mb-5 text-sm text-white/50">{p.comments.intro}</p>
            <ProjectComments key={prefillKey} projectId={project.id} sample={sample} prefill={prefill} seed={seedComments} onCount={setCommentCount} />
          </section>
        </div>
      </section>
    </>
  );
}

/** The popup's frame: fills the screen, sidebar left, main right (stacked and scrolling as one on a phone). */
export function ProjectPopupFrame({
  project,
  statusLabels,
  onClose,
  onChange,
  sample = false,
}: {
  project: ClientProject | null;
  statusLabels: Record<ProjectStatus, string>;
  onClose: () => void;
  onChange?: (project: ClientProject) => void;
  sample?: boolean;
}) {
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
          {project ? <ProjectPopup key={project.id} project={project} statusLabels={statusLabels} sample={sample} seedComments={SAMPLE_COMMENTS[project.id] ?? []} onChange={onChange} /> : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
