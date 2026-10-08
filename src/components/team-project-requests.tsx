"use client";

import { useEffect, useState } from "react";
import { IconStarFilled } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateDisplay } from "@/lib/dates";
import { formatVideoTime } from "@/lib/account-info";
import { formatPrice } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import { REVIEW_ASPECTS, requestFromRow, reviewAverage, reviewFromRow, type ProjectRequest, type ProjectReview } from "@/lib/project-changes";
import { cn } from "@/lib/utils";

/**
 * In the team's project window: the client's change requests - approve (the change is applied to the project at once)
 * or decline (any seconds go back to the client; money paid for it is refunded in Stripe by hand) with an optional note
 * the client sees - and, once they have rated it, the client's review. Both through `resolve_project_request()` /
 * `project_reviews` (supabase/changes.sql). `onApplied` re-reads the project after an approval changed it.
 */
export function TeamProjectRequests({ projectId, sample, onApplied }: { projectId: string; sample: boolean; onApplied: () => void }) {
  const { t } = useLanguage();
  const d = t.team.requests;
  const c = t.account.projectsPage.changes;
  const r = t.account.projectsPage.rating;
  const [requests, setRequests] = useState<ProjectRequest[] | null>(sample ? [] : null);
  const [review, setReview] = useState<ProjectReview | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sample) return;
    let alive = true;
    const supabase = createClient();
    void Promise.all([
      supabase.from("project_requests").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("project_reviews").select("quality, speed, attitude, comment, updated_at").eq("project_id", projectId).maybeSingle(),
    ]).then(([reqs, rev]) => {
      if (!alive) return;
      setRequests((reqs.data ?? []).map((x) => requestFromRow(x as Record<string, unknown>)));
      setReview(reviewFromRow(rev.data as Record<string, unknown> | null));
    });
    return () => {
      alive = false;
    };
  }, [projectId, sample]);

  async function resolve(req: ProjectRequest, decision: "approve" | "decline") {
    setBusy(req.id);
    setError(false);
    const { data, error: rpcError } = await createClient().rpc("resolve_project_request", { p_id: req.id, p_decision: decision, p_note: notes[req.id] ?? null });
    setBusy(null);
    if (rpcError || !data) {
      setError(true);
      return;
    }
    setRequests((prev) => (prev ?? []).map((x) => (x.id === req.id ? requestFromRow(data as Record<string, unknown>) : x)));
    if (decision === "approve") onApplied();
  }

  const summary = (q: ProjectRequest) => {
    const v = q.details;
    if (q.kind === "deadline") return c.summary.deadline.replace("{to}", typeof v.to === "string" ? formatDateDisplay(v.to.slice(0, 10)) : "-");
    if (q.kind === "duration") return c.summary.duration.replace("{extra}", formatVideoTime(Number(v.extra) || q.costSeconds));
    if (q.kind === "format") return c.summary.format.replace("{format}", String(v.format ?? ""));
    return c.summary.revision;
  };

  const visible = (requests ?? []).filter((q) => q.status !== "cancelled");

  return (
    <div className="flex flex-col gap-5">
      {review ? (
        <div className="rounded-xl border border-amber-300/30 bg-amber-400/[0.06] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <IconStarFilled className="size-4 text-amber-300" aria-hidden />
            {d.review} · {reviewAverage(review).toFixed(1)}
          </p>
          <p className="mt-1.5 text-xs text-white/60">{REVIEW_ASPECTS.map((a) => `${r.aspects[a]} ${review[a]}/5`).join(" · ")}</p>
          {review.comment ? <p className="mt-2 text-sm text-white/75">“{review.comment}”</p> : null}
        </div>
      ) : null}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a1f]">{d.title}</p>
        {requests === null ? (
          <p className="mt-2 text-sm text-white/40">…</p>
        ) : visible.length === 0 ? (
          <p className="mt-2 text-sm text-white/45">{d.none}</p>
        ) : (
          <ul className="mt-2.5 flex flex-col gap-2">
            {visible.map((q) => (
              <li key={q.id} className={cn("rounded-xl border p-3.5", q.status === "requested" ? "border-[#ff8a1f]/45 bg-[#ff7a1a]/[0.06]" : "border-white/10 bg-white/[0.03]")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{summary(q)}</span>
                  <span className="text-xs text-white/50">
                    {q.costCents > 0 ? `${formatPrice(q.costCents / 100)}${q.paidAt ? ` · ${d.paid}` : ""}` : q.costSeconds > 0 ? formatVideoTime(q.costSeconds) : c.free} · {c.status[q.status]}
                  </span>
                </div>
                {q.status === "requested" ? (
                  <>
                    <input
                      value={notes[q.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [q.id]: e.target.value }))}
                      maxLength={1000}
                      placeholder={d.notePlaceholder}
                      aria-label={d.notePlaceholder}
                      className="mt-2.5 h-9 w-full rounded-lg border border-white/12 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#ff8a1f]/60"
                    />
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button type="button" disabled={busy === q.id || sample} onClick={() => void resolve(q, "approve")} className="inline-flex h-8 cursor-pointer items-center rounded-full bg-[linear-gradient(115deg,#059669,#34d399)] px-3.5 text-xs font-bold text-white transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                        {d.approve}
                      </button>
                      <button type="button" disabled={busy === q.id || sample} onClick={() => void resolve(q, "decline")} className="inline-flex h-8 cursor-pointer items-center rounded-full border border-white/20 px-3.5 text-xs font-semibold text-white/75 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">
                        {d.decline}
                      </button>
                    </div>
                    {q.costCents > 0 ? <p className="mt-2 text-[11px] text-white/40">{d.refundNote}</p> : null}
                  </>
                ) : q.teamNote ? (
                  <p className="mt-1.5 text-xs text-white/50">{q.teamNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {error ? (
          <p role="alert" className="mt-2 text-sm text-[#ffb066]">
            {d.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
