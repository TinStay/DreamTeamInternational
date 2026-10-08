"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconAspectRatioFilled,
  IconCalendarFilled,
  IconCheck,
  IconCircleCheckFilled,
  IconClockFilled,
  IconDownload,
  IconFileFilled,
  IconGripVertical,
  IconMessageFilled,
  IconUserFilled,
  IconVideoFilled,
} from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { GradientBlurPageBg } from "@/components/ui/gradient-blur-bg";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { StatusChip } from "@/components/project-status-chip";
import { ProjectComments, type ProjectComment } from "@/components/project-comments";
import { ProjectReviewCard } from "@/components/project-review-card";
import { FilmInTheMaking } from "@/components/film-in-the-making";
import { MAIN_WITH_FIXED_PAGE_BG_CLASS } from "@/lib/page-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { myProjectsPath } from "@/lib/routes";
import { scrollToElement } from "@/lib/smooth-scroll";
import { DELIVERY_BUCKET, formatBytes, progressOf, projectFilm, projectPoster, timelineFor, type ClientProject, type ProjectFile, type ProjectStatus } from "@/lib/client-projects";
import { downloadPrivate, signedUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";
const PEARL_DISC = "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)]";
/** The drawer's width: what it opens at, and how far it can be dragged (never more than half the window). */
const DRAWER = { initial: 440, min: 320, max: 680, step: 24, storageKey: "izi:project-drawer-width" };
/** Clearance under the floating header when the page scrolls to a section. */
const HEADER_OFFSET = 112;

const clampWidth = (w: number) => Math.round(Math.min(Math.max(w, DRAWER.min), Math.min(DRAWER.max, Math.floor(window.innerWidth * 0.5))));

function SideTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{children}</h3>;
}

function SectionHead({ id, title, count, icon }: { id: string; title: string; count?: number; icon: ReactNode }) {
  return (
    <h2 id={id} className="mb-4 flex items-center gap-2.5 font-heading text-lg font-black uppercase">
      <span className="flex size-8 items-center justify-center rounded-lg bg-[#ff7a1a]/12 text-[#ff8a1f]">{icon}</span>
      {title}
      {count ? <span className="text-sm font-semibold text-white/40">{count}</span> : null}
    </h2>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ff7a1a]/12 text-[#ff8a1f]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-white/45">{label}</p>
        <p className="text-sm font-semibold break-words">{value}</p>
      </div>
    </div>
  );
}

/** A step's marker: filled and ticked when done, glowing with a pulse when current, an empty ring ahead. */
function StepDot({ done, current }: { done: boolean; current: boolean }) {
  return (
    <span
      className={cn(
        "relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full border",
        done ? cn("border-transparent text-white", PEARL_DISC) : current ? "border-[#ff8a1f] bg-[#ff8a1f]/15 shadow-[0_0_14px_rgba(255,138,31,0.55)]" : "border-white/20 bg-[#141518]"
      )}
    >
      {done ? <IconCheck className="size-3.5" stroke={3} aria-hidden /> : current ? <span className="size-2 animate-pulse rounded-full bg-[#ff8a1f]" aria-hidden /> : null}
    </span>
  );
}

/**
 * One project on its own page (`/my-projects/[id]`), under the site's navbar, with a way back to all projects:
 * - a **drawer** on the left - status, progress, the key facts, what the client told us, the revisions, the producer -
 *   that the client can **resize** by dragging (or with the arrow keys on) its edge; the width is remembered in this
 *   browser. It runs with the page (no scroll of its own); on a phone it stacks above the content;
 * - the **content** on the right, laid out by its own width (container queries), so it rearranges as the drawer
 *   moves: the timeline first (horizontal when there is room, vertical otherwise), what happens next, the film - or
 *   `FilmInTheMaking` until there is one - with Approve / Request a revision right under it (in review), then the
 *   comments and the files.
 * The finished film and the files live in private Storage and open through short-lived signed links.
 */
export function ProjectDetailView({ project: initial, sample = false, seedComments = [] }: { project: ClientProject; sample?: boolean; seedComments?: ProjectComment[] }) {
  const { t, language } = useLanguage();
  const p = t.account.projectsPage;
  const statusLabels = p.status as Record<ProjectStatus, string>;
  const backHref = `${myProjectsPath(language)}${sample ? "?sample=1" : ""}`;

  // The client's own approval or revision request changes the project here before the page is reloaded.
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

  // The drawer's width: the default on the server and while hydrating, then the one this browser remembered.
  const [width, setWidth] = useState(DRAWER.initial);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    let saved = 0;
    try {
      saved = Number(window.localStorage.getItem(DRAWER.storageKey)) || 0;
    } catch {
      // Storage blocked (a private window): the default width it is.
    }
    if (saved) {
      const id = window.setTimeout(() => setWidth(clampWidth(saved)), 0);
      return () => window.clearTimeout(id);
    }
  }, []);
  const remember = useCallback((w: number) => {
    try {
      window.localStorage.setItem(DRAWER.storageKey, String(w));
    } catch {
      // Not remembered - fine.
    }
  }, []);

  function onResizeStart(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    let last = startW;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      last = clampWidth(startW + ev.clientX - startX);
      setWidth(last);
    };
    const up = () => {
      setDragging(false);
      remember(last);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  function onResizeKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    const delta = e.key === "ArrowLeft" ? -DRAWER.step : e.key === "ArrowRight" ? DRAWER.step : 0;
    if (!delta) return;
    e.preventDefault();
    const next = clampWidth(width + delta);
    setWidth(next);
    remember(next);
  }

  /** Brings the comments into view, optionally with a starting text (a revision request). */
  const goComments = (text = "") => {
    if (text) {
      setPrefill(text);
      setPrefillKey((k) => k + 1);
    }
    scrollToElement(commentsRef.current, { offset: HEADER_OFFSET });
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
  const progress = progressOf(project);

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
  }

  /** The drawer's "Request a revision": the review card's form on a video in review, a comment otherwise. */
  function requestRevision() {
    if (project.status === "review") {
      setRevisionOpen(true);
      scrollToElement(reviewRef.current, { offset: HEADER_OFFSET });
    } else {
      goComments(p.comments.revisionPrefill);
    }
  }

  return (
    <main className={MAIN_WITH_FIXED_PAGE_BG_CLASS}>
      <div className="fixed inset-0 z-[-1]">
        <GradientBlurPageBg className="h-full w-full" />
      </div>
      <SiteHeader />

      <div className={cn("relative z-10 mx-auto w-full max-w-[110rem] flex-1 px-[max(1.25rem,2.5vw)] pt-28 pb-16 text-white", dragging && "cursor-col-resize select-none")}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href={backHref}
            className="group inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/85 transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:bg-white/[0.08] hover:text-white"
          >
            <IconArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
            {p.backToAll}
          </Link>
          <PageBreadcrumbs className="mt-0 mb-0 sm:mt-0" lastLabel={project.title} />
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0">
          {/* The drawer: the most important things. Its width is the client's (drag its edge). */}
          <aside
            style={{ "--drawer": `${width}px` } as CSSProperties}
            className="flex shrink-0 flex-col gap-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#17181c,#101114)] p-6 lg:w-[var(--drawer)] xl:p-7"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusChip status={project.status} label={statusLabels[project.status]} />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{project.kind}</span>
              </div>
              <h1 className="mt-3 font-heading text-[clamp(22px,2.2vw,30px)] leading-[1.02] font-black uppercase text-[#ff8a1f]">{project.title}</h1>
              {project.approvedAt ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <IconCircleCheckFilled className="size-4" aria-hidden />
                  {p.review.approvedOn.replace("{date}", formatDateDisplay(project.approvedAt.slice(0, 10)))}
                </p>
              ) : null}
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={cn("h-full rounded-full", PEARL_BAR)} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-white/60">{progress}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Fact icon={<IconCalendarFilled className="size-6" aria-hidden />} label={p.due} value={project.dueDate ? formatDateDisplay(project.dueDate.slice(0, 10)) : p.tbd} />
              <Fact icon={<IconClockFilled className="size-6" aria-hidden />} label={p.length} value={project.durationSeconds ? formatVideoTime(project.durationSeconds) : p.tbd} />
              <Fact icon={<IconAspectRatioFilled className="size-6" aria-hidden />} label={p.format} value={project.format ?? p.tbd} />
              <Fact
                icon={<IconCircleCheckFilled className="size-6" aria-hidden />}
                label={p.revisionsLeft}
                value={p.revisionsLeftValue.replace("{left}", String(left)).replace("{total}", String(project.revisionsTotal))}
              />
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

            {/* Revisions: a disc for each, filled when used, and what was asked. */}
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
                      i < project.revisionsUsed ? cn("border-transparent text-white", PEARL_DISC) : "border-white/25 text-white/40"
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
                      <IconCircleCheckFilled className={cn("mt-0.5 size-4 shrink-0", r.done ? "text-[#ff8a1f]" : "text-white/25")} aria-hidden />
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
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-white", PEARL_DISC)}>
                  <IconUserFilled className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{project.managerName ?? p.teamName}</p>
                  <p className="text-xs text-white/45">{p.producerLine}</p>
                </div>
                <button
                  type="button"
                  onClick={() => goComments()}
                  aria-label={p.messageUs}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/80 transition-[transform,background-color,color] duration-200 hover:scale-105 hover:bg-white/10 hover:text-white"
                >
                  <IconMessageFilled className="size-[17px]" aria-hidden />
                </button>
              </div>
            </section>
          </aside>

          {/* The drawer's edge: drag it (or focus it and press ←/→) to make the drawer wider or narrower. */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={p.resizeDrawer}
            aria-valuemin={DRAWER.min}
            aria-valuemax={DRAWER.max}
            aria-valuenow={width}
            tabIndex={0}
            onPointerDown={onResizeStart}
            onKeyDown={onResizeKey}
            className="group hidden w-6 shrink-0 cursor-col-resize touch-none items-center justify-center self-stretch outline-none lg:sticky lg:top-28 lg:flex lg:max-h-[calc(100svh-8rem)]"
          >
            <span
              className={cn(
                "flex h-16 w-1.5 items-center justify-center rounded-full transition-[background-color,height,width] duration-200",
                dragging ? "h-24 w-2 bg-primary" : "bg-white/15 group-hover:h-20 group-hover:bg-primary/70 group-focus-visible:bg-primary"
              )}
            >
              <IconGripVertical className="size-3 text-black/60 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </span>
          </div>

          {/* The content: laid out by its own width, so it follows the drawer. */}
          <div className="@container min-w-0 flex-1">
            <div className="flex flex-col gap-10">
              {/* The timeline: across the content when there is room, down it when there is not. */}
              <section aria-labelledby="project-timeline">
                <SectionHead id="project-timeline" title={p.tabs.timeline} icon={<IconCalendarFilled className="size-[17px]" aria-hidden />} />
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 @3xl:p-7">
                  {/* Horizontal. */}
                  <ol className="hidden @3xl:flex">
                    {steps.map((step, i) => (
                      <li key={`${step.title}-${i}`} className="relative min-w-0 flex-1 pr-4">
                        {i < steps.length - 1 ? (
                          <span aria-hidden className={cn("absolute top-[13px] left-[27px] h-px w-[calc(100%-27px)]", step.done ? "bg-[#ff8a1f]/60" : "bg-white/12")} />
                        ) : null}
                        <StepDot done={step.done} current={step.current} />
                        <p className={cn("mt-3 text-sm font-semibold", step.done || step.current ? "text-white" : "text-white/45")}>{step.title}</p>
                        {step.date ? <p className="mt-0.5 text-xs text-white/45">{formatDateDisplay(step.date.slice(0, 10))}</p> : null}
                        {step.note ? <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-white/55">{step.note}</p> : null}
                      </li>
                    ))}
                  </ol>
                  {/* Vertical. */}
                  <ol className="@3xl:hidden">
                    {steps.map((step, i) => (
                      <li key={`${step.title}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < steps.length - 1 ? <span aria-hidden className={cn("absolute top-7 bottom-0 left-[13px] w-px", step.done ? "bg-[#ff8a1f]/60" : "bg-white/12")} /> : null}
                        <StepDot done={step.done} current={step.current} />
                        <div className="min-w-0 pt-0.5">
                          <p className={cn("text-base font-semibold", step.done || step.current ? "text-white" : "text-white/45")}>{step.title}</p>
                          {step.date ? <p className="mt-0.5 text-xs text-white/45">{formatDateDisplay(step.date.slice(0, 10))}</p> : null}
                          {step.note ? <p className="mt-1.5 text-sm leading-relaxed text-white/60">{step.note}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* What happens next (where we are is the timeline right above). */}
              <div className="rounded-2xl border border-[#ff8a1f]/30 bg-[#ff7a1a]/[0.06] p-5">
                <SideTitle>{p.nextStep}</SideTitle>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{project.nextStep ?? p.nextStepDefault}</p>
              </div>

              {/* The film - or, until it exists, a picture of it being made. */}
              <section aria-labelledby="project-film">
                <SectionHead id="project-film" title={p.videoFile} icon={<IconVideoFilled className="size-[17px]" aria-hidden />} />
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e10] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95)]">
                  {film ? (
                    <video src={film} poster={poster ?? undefined} controls playsInline preload="metadata" className="absolute inset-0 size-full bg-black object-contain" />
                  ) : (
                    <FilmInTheMaking poster={poster} loading={filmLoading} stage={current?.title ?? ""} progress={progress} label={filmLoading ? p.loadingVideo : p.notReady} />
                  )}
                </div>
              </section>

              {notice ? (
                <p role="status" className="rounded-xl border border-[#ff8a1f]/35 bg-[#ff7a1a]/[0.08] px-4 py-3 text-sm leading-relaxed text-white/85">
                  {notice}
                </p>
              ) : null}

              {/* Approve, or request a revision - right under the film. */}
              {project.status === "review" ? (
                <div ref={reviewRef}>
                  <ProjectReviewCard project={project} sample={sample} revisionOpen={revisionOpen} onRevisionOpen={setRevisionOpen} onDone={applied} />
                </div>
              ) : null}

              {/* Comments, under the film. */}
              <section ref={commentsRef} aria-labelledby="project-comments">
                <SectionHead id="project-comments" title={p.tabs.comments} count={commentCount ?? undefined} icon={<IconMessageFilled className="size-[17px]" aria-hidden />} />
                <p className="-mt-2 mb-5 text-sm text-white/50">{p.comments.intro}</p>
                <ProjectComments key={prefillKey} projectId={project.id} sample={sample} prefill={prefill} seed={seedComments} onCount={setCommentCount} />
              </section>

              {/* Files to download. */}
              <section aria-labelledby="project-files">
                <SectionHead id="project-files" title={p.tabs.files} count={downloads.length} icon={<IconFileFilled className="size-[17px]" aria-hidden />} />
                {fileError ? (
                  <p role="alert" className="mb-3 text-sm text-[#ffb066]">
                    {fileError}
                  </p>
                ) : null}
                {downloads.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <IconFileFilled className="size-7 shrink-0 text-white/20" aria-hidden />
                    <p className="text-sm text-white/55">{p.noFiles}</p>
                  </div>
                ) : (
                  <ul className="grid gap-2.5 @2xl:grid-cols-2 @5xl:grid-cols-3">
                    {downloads.map((f, i) => (
                      <li key={`${f.path ?? f.url}-${i}`}>
                        <button
                          type="button"
                          onClick={() => void openFile(f)}
                          className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]"
                        >
                          {delivery && i === 0 ? (
                            <IconVideoFilled className="size-6 shrink-0 text-[#ff8a1f]" aria-hidden />
                          ) : (
                            <IconFileFilled className="size-6 shrink-0 text-[#ff8a1f]" aria-hidden />
                          )}
                          <span className="min-w-0 flex-1">
                            {delivery && i === 0 ? <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff8a1f]">{p.videoFile}</span> : null}
                            <span className="block truncate text-sm font-semibold">{f.name}</span>
                            {f.size ? <span className="text-xs text-white/45">{f.size}</span> : null}
                          </span>
                          <IconDownload className="size-[18px] text-[#ff8a1f] transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden />
                          <span className="sr-only">{p.download}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileNav />
    </main>
  );
}
