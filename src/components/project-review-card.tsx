"use client";

import { useState } from "react";
import { IconCheck, IconLoader2, IconPencil } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { projectFromRow, type ClientProject } from "@/lib/client-projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * A video in review, from the client's side: approve it (-> Delivered) or ask for a revision (-> back in production, one
 * included revision used, the request in the project's revision history and in the comments so the team sees it). Both go
 * through `client_project_action()` (supabase/delivery.sql) - the client has no other way to change the project.
 * `revisionOpen` lets the sidebar's "Request a revision" open the form here.
 */
export function ProjectReviewCard({
  project,
  sample,
  revisionOpen,
  onRevisionOpen,
  onDone,
}: {
  project: ClientProject;
  sample: boolean;
  revisionOpen: boolean;
  onRevisionOpen: (open: boolean) => void;
  onDone: (next: ClientProject, notice: string) => void;
}) {
  const { t } = useLanguage();
  const p = t.account.projectsPage;
  const r = p.review;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "revision" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const left = Math.max(0, project.revisionsTotal - project.revisionsUsed);

  async function act(action: "approve" | "revision") {
    const text = note.trim();
    if (busy || (action === "revision" && (!text || left === 0))) return;
    setBusy(action);
    setError(null);

    if (sample) {
      const today = new Date().toISOString().slice(0, 10);
      onDone(
        action === "approve"
          ? { ...project, status: "delivered", approvedAt: new Date().toISOString(), nextStep: null }
          : { ...project, status: "production", revisionsUsed: project.revisionsUsed + 1, revisionHistory: [...project.revisionHistory, { title: text, date: today, done: false }], nextStep: null },
        action === "approve" ? r.approvedNotice : r.revisionNotice
      );
      setBusy(null);
      return;
    }

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("client_project_action", { p_id: project.id, p_action: action, p_note: action === "revision" ? text : null });
    if (rpcError || !data) {
      setError(rpcError?.message.includes("no_revisions_left") ? r.noneLeft : r.error);
      setBusy(null);
      return;
    }
    if (action === "revision") {
      // The request also goes into the thread, so the team sees a client comment waiting for a reply.
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const meta = (auth.user.user_metadata ?? {}) as { full_name?: string; name?: string };
        const name = meta.full_name || meta.name || auth.user.email?.split("@")[0] || "";
        await supabase.from("project_comments").insert({ project_id: project.id, user_id: auth.user.id, author_name: name, is_team: false, body: `${p.comments.revisionPrefill}${text}` });
      }
    }
    setBusy(null);
    setNote("");
    onDone(projectFromRow(data as Record<string, unknown>), action === "approve" ? r.approvedNotice : r.revisionNotice);
  }

  return (
    <div className="rounded-2xl border border-[#ff8a1f]/40 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(255,110,20,0.16),transparent_60%),rgba(255,255,255,0.03)] p-5 shadow-[0_24px_60px_-34px_rgba(255,106,20,0.6)]">
      <h3 className="font-heading text-lg font-black uppercase text-[#ff8a1f]">{r.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/70">{r.text.replace("{left}", String(left))}</p>

      {revisionOpen ? (
        <div className="mt-4">
          {left === 0 ? (
            <p className="text-sm text-[#ffb066]">{r.noneLeft}</p>
          ) : (
            <>
              <label htmlFor={`revision-${project.id}`} className="mb-2 block text-sm font-semibold">
                {r.revisionLabel}
              </label>
              <textarea
                id={`revision-${project.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={r.revisionPlaceholder}
                className="w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/30 focus:border-[#ff8a1f]/70 focus:shadow-[0_0_0_3px_rgba(255,138,31,0.15)]"
              />
            </>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {left > 0 ? (
              <button
                type="button"
                onClick={() => void act("revision")}
                disabled={!note.trim() || busy !== null}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {busy === "revision" ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : null}
                {r.send}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onRevisionOpen(false)}
              className="inline-flex h-11 cursor-pointer items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/75 transition-[transform,background-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/8 hover:text-white"
            >
              {r.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void act("approve")}
            disabled={busy !== null}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(255,106,20,0.95)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {busy === "approve" ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : <IconCheck className="size-4" stroke={3} aria-hidden />}
            {r.approve}
          </button>
          <button
            type="button"
            onClick={() => onRevisionOpen(true)}
            disabled={busy !== null}
            className={cn(
              "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[#ff8a1f]/55 px-5 text-sm font-semibold text-[#ffb066] transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#ff7a1a]/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            )}
          >
            <IconPencil className="size-4" aria-hidden />
            {r.revision}
          </button>
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[#ffb066]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
