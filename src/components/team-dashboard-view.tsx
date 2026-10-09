"use client";

import { PillSelect } from "@/components/ui/pill-select";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { IconAlertTriangle, IconChevronRight, IconClock, IconFolderFilled, IconMessageCircle, IconPaperclip, IconSearch, IconUsersGroup } from "@tabler/icons-react";
import { ACCOUNT_CARD } from "@/components/account-shell";
import { AdminShell } from "@/components/admin/admin-shell";
import { InboxCard, hasMissingPayment } from "@/components/admin/inbox-card";
import { StatusChip } from "@/components/project-status-chip";
import { TeamProjectPopup } from "@/components/team-project-popup";
import { TeamClientsView } from "@/components/team-clients-view";
import type { ClientOverview } from "@/lib/clients";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { scrollToElement } from "@/lib/smooth-scroll";
import { isApproved, PROJECT_STATUSES, statusLabelOf, type ClientProject, type ProjectStatus } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

type Filter = "all" | ProjectStatus;
type Sort = "newest" | "due" | "client";
export type AdminList = "projects" | "clients";

const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (p: ClientProject) => p.status !== "delivered" && !!p.dueDate && p.dueDate.slice(0, 10) < today();
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The admin dashboard - one page in its own interface (`AdminShell`), across the whole window: the status card on top
 * (`InboxCard`: a missing payment first, else the client comments waiting for a reply, with every alert and the quick
 * actions on its right), the numbers, and then the lists - **Projects** or **Clients**, switched by a chip. Projects: a
 * search, a stage filter and a sort, then every client's project as a row - client, stage, due date, length, files,
 * comments - and a click opens it full screen with everything the client filled in and the controls to move it along.
 * Clients (`team-clients-view.tsx`): every client - profile, private notes, invoices, video time history, projects.
 */
export function TeamDashboardView({
  projects: initial,
  clients,
  sample,
  initialProjectId = null,
  initialList = "projects",
}: {
  projects: ClientProject[];
  clients: ClientOverview[] | null;
  sample: boolean;
  /** `?project=<id>` - a team alert email's button: the dashboard opens on that project's window. */
  initialProjectId?: string | null;
  /** `?view=clients` - which list shows first. */
  initialList?: AdminList;
}) {
  const { t } = useLanguage();
  const d = t.team;
  const a = d.admin;
  const statusLabels = t.account.projectsPage.status as Record<ProjectStatus, string>;
  const [projects, setProjects] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(initialProjectId);
  // Opened from a Reply button: the window opens on its reply box.
  const [openFocus, setOpenFocus] = useState<"comments" | null>(null);
  const [openClientId, setOpenClientId] = useState<string | null>(null);
  const [list, setList] = useState<AdminList>(initialList);
  const listRef = useRef<HTMLElement>(null);

  // The list is in the address too, so a reload or a shared link opens it (`?view=clients`).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (list === "projects") url.searchParams.delete("view");
    else url.searchParams.set("view", list);
    url.searchParams.delete("project");
    window.history.replaceState(window.history.state, "", url);
  }, [list]);

  const counts = useMemo(() => {
    const c: Record<ProjectStatus, number> = { brief: 0, scripting: 0, production: 0, review: 0, delivered: 0 };
    for (const p of projects) c[p.status] += 1;
    return c;
  }, [projects]);
  const overdueList = useMemo(() => projects.filter(isOverdue), [projects]);
  const overdue = overdueList.length;
  const waiting = useMemo(() => projects.filter((p) => p.awaitingReply), [projects]);
  const missing = useMemo(() => (clients ?? []).filter(hasMissingPayment), [clients]);

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
  const openProject = (id: string, focus: "comments" | null = null) => {
    setOpenFocus(focus);
    setOpenId(id);
  };
  const openClient = (id: string) => {
    setList("clients");
    setOpenClientId(id);
  };
  const showList = (next: AdminList) => {
    setList(next);
    window.setTimeout(() => scrollToElement(listRef.current, { offset: 88 }), 60);
  };

  // Overdue reads amber, never red - red is kept for a missing payment.
  const stat = (label: string, value: number, tone?: "warn") => (
    <div className={cn(ACCOUNT_CARD, "p-5", tone === "warn" && value > 0 && "border-amber-300/35")}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className={cn("mt-2 font-heading text-4xl font-black", tone === "warn" && value > 0 ? "text-amber-200" : "text-white")}>{value}</p>
    </div>
  );

  return (
    <AdminShell>
      {sample ? (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff8a1f]/40 bg-[#ff7a1a]/10 px-4 py-1.5 text-sm text-[#ffb066]">
          <span className="size-1.5 rounded-full bg-[#ff8a1f]" aria-hidden />
          {d.sampleBanner}
        </p>
      ) : null}

      <h1 className="font-heading text-[clamp(30px,4vw,56px)] leading-[0.98] font-black uppercase text-balance">{a.dashboardTitle}</h1>
      <p className="mt-2 text-white/55">{a.dashboardLead}</p>

      <div className="mt-8">
        <InboxCard
          waiting={waiting}
          missing={missing}
          overdue={overdueList}
          inReview={counts.review}
          onReply={(id) => openProject(id, "comments")}
          onOpenProject={(id) => openProject(id)}
          onOpenClient={openClient}
          onShow={showList}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stat(d.stats.total, projects.length)}
        {stat(d.stats.new, counts.brief)}
        {stat(d.stats.inWork, counts.scripting + counts.production)}
        {stat(d.stats.inReview, counts.review)}
        {stat(d.stats.delivered, counts.delivered)}
        {stat(d.stats.overdue, overdue, "warn")}
      </div>

      {/* The lists: Projects or Clients, switched by the chip (the light slides to the chosen one). */}
      <section ref={listRef} className="mt-10 scroll-mt-24">
        <div className="inline-flex gap-1 rounded-full border border-white/12 bg-black/40 p-1" role="tablist" aria-label={a.lists.label}>
          {(["projects", "clients"] as const).map((key) => {
            const on = list === key;
            const Icon = key === "projects" ? IconFolderFilled : IconUsersGroup;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setList(key)}
                className={cn(
                  "group relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-bold transition-[color,transform] duration-200 ease-out hover:-translate-y-px",
                  on ? "text-white" : "text-white/60 hover:text-white",
                )}
              >
                {on ? (
                  <motion.span
                    layoutId="admin-list-light"
                    className="absolute inset-0 rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] shadow-[0_8px_22px_-8px_rgba(255,106,20,0.9)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon className="relative size-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
                <span className="relative">{a.lists[key]}</span>
                <span className="relative text-xs opacity-70">{key === "projects" ? projects.length : (clients?.length ?? 0)}</span>
              </button>
            );
          })}
        </div>

        {list === "clients" ? (
          <motion.div key="clients" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            <TeamClientsView
              clients={clients}
              projects={projects}
              sample={sample}
              onOpenProject={(id) => openProject(id)}
              openClientId={openClientId}
              onOpenClient={setOpenClientId}
            />
          </motion.div>
        ) : (
          <motion.div key="projects" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
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
        <PillSelect className="ml-auto" value={sort} onChange={setSort} label={d.sortBy} options={(["newest", "due", "client"] as Sort[]).map((key) => ({ value: key, label: d.sort[key] }))} />
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
                    onClick={() => openProject(p.id)}
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
                      <StatusChip status={p.status} label={statusLabelOf(p, statusLabels)} approved={isApproved(p)} />
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
          </motion.div>
        )}
      </section>

      <TeamProjectPopup
        project={selected}
        sample={sample}
        statusLabels={statusLabels}
        focus={openFocus}
        onClose={() => {
          setOpenId(null);
          setOpenFocus(null);
        }}
        onSaved={(next) => setProjects((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
      />
    </AdminShell>
  );
}
