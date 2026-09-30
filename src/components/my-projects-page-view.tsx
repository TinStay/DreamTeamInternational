"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectPopupFrame } from "@/components/project-popup";
import { StatusChip } from "@/components/project-status-chip";
import { IconCalendarEvent, IconMovie, IconPlayerPlayFilled, IconPlus } from "@tabler/icons-react";
import { SubmitProjectDialog } from "@/components/submit-project-dialog";
import { notifyCreditsChanged } from "@/lib/supabase/use-credits";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { TigerCta } from "@/components/hero-tiger/tiger-cta";
import { useLanguage } from "@/lib/i18n/language-context";
import { myProjectsPath, pricingPath } from "@/lib/routes";
import { formatDateDisplay } from "@/lib/dates";
import { progressOf, projectPoster, type ClientProject, type ProjectStatus } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

const PEARL_BAR = "bg-[linear-gradient(90deg,#ff5e00,#ffb066)]";

/**
 * `/my-projects` - YOUR PROJECTS: one window per project (poster, status, progress, due date). Choosing one slides the
 * project's side panel in from the right: the film (when there is one), the facts, the brief and the timeline of stages,
 * and a way to ask for a change. The rows come from the Supabase `projects` table (supabase/projects.sql); with none, the
 * page shows the empty state and the way to order the first video.
 */
export function MyProjectsPageView({ projects: saved, sample = false, purchased = false }: { projects: ClientProject[]; sample?: boolean; purchased?: boolean }) {
  const { t, language } = useLanguage();
  const a = t.account;
  const p = a.projectsPage;
  const statusLabels = p.status as Record<ProjectStatus, string>;
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  // Projects submitted on this page show up at once (before the page has refetched them); a saved one replaces its copy.
  const [added, setAdded] = useState<ClientProject[]>([]);
  const [notice, setNotice] = useState<string | null>(purchased ? p.purchased : null);
  // Back from the payment page: the seconds arrive when Stripe's confirmation reaches us, a few seconds later - look again a few times.
  useEffect(() => {
    if (!purchased) return;
    const timers = [1500, 4000, 8000, 15000].map((ms) => window.setTimeout(notifyCreditsChanged, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [purchased]);
  const projects = useMemo(() => {
    const ids = new Set(saved.map((x) => x.id));
    return [...added.filter((x) => !ids.has(x.id)), ...saved];
  }, [added, saved]);
  const selected = projects.find((x) => x.id === openId) ?? null;

  return (
    <AccountShell>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{a.eyebrow}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
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
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {projects.map((project) => {
              const poster = projectPoster(project);
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(project.id)}
                    className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#1c1d22_0%,#121316_60%)] text-left shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[#ff7a1a]/45 hover:shadow-[0_30px_60px_-28px_rgba(255,106,20,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a1f]"
                  >
                    <span className="relative block aspect-video w-full overflow-hidden border-b border-white/10 bg-[radial-gradient(90%_90%_at_50%_100%,rgba(255,110,20,0.22),transparent_65%),#0d0e10]">
                      {poster ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Bunny / client posters: tiny, referrer-gated, never optimised
                        <img src={poster} alt="" referrerPolicy="origin" className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                      ) : (
                        <IconMovie className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-white/25" stroke={1.4} aria-hidden />
                      )}
                      <span className="absolute top-3 left-3">
                        <StatusChip status={project.status} label={statusLabels[project.status]} />
                      </span>
                      {project.videoId ? (
                        <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                          <IconPlayerPlayFilled className="size-4" aria-hidden />
                        </span>
                      ) : null}
                    </span>
                    <span className="flex flex-1 flex-col p-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{project.kind}</span>
                      <span className="mt-1 font-heading text-lg leading-tight font-black uppercase transition-colors duration-200 group-hover:text-[#ff8a1f]">{project.title}</span>
                      <span className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                        <span className={cn("block h-full rounded-full", PEARL_BAR)} style={{ width: `${progressOf(project)}%` }} />
                      </span>
                      <span className="mt-3 flex items-center justify-between gap-3 text-sm text-white/55">
                        <span>{statusLabels[project.status]}</span>
                        {project.dueDate ? (
                          <span className="inline-flex items-center gap-1.5">
                            <IconCalendarEvent className="size-4" aria-hidden />
                            {formatDateDisplay(project.dueDate.slice(0, 10))}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <SubmitProjectDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        sample={sample}
        onCreated={(project, notified) => {
          setAdded((prev) => [project, ...prev]);
          setNotice(notified ? p.submit.done : p.submit.doneNoFiles);
          if (!sample) router.refresh();
          setOpenId(project.id);
        }}
      />
      <ProjectPopupFrame project={selected} statusLabels={statusLabels} sample={sample} onClose={() => setOpenId(null)} />
    </AccountShell>
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
