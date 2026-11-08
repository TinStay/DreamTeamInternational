"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ComponentType } from "react";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCircleCheckFilled,
  IconCreditCardFilled,
  IconEye,
  IconFolderFilled,
  IconMessageCircleFilled,
  IconUsersGroup,
} from "@tabler/icons-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useLanguage } from "@/lib/i18n/language-context";
import { myProjectsPath } from "@/lib/routes";
import { formatDateDisplay } from "@/lib/dates";
import type { ClientProject } from "@/lib/client-projects";
import type { ClientOverview } from "@/lib/clients";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Tone = "red" | "orange" | "green";
const TONE: Record<Tone, { ring: string; glow: string; corner: string; scan: string; badge: string; ink: string; dot: string; shadow: string }> = {
  red: {
    ring: "bg-[conic-gradient(from_0deg,transparent_0%,transparent_62%,#dc2626_78%,#fca5a5_86%,#ef4444_92%,transparent_100%)]",
    glow: "bg-[linear-gradient(135deg,#dc2626,#f87171)] shadow-[0_0_40px_rgba(239,68,68,0.55)]",
    corner: "bg-[radial-gradient(circle,rgba(239,68,68,0.24),transparent_65%)]",
    scan: "bg-[linear-gradient(90deg,transparent,rgba(252,165,165,0.08),transparent)]",
    badge: "text-red-300",
    ink: "bg-[linear-gradient(115deg,#ef4444_0%,#fca5a5_55%,#f87171_100%)]",
    dot: "bg-red-400",
    shadow: "shadow-[0_40px_90px_-40px_rgba(239,68,68,0.6)]",
  },
  orange: {
    ring: "bg-[conic-gradient(from_0deg,transparent_0%,transparent_62%,#ff5e00_78%,#ffd2a1_86%,#ff8a1f_92%,transparent_100%)]",
    glow: "bg-[linear-gradient(135deg,#ff5e00,#ffb066)] shadow-[0_0_40px_rgba(255,106,20,0.6)]",
    corner: "bg-[radial-gradient(circle,rgba(255,106,20,0.28),transparent_65%)]",
    scan: "bg-[linear-gradient(90deg,transparent,rgba(255,170,90,0.09),transparent)]",
    badge: "text-[#ff8a1f]",
    ink: "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_35%,#ffd2a1_55%,#ff9a3c_75%)]",
    dot: "bg-[#ff8a1f]",
    shadow: "shadow-[0_40px_90px_-40px_rgba(255,106,20,0.75)]",
  },
  green: {
    ring: "bg-[conic-gradient(from_0deg,transparent_0%,transparent_66%,#10b981_82%,#a7f3d0_90%,transparent_100%)]",
    glow: "bg-[linear-gradient(135deg,#059669,#6ee7b7)] shadow-[0_0_36px_rgba(16,185,129,0.45)]",
    corner: "bg-[radial-gradient(circle,rgba(16,185,129,0.2),transparent_65%)]",
    scan: "bg-[linear-gradient(90deg,transparent,rgba(110,231,183,0.07),transparent)]",
    badge: "text-emerald-300",
    ink: "",
    dot: "bg-emerald-400",
    shadow: "shadow-[0_40px_90px_-45px_rgba(52,211,153,0.5)]",
  },
};

/** A client whose live subscription's payment failed: Stripe's `past_due` / `unpaid`. */
export const hasMissingPayment = (c: ClientOverview) => c.subscriptionStatus === "past_due" || c.subscriptionStatus === "unpaid";

type Alert = { key: string; kind: "payment" | "reply" | "overdue"; title: string; sub: string; onClick: () => void };

/**
 * The top of the admin Dashboard: what needs the team now, as one status card.
 *
 * **Left - the one thing to do first, and the button that does exactly that.** A missing payment comes first (the only
 * red state - a client whose subscription payment failed): *Review payment* opens that client. Otherwise the client
 * comments waiting for a reply: *Reply now* opens the next project with its reply box ready. With neither, all is calm
 * (green) and the button browses the projects.
 *
 * **Right - every alert and the quick actions.** Each alert row is one project or client, and clicking it does its own
 * action (open the client, reply on the project, open the overdue project). The quick actions under them jump to the
 * lists or to the client view.
 *
 * Its motion is slow on purpose: a still edge light on the frame, a scan crossing it every 14
 * seconds, a soft ping round the icon - transforms and opacity only, all `motion-safe:` (still under reduced motion).
 */
export function InboxCard({
  waiting,
  missing,
  overdue,
  inReview,
  onReply,
  onOpenProject,
  onOpenClient,
  onShow,
}: {
  waiting: ClientProject[];
  missing: ClientOverview[];
  overdue: ClientProject[];
  inReview: number;
  onReply: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
  onOpenClient: (clientId: string) => void;
  onShow: (list: "projects" | "clients") => void;
}) {
  const { t, language } = useLanguage();
  const c = t.team.admin.inbox;
  const status = t.team.clients.subscription;
  const tone: Tone = missing.length > 0 ? "red" : waiting.length > 0 ? "orange" : "green";
  const s = TONE[tone];

  // The primary state - and its button's action, always the one its label names.
  const primary =
    tone === "red"
      ? {
          icon: IconCreditCardFilled,
          count: missing.length,
          label: missing.length === 1 ? c.paymentOne : c.paymentMany,
          text: c.paymentText,
          cta: c.reviewPayment,
          action: () => onOpenClient(missing[0].id),
        }
      : tone === "orange"
        ? {
            icon: IconMessageCircleFilled,
            count: waiting.length,
            label: c.waiting,
            text: `${waiting.length} ${waiting.length === 1 ? c.waitingOne : c.waitingMany}`,
            cta: c.replyNow,
            action: () => onReply(waiting[0].id),
          }
        : { icon: IconCircleCheckFilled, count: 0, label: c.clear, text: c.clearText, cta: c.browseProjects, action: () => onShow("projects") };

  const who = (p: ClientProject) => p.clientName ?? p.clientEmail ?? "";
  const alerts: Alert[] = [
    ...missing.map((x) => ({
      key: `pay-${x.id}`,
      kind: "payment" as const,
      title: x.fullName ?? x.email ?? "",
      sub: status[x.subscriptionStatus ?? ""] ?? x.subscriptionStatus ?? "",
      onClick: () => onOpenClient(x.id),
    })),
    ...waiting.map((p) => ({ key: `reply-${p.id}`, kind: "reply" as const, title: p.title, sub: who(p), onClick: () => onReply(p.id) })),
    ...overdue.map((p) => ({
      key: `late-${p.id}`,
      kind: "overdue" as const,
      title: p.title,
      sub: `${who(p)}${p.dueDate ? ` · ${c.due} ${formatDateDisplay(p.dueDate.slice(0, 10))}` : ""}`,
      onClick: () => onOpenProject(p.id),
    })),
  ];
  const TAG: Record<Alert["kind"], { label: string; cls: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }> = {
    payment: { label: c.tags.payment, cls: "bg-red-500/90 text-white", icon: IconCreditCardFilled },
    reply: { label: c.tags.reply, cls: "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white", icon: IconMessageCircleFilled },
    overdue: { label: c.tags.overdue, cls: "border border-amber-300/50 text-amber-200", icon: IconAlertTriangle },
  };

  const quick: { label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; onClick?: () => void; href?: string }[] = [
    ...(missing.length ? [{ label: c.actions.payment, icon: IconCreditCardFilled, onClick: () => onOpenClient(missing[0].id) }] : []),
    ...(waiting.length ? [{ label: c.actions.reply, icon: IconMessageCircleFilled, onClick: () => onReply(waiting[0].id) }] : []),
    { label: c.actions.projects, icon: IconFolderFilled, onClick: () => onShow("projects") },
    { label: c.actions.clients, icon: IconUsersGroup, onClick: () => onShow("clients") },
    { label: c.actions.asClient, icon: IconEye, href: myProjectsPath(language) },
  ];
  const quickClass =
    "group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-[13px] font-semibold text-white/75 transition-[transform,border-color,background-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff8a1f]/55 hover:bg-[#ff7a1a]/10 hover:text-white";
  const Icon = primary.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: EASE }}
      aria-label={c.eyebrow}
      className={cn("relative isolate overflow-hidden rounded-[1.75rem] p-px", s.shadow)}
    >
      {/* The edge light: a still glow along part of the frame (no animation). */}
      <span aria-hidden className={cn("absolute top-1/2 left-1/2 -z-10 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2", s.ring)} />
      <span aria-hidden className="absolute inset-0 -z-20 rounded-[1.75rem] bg-white/10" />

      <div className="relative overflow-hidden rounded-[calc(1.75rem-1px)] bg-[linear-gradient(150deg,#16171c_0%,#0c0d10_55%,#0a0a0d_100%)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1.2px)] bg-[size:18px_18px] [mask-image:radial-gradient(120%_90%_at_0%_0%,#000_20%,transparent_75%)]" />
        <div aria-hidden className={cn("pointer-events-none absolute -top-24 -left-24 size-96 rounded-full", s.corner)} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/5 motion-safe:animate-[admin-scan_14s_cubic-bezier(0.45,0,0.2,1)_infinite]">
          <div className={cn("h-full w-full -skew-x-12", s.scan)} />
        </div>

        <div className="relative grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-12 xl:p-10">
          {/* Left: the first thing to do. */}
          <div className="flex items-start gap-5 sm:gap-7">
            <div className="relative flex size-16 shrink-0 items-center justify-center sm:size-20">
              {tone !== "green" ? (
                <>
                  <span aria-hidden className={cn("absolute inset-0 rounded-full border motion-safe:animate-ping [animation-duration:4.5s]", tone === "red" ? "border-red-400/50" : "border-[#ff8a1f]/50")} />
                  <span aria-hidden className={cn("absolute inset-2 rounded-full border motion-safe:animate-ping [animation-delay:1.5s] [animation-duration:4.5s]", tone === "red" ? "border-red-400/30" : "border-[#ff8a1f]/30")} />
                </>
              ) : null}
              <span className={cn("relative flex size-full items-center justify-center rounded-full", s.glow)}>
                <Icon className={cn("size-8 sm:size-9", tone === "green" ? "text-[#022c22]" : tone === "red" ? "text-white" : "text-[#140a03]")} aria-hidden />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", s.badge)}>{c.eyebrow}</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                  <span className={cn("size-1.5 rounded-full motion-safe:animate-pulse [animation-duration:3s]", s.dot)} />
                  {c.live}
                </span>
              </div>
              <p className="mt-2 flex items-baseline gap-3">
                {primary.count ? (
                  <motion.span
                    key={`${tone}-${primary.count}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASE }}
                    className={cn("bg-clip-text font-heading text-6xl leading-none font-black text-transparent tabular-nums sm:text-7xl", s.ink)}
                  >
                    {primary.count}
                  </motion.span>
                ) : null}
                <span className={cn("font-heading leading-tight font-black uppercase", primary.count ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl")}>{primary.label}</span>
              </p>
              <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-white/60">{primary.text}</p>
              <button
                type="button"
                onClick={primary.action}
                className={cn(
                  "group mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[15px] font-bold transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5",
                  tone === "red"
                    ? "bg-[linear-gradient(115deg,#dc2626,#f87171)] text-white shadow-[0_14px_34px_-14px_rgba(239,68,68,0.9)]"
                    : tone === "orange"
                      ? "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] text-[#140a03] shadow-[0_14px_34px_-14px_rgba(255,106,20,0.9)]"
                      : "border border-emerald-300/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20",
                )}
              >
                {primary.cta}
                <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </button>
            </div>
          </div>

          {/* Right: every alert, then the quick actions. */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{c.alertsTitle}</p>
              {inReview ? <p className="text-xs text-white/45">{c.inReview.replace("{n}", String(inReview))}</p> : null}
            </div>
            {alerts.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/50">{c.noAlerts}</p>
            ) : (
              <ul className="mt-3 flex max-h-[19rem] flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]" data-lenis-prevent>
                {alerts.map((alert, i) => {
                  const tag = TAG[alert.kind];
                  return (
                    <motion.li key={alert.key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.2 + Math.min(i, 6) * 0.1, ease: EASE }}>
                      <button
                        type="button"
                        onClick={alert.onClick}
                        className={cn(
                          "group flex w-full cursor-pointer items-center gap-4 rounded-2xl border bg-white/[0.035] px-4 py-3 text-left backdrop-blur transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.06]",
                          alert.kind === "payment" ? "border-red-400/35 hover:border-red-400/70" : "border-white/10 hover:border-[#ff8a1f]/50 hover:shadow-[0_14px_30px_-18px_rgba(255,106,20,0.8)]",
                        )}
                      >
                        <InitialsAvatar name={alert.kind === "payment" ? alert.title : alert.sub.split(" · ")[0] || alert.title} className={alert.kind === "payment" ? "bg-red-500/15 text-red-200 ring-red-400/30" : undefined} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold transition-colors duration-200 group-hover:text-[#ff8a1f]">{alert.title}</span>
                          <span className="block truncate text-xs text-white/45">{alert.sub}</span>
                        </span>
                        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]", tag.cls)}>
                          <tag.icon className="size-3" aria-hidden />
                          {tag.label}
                        </span>
                        <IconArrowRight className="size-4 shrink-0 text-white/30 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#ff8a1f]" aria-hidden />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{c.quickTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map(({ label, icon: QIcon, onClick, href }) =>
                href ? (
                  <Link key={label} href={href} className={quickClass}>
                    <QIcon className="size-4 text-[#ff8a1f] transition-transform duration-200 group-hover:scale-110" aria-hidden />
                    {label}
                  </Link>
                ) : (
                  <button key={label} type="button" onClick={onClick} className={quickClass}>
                    <QIcon className="size-4 text-[#ff8a1f] transition-transform duration-200 group-hover:scale-110" aria-hidden />
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
