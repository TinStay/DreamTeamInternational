"use client";

import { useCallback, useEffect, useState } from "react";
import { IconLoader2, IconSend } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type ProjectComment = { id: string; authorName: string; isTeam: boolean; body: string; createdAt: string };

const fromRow = (r: Record<string, unknown>): ProjectComment => ({
  id: String(r.id),
  authorName: typeof r.author_name === "string" && r.author_name ? r.author_name : "",
  isTeam: Boolean(r.is_team),
  body: String(r.body ?? ""),
  createdAt: String(r.created_at ?? ""),
});

const when = (iso: string) => `${formatDateDisplay(iso.slice(0, 10))} · ${iso.slice(11, 16)}`;

/**
 * The comments on a project: a plain thread, oldest first, that the client and our team both write in - notes, questions,
 * revision requests. It is not a chat: nothing is live and nobody sees who is typing; a new comment shows up the next time
 * the thread is opened. Used in the client's project window (`asTeam` off) and in the team dashboard (`asTeam` on, where
 * our replies carry a Team badge). In sample mode the thread lives in the page only.
 */
export function ProjectComments({
  projectId,
  sample,
  asTeam = false,
  prefill = "",
  seed = [],
  onCount,
}: {
  projectId: string;
  sample: boolean;
  asTeam?: boolean;
  /** Text to start the box with (a revision request). */
  prefill?: string;
  /** The made-up thread shown in sample mode. */
  seed?: ProjectComment[];
  onCount?: (n: number) => void;
}) {
  const { t } = useLanguage();
  const c = t.account.projectsPage.comments;
  const [comments, setComments] = useState<ProjectComment[] | null>(sample ? seed : null);
  const [body, setBody] = useState(prefill);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (sample) return;
    const { data, error: loadError } = await createClient().from("project_comments").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
    setComments(loadError || !data ? [] : data.map((r) => fromRow(r as Record<string, unknown>)));
  }, [projectId, sample]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (comments) onCount?.(comments.length);
  }, [comments, onCount]);

  async function post() {
    const text = body.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    if (sample) {
      setComments((prev) => [...(prev ?? []), { id: `local-${Date.now()}`, authorName: asTeam ? c.teamName : c.you, isTeam: asTeam, body: text, createdAt: new Date().toISOString() }]);
      setBody("");
      setPosting(false);
      return;
    }
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError(c.error);
      setPosting(false);
      return;
    }
    const meta = (auth.user.user_metadata ?? {}) as { full_name?: string; name?: string };
    const name = meta.full_name || meta.name || auth.user.email?.split("@")[0] || "";
    const { data, error: insertError } = await supabase
      .from("project_comments")
      .insert({ project_id: projectId, user_id: auth.user.id, author_name: name, is_team: asTeam, body: text })
      .select("*")
      .single();
    setPosting(false);
    if (insertError || !data) {
      setError(c.error);
      return;
    }
    setComments((prev) => [...(prev ?? []), fromRow(data as Record<string, unknown>)]);
    setBody("");
  }

  return (
    <div>
      {comments === null ? (
        <div className="flex items-center gap-2 py-6 text-sm text-white/45">
          <IconLoader2 className="size-4 animate-spin" aria-hidden />
          {c.loading}
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">{asTeam ? c.emptyTeam : c.empty}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {comments.map((m) => (
            <li key={m.id} className={cn("rounded-2xl border p-4", m.isTeam ? "border-[#ff8a1f]/30 bg-[#ff7a1a]/[0.06]" : "border-white/10 bg-white/[0.03]")}>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-sm font-semibold">{m.authorName || (m.isTeam ? c.teamName : c.client)}</span>
                {m.isTeam ? <span className="rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">{c.teamBadge}</span> : null}
                <span className="text-xs text-white/40">{when(m.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-white/80">{m.body}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5">
        <label htmlFor={`comment-${projectId}`} className="sr-only">
          {c.label}
        </label>
        <textarea
          id={`comment-${projectId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder={asTeam ? c.placeholderTeam : c.placeholder}
          className="w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/30 focus:border-[#ff8a1f]/70 focus:shadow-[0_0_0_3px_rgba(255,138,31,0.15)]"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void post()}
            disabled={!body.trim() || posting}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {posting ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : <IconSend className="size-4" aria-hidden />}
            {c.post}
          </button>
          {error ? (
            <span role="alert" className="text-sm text-red-300">
              {error}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
