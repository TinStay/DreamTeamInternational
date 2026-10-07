"use client";

import { useMemo, useState } from "react";
import { IconAlertTriangle, IconChevronRight, IconClock, IconMessageCircle, IconPaperclip, IconSearch } from "@tabler/icons-react";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { StatusChip } from "@/components/project-status-chip";
import { TeamProjectPopup } from "@/components/team-project-popup";
import { TeamClientsView } from "@/components/team-clients-view";
import type { ClientOverview } from "@/lib/clients";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { PROJECT_STATUSES, type ClientProject, type ProjectStatus } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

type Filter = "all" | ProjectStatus;
type Sort = "newest" | "due" | "client";

const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (p: ClientProject) => p.status !== "delivered" && !!p.dueDate && p.dueDate.slice(0, 10) < today();

/**
 * The team dashboard: numbers on top (how many projects, how many are new, in work, in review, delivered, overdue), a search
 * and status filter, then every client's project as a row - client, stage, due date, length, files attached - and a click
 * opens it full screen with everything the client filled in, their files, and the controls to move it along. The Clients
 * tab (`team-clients-view.tsx`) lists every client - profile, private notes, video time history, projects.
 */
export function TeamDashboardView({ projects: initial, clients, sample }: { projects: ClientProject[]; clients: ClientOverview[] | null; sample: boolean }) {
  const { t } = useLanguage();
  const d = t.team;
  const statusLabels = t.account.projectsPage.status as Record<ProjectStatus, string>;
  const [projects, setProjects] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"projects" | "clients">("projects");

  const counts = useMemo(() => {
    const c: Record<ProjectStatus, number> = { brief: 0, scripting: 0, production: 0, review: 0, delivered: 0 };
    for (const p of projects) c[p.status] += 1;
    return c;
  }, [projects]);
  const overdue = useMemo(() => projects.filter(isOverdue).length, [projects]);
  const awaiting = useMemo(() => projects.filter((p) => p.awaitingReply).length, [projects]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter(
      (p) =>
        (filter === "all" || p.status === filter) &&
        (!q || [p.title, p.kind, p.clientName, p.clientEmail].some((v) => v?.toLowerCase().includes(q)))
    );
    const by = {
      newest: (a: ClientProject, b: ClientProject) => b.createdAt.localeCompare(a.createdAt),
      due: (a: ClientProject, b: ClientProject) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
      client: (a: ClientProject, b: ClientProject) => (a.clientName ?? "").localeCompare(b.clientName ?? ""),
    }[sort];
    return [...list].sort(by);
  }, [projects, filter, sort, query]);

  const selected = projects.find((p) => p.id === openId) ?? null;
  const stat = (label: string, value: number, tone?: "warn") => (
    <div className={cn(ACCOUNT_CARD, "p-5", tone === "warn" && value > 0 && "border-red-400/35")}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className={cn("mt-2 font-heading text-4xl font-black", tone === "warn" && value > 0 ? "text-red-300" : "text-white")}>{value}</p>
    </div>
  );

  return (
    <AccountShell wide>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{d.eyebrow}</p>
      <h1 className="mt-3 font-heading text-[clamp(30px,4vw,56px)] leading-[0.98] font-black uppercase text-balance">
        {d.title} <span className="text-section-accent">{d.title2}</span>
      </h1>
      {sample ? (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ff8a1f]/40 bg-[#ff7a1a]/10 px-4 py-1.5 text-sm text-[#ffb066]">
          <span className="size-1.5 rounded-full bg-[#ff8a1f]" aria-hidden />
          {d.sampleBanner}
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stat(d.stats.total, projects.length)}
        {stat(d.stats.new, counts.brief)}
        {stat(d.stats.inWork, counts.scripting + counts.production)}
        {stat(d.stats.inReview, counts.review)}
        {stat(d.stats.delivered, counts.delivered)}
        {stat(d.stats.overdue, overdue, "warn")}
      </div>
      {awaiting > 0 ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ff8a1f]/40 bg-[#ff7a1a]/10 px-4 py-1.5 text-sm text-[#ffb066]">
          <IconMessageCircle className="size-4" aria-hidden />
          {d.awaiting.replace("{n}", String(awaiting))}
        </p>
      ) : null}

      {/* Projects | Clients. */}
      <div className="mt-8 inline-flex gap-1 rounded-full border border-white/12 bg-black/30 p-1" role="tablist" aria-label={d.title2}>
        {(["projects", "clients"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-px",
              tab === key ? "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "text-white/60 hover:bg-white/8 hover:text-white"
            )}
          >
            {d.tabs[key]}
            <span className="ml-1.5 text-xs opacity-70">{key === "projects" ? projects.length : (clients?.length ?? 0)}</span>
          </button>
        ))}
      </div>

      {tab === "clients" ? (
        <TeamClientsView
          clients={clients}
          projects={projects}
          sample={sample}
          onOpenProject={(id) => {
            setTab("projects");
            setOpenId(id);
          }}
        />
      ) : (
      <>
      {/* Search, stage filter, sort. */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1 md:max-w-sm">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-white/40" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={d.search} aria-label={d.search} className="h-11 rounded-full border-white/12 bg-black/30 pl-10" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label={d.stageFilter}>
          {(["all", ...PROJECT_STATUSES] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold transition-[background-color,color] duration-200 ease-out",
                filter === f ? "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "border border-white/12 text-white/60 hover:bg-white/8 hover:text-white"
              )}
            >
              {f === "all" ? d.all : statusLabels[f]}
              <span className="ml-1.5 text-xs opacity-70">{f === "all" ? projects.length : counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-white/55">
          {d.sortBy}
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 cursor-pointer rounded-full border border-white/12 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#ff8a1f]/70">
            <option value="newest">{d.sort.newest}</option>
            <option value="due">{d.sort.due}</option>
            <option value="client">{d.sort.client}</option>
          </select>
        </label>
      </div>

      {/* The projects. */}
      <section className={cn(ACCOUNT_CARD, "mt-6 overflow-hidden")}>
        <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.5fr)_10rem_7rem_7rem_4rem_6rem_2rem] items-center gap-4 border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:grid">
          <span>{d.cols.project}</span>
          <span>{d.cols.client}</span>
          <span>{d.cols.stage}</span>
          <span>{d.cols.due}</span>
          <span>{d.cols.submitted}</span>
          <span>{d.cols.files}</span>
          <span>{d.cols.comments}</span>
          <span />
        </div>
        {shown.length === 0 ? (
          <p className="p-10 text-center text-white/50">{projects.length === 0 ? d.empty : d.noMatch}</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {shown.map((p) => {
              const late = isOverdue(p);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(p.id)}
                    className="group grid w-full cursor-pointer grid-cols-1 items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors duration-200 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.5fr)_10rem_7rem_7rem_4rem_6rem_2rem]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold transition-colors duration-200 group-hover:text-[#ff8a1f]">{p.title}</span>
                      <span className="block truncate text-xs text-white/45">
                        {p.kind}
                        {p.durationSeconds ? ` · ${formatVideoTime(p.durationSeconds)}` : ""}
                        {p.format ? ` · ${p.format}` : ""}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{p.clientName ?? d.unknownClient}</span>
                      <span className="block truncate text-xs text-white/45">{p.clientEmail ?? ""}</span>
                    </span>
                    <span>
                      <StatusChip status={p.status} label={statusLabels[p.status]} />
                    </span>
                    <span className={cn("flex items-center gap-1.5 text-sm", late ? "font-semibold text-red-300" : "text-white/70")}>
                      {late ? <IconAlertTriangle className="size-4" aria-hidden /> : <IconClock className="size-4 text-white/35" aria-hidden />}
                      {p.dueDate ? formatDateDisplay(p.dueDate.slice(0, 10)) : "-"}
                    </span>
                    <span className="text-sm text-white/55">{p.createdAt ? formatDateDisplay(p.createdAt.slice(0, 10)) : "-"}</span>
                    <span className={cn("flex items-center gap-1.5 text-sm", p.briefFiles.length ? "text-[#ffb066]" : "text-white/30")}>
                      <IconPaperclip className="size-4" aria-hidden />
                      {p.briefFiles.length}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <IconMessageCircle className={cn("size-4", p.commentCount ? "text-white/60" : "text-white/25")} aria-hidden />
                      <span className={p.commentCount ? "text-white/75" : "text-white/30"}>{p.commentCount ?? 0}</span>
                      {p.awaitingReply ? <span className="rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">{d.reply}</span> : null}
                    </span>
                    <IconChevronRight className="hidden size-5 text-white/30 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#ff8a1f] lg:block" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </>
      )}

      <TeamProjectPopup
        project={selected}
        sample={sample}
        statusLabels={statusLabels}
        onClose={() => setOpenId(null)}
        onSaved={(next) => setProjects((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
      />
    </AccountShell>
  );
}
