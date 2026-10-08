"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilmInTheMaking } from "@/components/film-in-the-making";
import { ProjectFilmLightbox } from "@/components/project-film-lightbox";
import { StatusChip } from "@/components/project-status-chip";
import { IconCalendarFilled, IconChevronRight, IconPlayerPlayFilled, IconPlus, IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { SubmitProjectDialog } from "@/components/submit-project-dialog";
import { notifyCreditsChanged } from "@/lib/supabase/use-credits";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { useLanguage } from "@/lib/i18n/language-context";
import { myProjectsPath, pricingPath } from "@/lib/routes";
import { formatDateDisplay } from "@/lib/dates";
import { hasFilm, progressOf, projectPoster, type ClientProject, type ProjectStatus } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";

/** The list's filters: where a project stands for the client. */
type Filter = "all" | "active" | "review" | "delivered";
const FILTERS: Filter[] = ["all", "active", "review", "delivered"];
const filterOf = (status: ProjectStatus): Exclude<Filter, "all"> => (status === "review" ? "review" : status === "delivered" ? "delivered" : "active");

type Sort = "newest" | "oldest" | "due" | "name";
const SORTS: Record<Sort, (a: ClientProject, b: ClientProject) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  // Soonest due first; projects without a date at the end.
  due: (a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
  name: (a, b) => a.title.localeCompare(b.title),
};

/**
 * `/my-projects` - YOUR PROJECTS (the video time available is at the top of the side menu): one big card per project (its film's poster - or the
 * `FilmInTheMaking` picture until there is one - status, progress, due date). A card opens the project on its own page
 * (`/my-projects/[id]`, `ProjectDetailView`). The rows come from the Supabase `projects` table (supabase/projects.sql); with none, the
 * page shows the empty state and the way to order the first video.
 */
export function MyProjectsPageView({ projects: saved, sample = false, purchased = false }: { projects: ClientProject[]; sample?: boolean; purchased?: boolean }) {
  const { t, language } = useLanguage();
  const a = t.account;
  const p = a.projectsPage;
  const tb = p.toolbar;
  const statusLabels = p.status as Record<ProjectStatus, string>;
  const router = useRouter();
  const [submitOpen, setSubmitOpen] = useState(false);
  // The film playing in the lightbox (a card's play button).
  const [playing, setPlaying] = useState<ClientProject | null>(null);
  const projectHref = (id: string) => `${myProjectsPath(language)}/${id}${sample ? "?sample=1" : ""}`;
  // Projects submitted on this page show up at once (before the page has refetched them); a saved one replaces its copy.
  const [added, setAdded] = useState<ClientProject[]>([]);
  const [notice, setNotice] = useState<string | null>(purchased ? p.purchased : null);
  // Back from the payment page: the seconds arrive when Stripe's confirmation reaches us, a few seconds later - look again a few times.
  useEffect(() => {
    if (!purchased) return;
    const timers = [1500, 4000, 8000, 15000].map((ms) => window.setTimeout(notifyCreditsChanged, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [purchased]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const projects = useMemo(() => {
    const ids = new Set(saved.map((x) => x.id));
    return [...added.filter((x) => !ids.has(x.id)), ...saved];
  }, [added, saved]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: projects.length, active: 0, review: 0, delivered: 0 };
    for (const x of projects) c[filterOf(x.status)] += 1;
    return c;
  }, [projects]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter((x) => (filter === "all" || filterOf(x.status) === filter) && (!q || [x.title, x.kind, x.brief].some((v) => v?.toLowerCase().includes(q))));
    return [...list].sort(SORTS[sort]);
  }, [projects, filter, sort, query]);

  return (
    <AccountShell>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <h1 className="font-heading text-[clamp(30px,4vw,56px)] leading-[0.98] font-black uppercase text-balance text-[#ff8a1f]">{a.yourProjects}</h1>
        <SubmitButton onClick={() => setSubmitOpen(true)} label={p.submit.button} />
      </div>

      {notice ? (
        <p role="status" className="mt-5 rounded-xl border border-[#ff8a1f]/35 bg-[#ff7a1a]/[0.08] px-4 py-3 text-sm leading-relaxed text-white/85">
          {notice}
        </p>
      ) : null}

      {sample ? (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ff8a1f]/40 bg-[#ff7a1a]/10 px-4 py-1.5 text-sm text-[#ffb066]">
          <span className="size-1.5 rounded-full bg-[#ff8a1f]" aria-hidden />
          {p.sampleBanner}
        </p>
      ) : null}

      {projects.length === 0 ? (
        <section className={`${ACCOUNT_CARD} mt-10 p-8 text-center sm:p-12`}>
          <p className="mx-auto max-w-[44ch] text-white/65">{a.ordersEmpty}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <SubmitButton onClick={() => setSubmitOpen(true)} label={p.submit.button} />
            <TigerCta href={`${pricingPath(language)}?for=individual`} label={a.startOrder} className="tiger-cta--sm" />
          </div>
          <p className="mt-5 text-sm">
            <Link href={`${myProjectsPath(language)}?sample=1`} className="text-white/50 underline decoration-white/25 underline-offset-2 transition-colors hover:text-[#ff8a1f]">
              {p.trySample}
            </Link>
          </p>
        </section>
      ) : (
        <>
          <p className="mt-4 max-w-[60ch] text-white/60">{p.subtitle}</p>

          {/* Search, filter by where the project stands, sort. */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-white/40" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tb.search} aria-label={tb.search} className="h-11 rounded-full border-white/12 bg-black/30 pl-10" />
            </div>
            <div role="group" aria-label={tb.filterLabel} className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-[transform,background-color,color,border-color] duration-200 ease-out hover:-translate-y-px",
                    filter === key ? "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "border border-white/12 text-white/65 hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  {tb.filters[key]}
                  <span className={cn("text-xs", filter === key ? "text-white/80" : "text-white/40")}>{counts[key]}</span>
                </button>
              ))}
            </div>
            <label className="ml-auto flex items-center gap-2 text-sm text-white/55">
              {tb.sortLabel}
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 cursor-pointer rounded-full border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition-colors duration-200 hover:border-white/30 focus:border-[#ff8a1f]/70">
                {(Object.keys(SORTS) as Sort[]).map((key) => (
                  <option key={key} value={key}>
                    {tb.sort[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {shown.length === 0 ? <p className={`${ACCOUNT_CARD} mt-8 p-10 text-center text-white/55`}>{tb.noMatch}</p> : null}
          <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:gap-8">
            {shown.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} statusLabel={statusLabels[project.status]} href={projectHref(project.id)} onPlay={() => setPlaying(project)} />
              </li>
            ))}
          </ul>
        </>
      )}

      <ProjectFilmLightbox project={playing} href={playing ? projectHref(playing.id) : ""} sample={sample} onClose={() => setPlaying(null)} />
      <SubmitProjectDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        sample={sample}
        onCreated={(project, notified) => {
          setAdded((prev) => [project, ...prev]);
          // No "thank you" alert: the project opens on its own page, which says what happens next. Only a file that
          // could not be sent is worth telling here.
          if (!notified) setNotice(p.submit.doneNoFiles);
          if (!sample) router.push(`${myProjectsPath(language)}/${project.id}`);
        }}
      />
    </AccountShell>
  );
}

/**
 * A project as a card: the film's poster with a play button once there is a film (it opens the film in a lightbox,
 * `ProjectFilmLightbox`, on the list - the rest of the card opens the project's page), the compact `FilmInTheMaking` picture
 * before; the status chip on top; kind, title, the progress bar, the stage and the due date under it. The whole card is
 * the link to the project's page.
 */
function ProjectCard({ project, statusLabel, href, onPlay }: { project: ClientProject; statusLabel: string; href: string; onPlay: () => void }) {
  const { t } = useLanguage();
  const poster = projectPoster(project);
  const film = hasFilm(project);
  const progress = progressOf(project);
  return (
    <div className="relative h-full">
    <Link
      href={href}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_60%)] text-left shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[#ff7a1a]/45 hover:shadow-[0_30px_60px_-28px_rgba(255,106,20,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a1f]"
    >
      <span className="relative block aspect-video w-full overflow-hidden border-b border-white/10 bg-[#0d0e10]">
        {film && poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- Bunny / client posters: referrer-gated, never optimised
          <img src={poster} alt="" referrerPolicy="origin" className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        ) : (
          <span className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
            <FilmInTheMaking compact poster={poster} stage={statusLabel} progress={progress} />
          </span>
        )}
        <span className="absolute top-3 left-3">
          <StatusChip status={project.status} label={statusLabel} />
        </span>
      </span>
      <span className="flex flex-1 flex-col p-6 xl:p-7">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{project.kind}</span>
        <span className="mt-1.5 flex items-start justify-between gap-3">
          <span className="font-heading text-xl leading-tight font-black uppercase xl:text-2xl transition-colors duration-200 group-hover:text-[#ff8a1f]">{project.title}</span>
          <IconChevronRight className="mt-0.5 size-5 shrink-0 text-white/30 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#ff8a1f]" aria-hidden />
        </span>
        <span className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <span className={cn("block h-full rounded-full", PEARL_BAR)} style={{ width: `${progress}%` }} />
        </span>
        <span className="mt-3 flex items-center justify-between gap-3 text-sm text-white/55">
          <span>{statusLabel}</span>
          {project.dueDate ? (
            <span className="inline-flex items-center gap-1.5">
              <IconCalendarFilled className="size-4 text-[#ff8a1f]/80" aria-hidden />
              {formatDateDisplay(project.dueDate.slice(0, 10))}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
      {/* Play: the film in a lightbox, without leaving the list. Over the picture (its 16:9 box), outside the link. */}
      {film ? (
        <div className="pointer-events-none absolute inset-x-px top-px aspect-video">
          <button
            type="button"
            onClick={onPlay}
            aria-label={`${t.account.projectsPage.playFilm}: ${project.title}`}
            className="pointer-events-auto absolute right-4 bottom-4 flex size-12 cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white shadow-[0_0_24px_rgba(255,122,26,0.55)] transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-[0_0_34px_rgba(255,122,26,0.8)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <IconPlayerPlayFilled className="ml-0.5 size-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** The orange "Submit a project" pill (with a plus that turns a quarter on hover). */
function SubmitButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-12px_rgba(255,106,20,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffb066]"
    >
      <IconPlus className="size-5 transition-transform duration-300 ease-out group-hover:rotate-90" stroke={2.5} aria-hidden />
      {label}
    </button>
  );
}
