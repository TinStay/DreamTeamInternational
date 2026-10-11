"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { notifyProject } from "@/lib/notify-project";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCalendarEventFilled,
  IconCircleCheckFilled,
  IconClockFilled,
  IconCreditCardFilled,
  IconHourglassFilled,
  IconLayersSubtract,
  IconPlus,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FORMAT_ICONS } from "@/components/format-icon";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { pricingPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { notifyCreditsChanged, useCredits } from "@/lib/supabase/use-credits";
import {
  CHANGE_KINDS,
  CHANGE_PRICES,
  DURATION_STEP,
  FORMAT_OPTIONS,
  TOPUP_CENTS_PER_SECOND,
  canRequest,
  deadlineCost,
  formatsOf,
  isOpen,
  maxExtraSeconds,
  minDeadline,
  requestErrorOf,
  requestFromRow,
  splitCost,
  type ChangeKind,
  type FormatKey,
  type ProjectRequest,
} from "@/lib/project-changes";
import type { ClientProject } from "@/lib/client-projects";
import { cn } from "@/lib/utils";

const PEARL = "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)]";
const EASE = [0.22, 1, 0.36, 1] as const;
const SAMPLE_CREDITS = { balance: 45, added: 0, planKey: null };

const KIND_ICON: Record<ChangeKind, ReactNode> = {
  deadline: <IconCalendarEventFilled className="size-full" aria-hidden />,
  duration: <IconClockFilled className="size-full" aria-hidden />,
  format: <IconLayersSubtract className="size-full" stroke={2.2} aria-hidden />,
  revision: <IconRefresh className="size-full" stroke={2.4} aria-hidden />,
};

/** "$59.50" for cents with a remainder, "$150" for whole dollars. */
const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/**
 * "Change this project", at the foot of the project page: while a project is being made the client can ask to move its
 * deadline, make it longer, add a format or add a revision - each a request with its own window that shows what changes
 * and what it costs. The window can also be opened from the drawer's facts (`open` / `onOpenChange`, owned by the page).
 * The rules and the prices are `lib/project-changes.ts`; the database works the price out again and refuses anything off
 * the rules (`request_project_change()`, supabase/changes.sql). Seconds come from the video time; seconds the client
 * doesn't have are bought with the request at the one-time price; a request that costs money goes through Stripe
 * (`/api/project-requests/checkout`) before the team sees it. Below the cards, the project's requests and where each stands.
 */
export function ProjectChanges({ project, sample = false, open, onOpenChange }: { project: ClientProject; sample?: boolean; open: ChangeKind | null; onOpenChange: (kind: ChangeKind | null) => void }) {
  const { t } = useLanguage();
  const c = t.account.projectsPage.changes;
  const credits = useCredits(!sample, sample ? SAMPLE_CREDITS : undefined);
  const balance = credits?.balance ?? 0;

  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (sample) return;
    const { data } = await createClient().from("project_requests").select("*").eq("project_id", project.id).order("created_at", { ascending: false });
    setRequests((data ?? []).map((r) => requestFromRow(r as Record<string, unknown>)));
  }, [project.id, sample]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
      // Back from Stripe: say how the payment went, then drop the flag from the address.
      const flag = new URLSearchParams(window.location.search).get("request");
      if (flag === "paid" || flag === "cancelled") {
        setNotice(flag === "paid" ? c.paid : c.payCancelled);
        const url = new URL(window.location.href);
        url.searchParams.delete("request");
        window.history.replaceState(null, "", url);
        // The webhook may land a moment after the redirect.
        if (flag === "paid") window.setTimeout(() => void load(), 3000);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [load, c.paid, c.payCancelled]);

  const closed = Boolean(project.approvedAt) || project.status === "delivered";
  const openOf = (kind: ChangeKind) => requests.find((r) => r.kind === kind && isOpen(r));

  async function pay(requestId: string): Promise<boolean> {
    const res = await fetch("/api/project-requests/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
    const data = (await res.json().catch(() => ({}))) as { url?: string };
    if (!res.ok || !data.url) return false;
    window.location.assign(data.url);
    return true;
  }

  /** Sends a request; returns an error message, or null when it went through. */
  async function send(kind: ChangeKind, details: Record<string, unknown>, preview: { details: Record<string, unknown>; costSeconds: number; costCents: number }): Promise<string | null> {
    if (sample) {
      setRequests((prev) => [{ id: `sample-${Date.now()}`, projectId: project.id, kind, status: preview.costCents > 0 ? "awaiting_payment" : "requested", paidAt: null, teamNote: null, createdAt: new Date().toISOString(), ...preview }, ...prev]);
      setNotice(c.sampleNote);
      return null;
    }
    const { data, error } = await createClient().rpc("request_project_change", { p_project: project.id, p_kind: kind, p_details: details });
    if (error || !data) return c.errors[requestErrorOf(error?.message)];
    const req = requestFromRow(data as Record<string, unknown>);
    setRequests((prev) => [req, ...prev.filter((r) => !(r.kind === kind && r.status === "awaiting_payment"))]);
    if (req.costSeconds > 0) notifyCreditsChanged();
    if (req.status === "awaiting_payment") return (await pay(req.id)) ? null : c.errors.generic;
    notifyProject(project.id, "change_request", { requestId: req.id });
    setNotice(c.sent);
    return null;
  }

  async function withdraw(r: ProjectRequest) {
    setRowBusy(r.id);
    if (sample) {
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "cancelled" } : x)));
    } else {
      const { data, error } = await createClient().rpc("cancel_project_request", { p_id: r.id });
      if (!error && data) {
        setRequests((prev) => prev.map((x) => (x.id === r.id ? requestFromRow(data as Record<string, unknown>) : x)));
        if (r.costSeconds > 0) notifyCreditsChanged();
      } else setNotice(c.errors.generic);
    }
    setRowBusy(null);
  }

  async function payNow(r: ProjectRequest) {
    if (sample) return;
    setRowBusy(r.id);
    if (!(await pay(r.id))) {
      setNotice(c.errors.generic);
      setRowBusy(null);
    }
  }

  const summary = (r: ProjectRequest) => {
    const d = r.details;
    if (r.kind === "deadline") return c.summary.deadline.replace("{to}", typeof d.to === "string" ? formatDateDisplay(d.to.slice(0, 10)) : "-");
    if (r.kind === "duration") return c.summary.duration.replace("{extra}", formatVideoTime(Number(d.extra) || r.costSeconds));
    if (r.kind === "format") return c.summary.format.replace("{format}", String(d.format ?? ""));
    return c.summary.revision;
  };
  const costOf = (r: ProjectRequest) =>
    r.costCents > 0 && r.costSeconds > 0
      ? c.costMixed.replace("{n}", formatVideoTime(r.costSeconds)).replace("{amount}", money(r.costCents))
      : r.costCents > 0
        ? money(r.costCents)
        : r.costSeconds > 0
          ? c.costSeconds.replace("{n}", formatVideoTime(r.costSeconds))
          : c.free;

  return (
    <section aria-labelledby="project-changes" className="flex flex-col gap-4">
      <h2 id="project-changes" className="flex items-center gap-2.5 font-heading text-lg font-black uppercase">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#ff7a1a]/12 text-[#ff8a1f]">
          <IconPlus className="size-[17px]" stroke={2.6} aria-hidden />
        </span>
        {c.title}
      </h2>

      {closed ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55">{c.closed}</p>
      ) : (
        <>
          <p className="-mt-1 max-w-[70ch] text-sm leading-relaxed text-white/55">{c.intro}</p>
          <div className="grid gap-2.5 @xl:grid-cols-2 @5xl:grid-cols-4">
            {CHANGE_KINDS.map((kind, i) => {
              const allowed = canRequest(project, kind);
              const pending = openOf(kind);
              const k = c.kinds[kind];
              return (
                <motion.button
                  key={kind}
                  type="button"
                  disabled={!allowed || Boolean(pending)}
                  onClick={() => onOpenChange(kind)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                  className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/50 hover:bg-white/[0.05] hover:shadow-[0_16px_34px_-22px_rgba(255,106,20,0.7)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-white/10 disabled:hover:shadow-none"
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg p-2 text-white transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6", PEARL)}>{KIND_ICON[kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{k.title}</span>
                    <span className="block truncate text-[11px] text-white/50">{pending ? c.open : allowed ? k.line : c.unavailable}</span>
                  </span>
                  {pending ? <IconHourglassFilled className="size-4 shrink-0 text-[#ffb066]" aria-hidden /> : <IconArrowRight className="size-4 shrink-0 text-white/30 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#ff8a1f]" aria-hidden />}
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {notice ? (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start justify-between gap-3 rounded-xl border border-[#ff8a1f]/35 bg-[#ff7a1a]/[0.08] px-4 py-3 text-sm leading-relaxed text-white/85"
          >
            {notice}
            <button type="button" onClick={() => setNotice(null)} aria-label={c.close} className="cursor-pointer text-white/50 transition-colors hover:text-white">
              <IconX className="size-4" aria-hidden />
            </button>
          </motion.p>
        ) : null}
      </AnimatePresence>

      {requests.length > 0 ? (
        <div>
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{c.listTitle}</h3>
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <motion.li key={r.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ff7a1a]/12 p-1.5 text-[#ff8a1f]">{KIND_ICON[r.kind]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{summary(r)}</span>
                  <span className="block text-xs text-white/45">
                    {formatDateDisplay(r.createdAt.slice(0, 10))} · {costOf(r)}
                    {r.teamNote ? ` · ${r.teamNote}` : ""}
                  </span>
                </span>
                <RequestStatus status={r.status} label={c.status[r.status]} />
                {r.status === "awaiting_payment" ? (
                  <button type="button" disabled={rowBusy === r.id || sample} onClick={() => void payNow(r)} className={cn("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-bold text-white transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50", PEARL)}>
                    <IconCreditCardFilled className="size-3.5" aria-hidden />
                    {c.payNow.replace("{amount}", money(r.costCents))}
                  </button>
                ) : null}
                {r.status === "awaiting_payment" || (r.status === "requested" && !r.paidAt && r.costCents === 0) ? (
                  <button type="button" disabled={rowBusy === r.id} onClick={() => void withdraw(r)} className="inline-flex h-8 cursor-pointer items-center rounded-full border border-white/15 px-3 text-xs font-semibold text-white/70 transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {c.withdraw}
                  </button>
                ) : null}
              </motion.li>
            ))}
          </ul>
        </div>
      ) : null}

      <ChangeDialog kind={open && canRequest(project, open) && !openOf(open) ? open : null} project={project} balance={balance} onClose={() => onOpenChange(null)} onSend={send} />
    </section>
  );
}

function RequestStatus({ status, label }: { status: ProjectRequest["status"]; label: string }) {
  const tone =
    status === "approved"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : status === "declined" || status === "cancelled"
        ? "border-white/15 bg-white/5 text-white/50"
        : "border-[#ff8a1f]/45 bg-[#ff7a1a]/10 text-[#ffb066]";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]", tone)}>
      {status === "approved" ? <IconCircleCheckFilled className="size-3.5" aria-hidden /> : <span className={cn("size-1.5 rounded-full", status === "declined" || status === "cancelled" ? "bg-white/40" : "animate-pulse bg-[#ff8a1f]")} aria-hidden />}
      {label}
    </span>
  );
}

type SendFn = (kind: ChangeKind, details: Record<string, unknown>, preview: { details: Record<string, unknown>; costSeconds: number; costCents: number }) => Promise<string | null>;

/** The window for one kind of change: a picture of what changes, the choice, what it costs, and Send / Pay. */
function ChangeDialog({ kind, project, balance, onClose, onSend }: { kind: ChangeKind | null; project: ClientProject; balance: number; onClose: () => void; onSend: SendFn }) {
  const { t } = useLanguage();
  const c = t.account.projectsPage.changes;
  return (
    <Dialog open={kind !== null} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent
        showCloseButton={false}
        data-lenis-prevent
        className="max-h-[calc(100dvh-2rem)] w-[min(94vw,36rem)] max-w-none gap-0 overflow-y-auto rounded-3xl border border-white/10 bg-[linear-gradient(170deg,#2a1a10_0%,#141518_45%)] p-0 text-[#f4f4f5] ring-0 sm:max-w-none"
      >
        <button type="button" onClick={onClose} aria-label={c.close} className="absolute top-4 right-4 z-[1] flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/85 transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-black/70">
          <IconX className="size-[18px]" aria-hidden />
        </button>
        {kind ? <ChangeBody key={kind} kind={kind} project={project} balance={balance} onClose={onClose} onSend={onSend} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** A format's frame drawn at its aspect ratio inside a `box`-pixel square, with its device icon. */
function Frame({ ratio, box, picked, icon }: { ratio: [number, number]; box: number; picked: boolean; icon: ReactNode }) {
  const [w, h] = ratio;
  return (
    <motion.span
      animate={picked ? { rotate: [0, -4, 4, 0] } : { rotate: 0 }}
      transition={{ duration: 0.5 }}
      style={{ width: w >= h ? box : (box * w) / h, height: h >= w ? box : (box * h) / w }}
      className={cn("flex items-center justify-center rounded-md border-2 transition-colors", picked ? "border-[#ff8a1f] bg-[#ff7a1a]/20 text-[#ffb066]" : "border-white/35 text-white/60")}
    >
      {icon}
    </motion.span>
  );
}

function ChangeBody({ kind, project, balance, onClose, onSend }: { kind: ChangeKind; project: ClientProject; balance: number; onClose: () => void; onSend: SendFn }) {
  const { t, language } = useLanguage();
  const c = t.account.projectsPage.changes;
  const current = project.durationSeconds ?? 0;
  const soonest = minDeadline();
  const [date, setDate] = useState(() => (project.dueDate && project.dueDate.slice(0, 10) >= soonest ? project.dueDate.slice(0, 10) : soonest));
  const maxExtra = maxExtraSeconds(current, balance);
  const [extra, setExtra] = useState(Math.min(DURATION_STEP * 2, maxExtra) || DURATION_STEP);
  const owned = formatsOf(project.format);
  const [format, setFormat] = useState<FormatKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What this choice costs, and whether it can be sent.
  let costCents = 0;
  let costSeconds = 0;
  let bought = 0;
  let ready = true;
  let details: Record<string, unknown> = {};
  let visual: ReactNode = null;
  let control: ReactNode = null;
  let title = "";
  let text = "";

  if (kind === "deadline") {
    const d = c.deadline;
    const { daysEarlier, cents } = deadlineCost(project.dueDate, date);
    const same = project.dueDate?.slice(0, 10) === date;
    costCents = cents;
    ready = !same && date >= soonest;
    details = { date };
    title = d.title;
    text = d.text;
    visual = (
      <div className="flex items-center justify-center gap-3">
        <DateCard label={d.current} value={project.dueDate ? formatDateDisplay(project.dueDate.slice(0, 10)) : d.none} muted />
        <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="text-[#ff8a1f]">
          <IconArrowRight className="size-6" aria-hidden />
        </motion.span>
        <DateCard label={d.next} value={formatDateDisplay(date)} highlight={daysEarlier > 0 ? "orange" : "green"} />
      </div>
    );
    control = (
      <>
        <label htmlFor="change-deadline" className="block text-sm font-semibold">
          {d.dateLabel}
        </label>
        <input
          id="change-deadline"
          type="date"
          value={date}
          min={soonest}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-white/15 bg-black/30 px-4 text-base text-white [color-scheme:dark] outline-none transition-colors hover:border-white/30 focus:border-[#ff8a1f]/70"
        />
        <p className="mt-2 text-xs text-white/45">{d.minNote.replace("{date}", formatDateDisplay(soonest))}</p>
        <motion.p key={`${daysEarlier}-${same}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-3 text-sm font-semibold", same ? "text-white/50" : daysEarlier > 0 ? "text-[#ffb066]" : "text-emerald-300")}>
          {same ? d.same : daysEarlier > 0 ? `${daysEarlier === 1 ? d.earlierOne : d.earlier.replace("{n}", String(daysEarlier))} · ${d.perDay.replace("{n}", String(daysEarlier))}` : d.later}
        </motion.p>
      </>
    );
  } else if (kind === "duration") {
    const d = c.duration;
    const split = splitCost(extra, balance);
    costSeconds = split.fromBalance;
    costCents = split.cents;
    bought = split.bought;
    ready = maxExtra >= DURATION_STEP && extra >= DURATION_STEP && extra <= maxExtra;
    details = { seconds: extra };
    title = d.title;
    text = d.text;
    const scale = Math.max(current + maxExtra, 1);
    const pct = (n: number) => `${(n / scale) * 100}%`;
    visual = (
      <div>
        <div className="relative h-14 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <motion.div initial={false} animate={{ width: pct(current) }} className={cn("absolute inset-y-0 left-0", PEARL)} />
          <motion.div
            initial={false}
            animate={{ left: pct(current), width: pct(split.fromBalance) }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,rgba(255,176,102,0.85)_0_8px,rgba(255,138,31,0.55)_8px_16px)] shadow-[0_0_24px_rgba(255,138,31,0.6)]"
          />
          <motion.div
            initial={false}
            animate={{ left: pct(current + split.fromBalance), width: pct(split.bought) }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,rgba(251,113,133,0.85)_0_8px,rgba(225,29,72,0.5)_8px_16px)] shadow-[0_0_24px_rgba(244,63,94,0.55)]"
          />
          {/* Where the video time runs out. */}
          {balance < maxExtra ? <span className="absolute inset-y-1 w-0.5 rounded-full bg-white/70" style={{ left: pct(current + Math.max(0, balance)) }} aria-hidden /> : null}
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-white/55">
          <span>
            {d.now}: <strong className="text-white">{formatVideoTime(current)}</strong>
          </span>
          <span>
            {d.after}: <strong className="text-[#ffb066]">{formatVideoTime(current + (ready ? extra : 0))}</strong>
          </span>
        </div>
        {split.bought > 0 ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#ff9a3c]" aria-hidden />
              {d.fromBalance}: {formatVideoTime(split.fromBalance)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-rose-400" aria-hidden />
              {d.bought}: {formatVideoTime(split.bought)}
            </span>
          </div>
        ) : null}
      </div>
    );
    control =
      maxExtra >= DURATION_STEP ? (
        <>
          <div className="flex items-center justify-between text-sm font-semibold">
            <label htmlFor="change-duration">{d.add}</label>
            <motion.span key={extra} initial={{ scale: 1.25, color: "#ffb066" }} animate={{ scale: 1, color: "#ffffff" }} className="font-heading text-2xl font-black">
              +{formatVideoTime(extra)}
            </motion.span>
          </div>
          <input
            id="change-duration"
            type="range"
            min={DURATION_STEP}
            max={maxExtra}
            step={DURATION_STEP}
            value={Math.min(extra, maxExtra)}
            onChange={(e) => setExtra(Number(e.target.value))}
            className="mt-3 w-full cursor-pointer accent-[#ff7a1a]"
          />
          <p className="mt-2 text-xs text-white/45">
            {d.balanceNote.replace("{balance}", formatVideoTime(Math.max(0, balance)))} · {d.maxNote}
          </p>
        </>
      ) : (
        <p className="rounded-xl border border-[#ff8a1f]/30 bg-[#ff7a1a]/[0.06] p-4 text-sm text-white/75">{d.noRoom}</p>
      );
  } else if (kind === "format") {
    const d = c.format;
    const split = splitCost(current, balance);
    costSeconds = split.fromBalance;
    costCents = format ? split.cents : 0;
    bought = format ? split.bought : 0;
    if (!format) costSeconds = 0;
    ready = Boolean(format) && current > 0;
    details = { format: FORMAT_OPTIONS.find((f) => f.key === format)?.label };
    title = d.title;
    text = d.text;
    const option = (f: (typeof FORMAT_OPTIONS)[number], i: number, big: boolean) => {
      const has = owned.includes(f.key);
      const picked = format === f.key;
      const Icon = FORMAT_ICONS[f.key];
      return (
        <motion.button
          key={f.key}
          type="button"
          role="radio"
          aria-checked={picked}
          disabled={has}
          onClick={() => setFormat(f.key)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, scale: picked ? 1.03 : 1 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 22 }}
          className={cn(
            "relative flex cursor-pointer flex-col items-center rounded-2xl border text-center transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#ff7a1a]/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/10",
            big ? "gap-2 p-4" : "gap-1.5 p-2.5",
            picked ? "border-[#ff8a1f] bg-[#ff7a1a]/12 shadow-[0_0_0_4px_rgba(255,122,26,0.15)]" : "border-white/10 bg-white/[0.03]"
          )}
        >
          <span className={cn("flex items-center justify-center", big ? "h-24" : "h-10")}>
            <Frame ratio={f.ratio} box={big ? 84 : 34} picked={picked} icon={<Icon className={big ? "size-6" : "size-3.5"} aria-hidden />} />
          </span>
          <span className={cn("font-semibold", big ? "text-base" : "text-xs")}>
            {d.names[f.key]} <span className="font-normal text-white/45">{f.label.split(" ")[0]}</span>
          </span>
          {big ? <span className="text-xs text-white/45">{d.uses[f.key]}</span> : null}
          {has ? <span className="absolute top-1.5 right-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">{d.included}</span> : null}
        </motion.button>
      );
    };
    control = (
      <div role="radiogroup" aria-label={d.pick}>
        <p className="mb-3 text-sm font-semibold">{d.pick}</p>
        <div className="grid grid-cols-2 gap-3">{FORMAT_OPTIONS.filter((f) => f.primary).map((f, i) => option(f, i, true))}</div>
        <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{d.more}</p>
        <div className="grid grid-cols-4 gap-2">{FORMAT_OPTIONS.filter((f) => !f.primary).map((f, i) => option(f, i + 2, false))}</div>
      </div>
    );
  } else {
    const d = c.revision;
    costCents = CHANGE_PRICES.extraRevisionCents;
    title = d.title;
    text = d.text;
    visual = (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: project.revisionsTotal }).map((_, i) => (
            <span key={i} className={cn("flex size-9 items-center justify-center rounded-full border text-sm font-bold", i < project.revisionsUsed ? cn("border-transparent text-white", PEARL) : "border-white/25 text-white/45")}>
              {i + 1}
            </span>
          ))}
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
            className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-[#ff8a1f] bg-[#ff7a1a]/15 text-sm font-black text-[#ffb066] shadow-[0_0_18px_rgba(255,138,31,0.5)]"
          >
            +1
          </motion.span>
        </div>
        <p className="text-xs text-white/55">
          {d.now.replace("{used}", String(project.revisionsUsed)).replace("{total}", String(project.revisionsTotal))} <IconArrowRight className="inline size-3" aria-hidden />{" "}
          <strong className="text-[#ffb066]">{d.after.replace("{total}", String(project.revisionsTotal + 1))}</strong>
        </p>
      </div>
    );
  }

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const err = await onSend(kind, details, { details, costSeconds, costCents });
    setBusy(false);
    if (err) setError(err);
    else if (costCents === 0) onClose();
  }

  const costLabel =
    costCents > 0 && costSeconds > 0
      ? c.costMixed.replace("{n}", formatVideoTime(costSeconds)).replace("{amount}", money(costCents))
      : costCents > 0
        ? money(costCents)
        : costSeconds > 0
          ? c.costSeconds.replace("{n}", formatVideoTime(costSeconds))
          : c.free;

  return (
    <div className="p-6 sm:p-8">
      <motion.span initial={{ scale: 0.6, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 240, damping: 16 }} className={cn("flex size-12 items-center justify-center rounded-2xl p-3 text-white shadow-[0_10px_26px_-10px_rgba(255,106,20,0.8)]", PEARL)}>
        {KIND_ICON[kind]}
      </motion.span>
      <DialogTitle className="mt-4 pr-12 font-heading text-2xl font-black uppercase">{title}</DialogTitle>
      <DialogDescription className="mt-2 text-sm leading-relaxed text-white/60">{text}</DialogDescription>

      {visual ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: EASE }} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          {visual}
        </motion.div>
      ) : null}
      {control ? <div className="mt-5">{control}</div> : null}

      {/* Not enough video time: the missing seconds are bought with the request - or the plan goes up. */}
      <AnimatePresence>
        {bought > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-5 rounded-2xl border border-rose-400/35 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(244,63,94,0.14),transparent_60%),rgba(255,255,255,0.02)] p-4">
              <p className="text-sm font-semibold text-rose-200">{c.duration.topupTitle.replace("{n}", formatVideoTime(bought))}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{c.duration.topupText.replace("{price}", money(TOPUP_CENTS_PER_SECOND))}</p>
              <Link
                href={`${pricingPath(language)}?for=business`}
                className="group mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/20 px-4 text-xs font-semibold text-white/85 transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff8a1f]/60 hover:bg-white/10"
              >
                {c.duration.upgrade}
                <IconArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* What it costs. */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5">
        <span className="text-sm text-white/55">{c.cost}</span>
        <span className="text-right">
          <motion.span key={costLabel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("block font-heading font-black", costCents > 0 && costSeconds > 0 ? "text-base" : "text-xl", costCents > 0 ? "text-[#ffb066]" : costSeconds > 0 ? "text-white" : "text-emerald-300")}>
            {costLabel}
          </motion.span>
          {costSeconds > 0 ? <span className="block text-xs text-white/45">{c.balanceAfter.replace("{balance}", formatVideoTime(Math.max(0, balance - costSeconds)))}</span> : null}
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-[#ffb066]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!ready || busy}
          className="group inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,1)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {costCents > 0 ? <IconCreditCardFilled className="size-[18px]" aria-hidden /> : null}
          {busy ? c.sending : costCents > 0 ? c.pay.replace("{amount}", money(costCents)) : c.send}
          <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </button>
        <button type="button" onClick={onClose} className="inline-flex h-12 cursor-pointer items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white/80 transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">
          {c.cancel}
        </button>
      </div>
    </div>
  );
}

function DateCard({ label, value, muted = false, highlight }: { label: string; value: string; muted?: boolean; highlight?: "orange" | "green" }) {
  return (
    <motion.div
      key={value}
      initial={{ rotateX: -70, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      style={{ transformPerspective: 600 }}
      className={cn(
        "flex min-w-[8.5rem] flex-col items-center overflow-hidden rounded-2xl border text-center",
        muted ? "border-white/10 bg-white/[0.03]" : highlight === "green" ? "border-emerald-400/50 bg-emerald-500/10" : "border-[#ff8a1f]/60 bg-[#ff7a1a]/10"
      )}
    >
      <span className={cn("w-full py-1 text-[10px] font-bold uppercase tracking-[0.16em]", muted ? "bg-white/10 text-white/55" : highlight === "green" ? "bg-emerald-500/30 text-emerald-100" : cn("text-white", PEARL))}>{label}</span>
      <span className={cn("px-3 py-3 font-heading text-lg font-black", muted ? "text-white/60" : "text-white")}>{value}</span>
    </motion.div>
  );
}
