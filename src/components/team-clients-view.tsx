"use client";

import { PillSelect } from "@/components/ui/pill-select";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { IconCheck, IconChevronRight, IconLoader2, IconMail, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { ACCOUNT_CARD } from "@/components/account-shell";
import { StatusChip } from "@/components/project-status-chip";
import { TeamCreditAdjuster } from "@/components/team-credit-adjuster";
import { TeamClientInvoices } from "@/components/team-client-invoices";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z } from "@/lib/modal-layer";
import { isApproved, statusLabelOf, type ClientProject, type ProjectStatus } from "@/lib/client-projects";
import {
  clientLabel,
  ledgerFromRow,
  noteFromRow,
  profilePatch,
  SAMPLE_LEDGER,
  SAMPLE_NOTES,
  type ClientNote,
  type ClientOverview,
  type LedgerRow,
  type ProfileFields,
} from "@/lib/clients";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Sort = "activity" | "name" | "balance";

const date = (iso: string | null) => (iso ? formatDateDisplay(iso.slice(0, 10)) : "-");

/**
 * The team dashboard's Clients tab: every client (`client_overview` - supabase/profiles.sql) with their video time,
 * plan, projects and last activity, searchable and sortable; a click opens the client's window (`TeamClientPopup`).
 * `clients` is `null` when the view is missing, and the tab then says which SQL file to run.
 */
export function TeamClientsView({
  clients: initial,
  projects,
  sample,
  onOpenProject,
  openClientId,
  onOpenClient,
}: {
  clients: ClientOverview[] | null;
  projects: ClientProject[];
  sample: boolean;
  onOpenProject: (id: string) => void;
  /** Which client's window is open, when the page drives it (the admin dashboard's payment alert); the view's own otherwise. */
  openClientId?: string | null;
  onOpenClient?: (id: string | null) => void;
}) {
  const { t } = useLanguage();
  const c = t.team.clients;
  const planNames = t.plans.tiers as Record<string, { name: string }>;
  const [clients, setClients] = useState(initial ?? []);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("activity");
  const [ownOpenId, setOwnOpenId] = useState<string | null>(null);
  const openId = openClientId !== undefined ? openClientId : ownOpenId;
  const setOpenId = onOpenClient ?? setOwnOpenId;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = clients.filter((x) => !q || [x.fullName, x.email, x.company].some((v) => v?.toLowerCase().includes(q)));
    const by = {
      activity: (a: ClientOverview, b: ClientOverview) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""),
      name: (a: ClientOverview, b: ClientOverview) => clientLabel(a, "").localeCompare(clientLabel(b, "")),
      balance: (a: ClientOverview, b: ClientOverview) => b.balanceSeconds - a.balanceSeconds,
    }[sort];
    return [...list].sort(by);
  }, [clients, query, sort]);

  if (initial === null) {
    return <p className={cn(ACCOUNT_CARD, "mt-8 p-10 text-center text-white/60")}>{c.setupNeeded}</p>;
  }

  const selected = clients.find((x) => x.id === openId) ?? null;
  const cols = "lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_9rem_8rem_6rem_8rem_2rem]";

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1 md:max-w-sm">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-white/40" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search} aria-label={c.search} className="h-11 rounded-full border-white/12 bg-black/30 pl-10" />
        </div>
        <PillSelect className="ml-auto" value={sort} onChange={setSort} label={c.sortBy} options={(["activity", "name", "balance"] as Sort[]).map((key) => ({ value: key, label: c.sort[key] }))} />
      </div>

      <section className={cn(ACCOUNT_CARD, "mt-6 overflow-hidden")}>
        <div className={cn("hidden items-center gap-4 border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:grid", cols)}>
          <span>{c.cols.client}</span>
          <span>{c.cols.company}</span>
          <span>{c.cols.balance}</span>
          <span>{c.cols.plan}</span>
          <span>{c.cols.projects}</span>
          <span>{c.cols.activity}</span>
          <span />
        </div>
        {shown.length === 0 ? (
          <p className="p-10 text-center text-white/50">{clients.length === 0 ? c.empty : c.noMatch}</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {shown.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(x.id)}
                  className={cn(
                    "group grid w-full cursor-pointer grid-cols-1 items-center gap-x-4 gap-y-1.5 px-5 py-4 text-left transition-colors duration-200 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none",
                    cols
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold transition-colors duration-200 group-hover:text-[#ff8a1f]">{clientLabel(x, c.unnamed)}</span>
                    <span className="block truncate text-xs text-white/45">{x.email}</span>
                  </span>
                  <span className="truncate text-sm text-white/70">{x.company ?? "-"}</span>
                  <span className={cn("text-sm font-semibold", x.balanceSeconds > 0 ? "text-white" : "text-white/40")}>{formatVideoTime(x.balanceSeconds)}</span>
                  <span className="text-sm text-white/70">
                    {x.planKey ? planNames[x.planKey]?.name ?? x.planKey : <span className="text-white/35">{c.noPlan}</span>}
                    {x.subscriptionStatus && x.subscriptionStatus !== "active" ? (
                      <span className="block text-xs text-[#ffb066]">{c.subscription[x.subscriptionStatus] ?? x.subscriptionStatus}</span>
                    ) : null}
                  </span>
                  <span className="text-sm text-white/70">
                    {x.projectCount}
                    {x.openProjects ? <span className="text-white/40"> · {x.openProjects} {c.open}</span> : null}
                  </span>
                  <span className="text-sm text-white/55">{date(x.lastActivity)}</span>
                  <IconChevronRight className="hidden size-5 text-white/30 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#ff8a1f] lg:block" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TeamClientPopup
        client={selected}
        projects={selected ? projects.filter((p) => p.userId === selected.id) : []}
        sample={sample}
        onClose={() => setOpenId(null)}
        onChange={(next) => setClients((prev) => prev.map((x) => (x.id === next.id ? next : x)))}
        onOpenProject={(id) => {
          setOpenId(null);
          onOpenProject(id);
        }}
      />
    </>
  );
}

function SideTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{children}</h3>;
}

/** One client, full screen: profile + facts on the left; private notes, invoices (bill a custom quote), video time history (+ adjust) and projects on the right. */
function TeamClientPopup({
  client,
  projects,
  sample,
  onClose,
  onChange,
  onOpenProject,
}: {
  client: ClientOverview | null;
  projects: ClientProject[];
  sample: boolean;
  onClose: () => void;
  onChange: (client: ClientOverview) => void;
  onOpenProject: (id: string) => void;
}) {
  return (
    <DialogPrimitive.Root open={client !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={cn("fixed inset-0 bg-black/80 backdrop-blur-md duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", MODAL_BACKDROP_Z)} />
        <DialogPrimitive.Popup
          data-lenis-prevent
          className={cn(
            "fixed inset-0 flex flex-col overflow-y-auto bg-[#0c0d10] text-white outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98] lg:flex-row lg:overflow-hidden",
            MODAL_CONTENT_Z
          )}
        >
          {client ? <ClientBody key={client.id} client={client} projects={projects} sample={sample} onChange={onChange} onOpenProject={onOpenProject} /> : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ClientBody({
  client,
  projects,
  sample,
  onChange,
  onOpenProject,
}: {
  client: ClientOverview;
  projects: ClientProject[];
  sample: boolean;
  onChange: (client: ClientOverview) => void;
  onOpenProject: (id: string) => void;
}) {
  const { t } = useLanguage();
  const c = t.team.clients;
  const statusLabels = t.account.projectsPage.status as Record<ProjectStatus, string>;
  const planNames = t.plans.tiers as Record<string, { name: string }>;

  // The profile form.
  const initialFields: ProfileFields = { fullName: client.fullName ?? "", company: client.company ?? "", phone: client.phone ?? "", country: client.country ?? "" };
  const [fields, setFields] = useState(initialFields);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const dirty = (Object.keys(fields) as (keyof ProfileFields)[]).some((k) => fields[k].trim() !== initialFields[k]);

  // Notes and the ledger, loaded when the window opens (the team reads every client's - RLS).
  const [notes, setNotes] = useState<ClientNote[] | null>(sample ? (SAMPLE_NOTES[client.id] ?? []) : null);
  const [ledger, setLedger] = useState<LedgerRow[] | null>(sample ? (SAMPLE_LEDGER[client.id] ?? []) : null);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const [noteMsg, setNoteMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sample) return;
    let alive = true;
    const supabase = createClient();
    void supabase
      .from("client_notes")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => alive && setNotes((data ?? []).map((r) => noteFromRow(r as Record<string, unknown>))));
    void supabase
      .from("credit_ledger")
      .select("*")
      .eq("user_id", client.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => alive && setLedger((data ?? []).map((r) => ledgerFromRow(r as Record<string, unknown>))));
    return () => {
      alive = false;
    };
  }, [sample, client.id]);

  async function saveProfile() {
    if (!dirty || saving) return;
    setSaving(true);
    setProfileMsg(null);
    const patch = profilePatch(fields);
    if (!sample) {
      const { error } = await createClient().from("profiles").update(patch).eq("id", client.id);
      if (error) {
        setProfileMsg(c.saveError);
        setSaving(false);
        return;
      }
    }
    onChange({ ...client, fullName: patch.full_name, company: patch.company, phone: patch.phone, country: patch.country });
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  async function addNote() {
    const body = note.trim();
    if (!body || posting) return;
    setPosting(true);
    setNoteMsg(null);
    let row: ClientNote = { id: `local-${Date.now()}`, authorName: null, body, createdAt: new Date().toISOString() };
    if (!sample) {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const meta = (auth.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
      const authorName = meta.full_name || meta.name || auth.user?.email?.split("@")[0] || null;
      const { data, error } = await supabase
        .from("client_notes")
        .insert({ client_id: client.id, author_id: auth.user?.id, author_name: authorName, body })
        .select("*")
        .single();
      if (error || !data) {
        setNoteMsg(c.noteError);
        setPosting(false);
        return;
      }
      row = noteFromRow(data as Record<string, unknown>);
    }
    setNotes((prev) => [row, ...(prev ?? [])]);
    setNote("");
    setPosting(false);
  }

  async function deleteNote(id: string) {
    if (!sample) {
      const { error } = await createClient().from("client_notes").delete().eq("id", id);
      if (error) {
        setNoteMsg(c.noteError);
        return;
      }
    }
    setNotes((prev) => (prev ?? []).filter((n) => n.id !== id));
  }

  const field = "h-11 border-white/12 bg-black/30";
  const label = "mb-1.5 block text-xs font-semibold text-white/55";

  return (
    <>
      <DialogPrimitive.Close
        aria-label={t.account.projectsPage.close}
        className={cn("absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/85 backdrop-blur-md transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/80", MODAL_CONTROL_Z)}
      >
        <IconX className="size-[18px]" aria-hidden />
      </DialogPrimitive.Close>

      {/* Who they are. */}
      <aside className="flex shrink-0 flex-col gap-6 overflow-y-auto border-b border-white/10 bg-[linear-gradient(180deg,#17181c,#101114)] p-6 lg:w-[24rem] lg:border-r lg:border-b-0 xl:w-[27rem] xl:p-8">
        <div className="pr-12 lg:pr-0">
          <DialogPrimitive.Title className="font-heading text-[clamp(22px,2.2vw,30px)] leading-[1.02] font-black uppercase text-[#ff8a1f]">{clientLabel(client, c.unnamed)}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{c.popupDescription}</DialogPrimitive.Description>
          {client.email ? (
            <a href={`mailto:${client.email}`} className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors duration-200 hover:text-[#ff8a1f]">
              <IconMail className="size-4" aria-hidden />
              {client.email}
            </a>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-2.5 text-sm">
          {[
            [t.team.credits.balance, formatVideoTime(client.balanceSeconds)],
            [c.plan, client.planKey ? (planNames[client.planKey]?.name ?? client.planKey) : c.noPlan],
            [c.memberSince, date(client.createdAt)],
            [c.lastActivity, date(client.lastActivity)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <dt className="text-xs text-white/45">{k}</dt>
              <dd className="mt-0.5 font-semibold break-words">{v}</dd>
            </div>
          ))}
        </dl>

        <section>
          <SideTitle>{c.profileTitle}</SideTitle>
          <p className="mt-1.5 text-xs text-white/45">{c.profileHint}</p>
          <div className="mt-4 grid gap-3">
            {(["fullName", "company", "phone", "country"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={`client-${k}`} className={label}>
                  {c.fields[k === "fullName" ? "name" : k]}
                </label>
                <Input id={`client-${k}`} value={fields[k]} onChange={(e) => setFields((f) => ({ ...f, [k]: e.target.value }))} className={field} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={!dirty || saving}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-5 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {saving ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : null}
              {c.save}
            </button>
            {saved ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                <IconCheck className="size-4" stroke={3} aria-hidden />
                {c.saved}
              </span>
            ) : null}
          </div>
          {profileMsg ? <p role="alert" className="mt-2 text-sm text-[#ffb066]">{profileMsg}</p> : null}
        </section>
      </aside>

      {/* What we know and do. */}
      <section className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 lg:p-8 xl:p-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <div>
            <SideTitle>{c.notesTitle}</SideTitle>
            <p className="mt-1.5 mb-4 text-sm text-white/50">{c.notesHint}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder={c.notePlaceholder}
              aria-label={c.notePlaceholder}
              className="w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/30 focus:border-[#ff8a1f]/70 focus:shadow-[0_0_0_3px_rgba(255,138,31,0.15)]"
            />
            <button
              type="button"
              onClick={() => void addNote()}
              disabled={!note.trim() || posting}
              className="mt-2 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#ff8a1f]/55 px-5 text-sm font-semibold text-[#ffb066] transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#ff7a1a]/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              {posting ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : null}
              {c.addNote}
            </button>
            {noteMsg ? <p role="alert" className="mt-2 text-sm text-[#ffb066]">{noteMsg}</p> : null}
            <ul className="mt-5 flex flex-col gap-2.5">
              {notes === null ? (
                <li className="text-sm text-white/45">{c.loading}</li>
              ) : notes.length === 0 ? (
                <li className="text-sm text-white/45">{c.noNotes}</li>
              ) : (
                notes.map((n) => (
                  <li key={n.id} className="group flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-line text-white/85">{n.body}</p>
                      <p className="mt-1.5 text-xs text-white/40">
                        {n.authorName ? `${n.authorName} · ` : ""}
                        {date(n.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteNote(n.id)}
                      aria-label={c.deleteNote}
                      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/40 transition-[transform,background-color,color] duration-200 ease-out hover:scale-105 hover:bg-white/10 hover:text-white"
                    >
                      <IconTrash className="size-4" aria-hidden />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <TeamClientInvoices userId={client.id} sample={sample} />

          <div>
            <SideTitle>{c.historyTitle}</SideTitle>
            <p className="mt-1.5 text-sm text-white/50">{c.historyHint}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <TeamCreditAdjuster
                userId={client.id}
                sample={sample}
                onApplied={(secs, row) => {
                  onChange({ ...client, balanceSeconds: client.balanceSeconds + secs });
                  setLedger((prev) => [{ id: row.id, seconds: secs, kind: row.kind, planKey: null, note: row.note, projectId: null, createdAt: row.createdAt }, ...(prev ?? [])]);
                }}
              />
            </div>
            <ul className="mt-4 divide-y divide-white/8 rounded-2xl border border-white/10">
              {ledger === null ? (
                <li className="p-4 text-sm text-white/45">{c.loading}</li>
              ) : ledger.length === 0 ? (
                <li className="p-4 text-sm text-white/45">{c.noHistory}</li>
              ) : (
                ledger.map((l) => (
                  <li key={l.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                    <span className="w-24 shrink-0 text-white/45">{date(l.createdAt)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold text-white/85">{c.kinds[l.kind] ?? l.kind}</span>
                      {l.planKey ? <span className="text-white/45"> · {planNames[l.planKey]?.name ?? l.planKey}</span> : null}
                      {l.note ? <span className="block truncate text-xs text-white/45">{l.note}</span> : null}
                    </span>
                    <span className={cn("shrink-0 font-semibold tabular-nums", l.seconds >= 0 ? "text-emerald-300" : "text-[#ffb066]")}>
                      {l.seconds >= 0 ? "+" : "−"}
                      {formatVideoTime(Math.abs(l.seconds))}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <SideTitle>{c.projectsTitle}</SideTitle>
            {projects.length === 0 ? (
              <p className="mt-3 text-sm text-white/45">{c.noProjects}</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2.5">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onOpenProject(p.id)}
                      className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/45 hover:bg-white/[0.06]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold transition-colors duration-200 group-hover:text-[#ff8a1f]">{p.title}</span>
                        <span className="text-xs text-white/45">{date(p.createdAt)}</span>
                      </span>
                      <StatusChip status={p.status} label={statusLabelOf(p, statusLabels)} approved={isApproved(p)} />
                      <IconChevronRight className="size-5 text-white/30 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#ff8a1f]" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
