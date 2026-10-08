"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconPencil, IconStarFilled } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { createClient } from "@/lib/supabase/client";
import { REVIEW_ASPECTS, reviewAverage, reviewFromRow, type ProjectReview, type ReviewAspect } from "@/lib/project-changes";
import { cn } from "@/lib/utils";

const EMPTY: Record<ReviewAspect, number> = { quality: 0, speed: 0, attitude: 0 };

/** Five stars for one aspect: they light up under the pointer and pop when picked. Read-only without `onChange`. */
function Stars({ value, onChange, label, size = "md" }: { value: number; onChange?: (n: number) => void; label: string; size?: "sm" | "md" }) {
  const { t } = useLanguage();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const box = size === "sm" ? "size-[18px]" : "size-8";
  if (!onChange) {
    return (
      <span className="inline-flex gap-0.5" role="img" aria-label={`${label}: ${t.account.projectsPage.rating.stars.replace("{n}", String(value))}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <IconStarFilled key={n} className={cn(box, n <= value ? "text-amber-300" : "text-white/15")} aria-hidden />
        ))}
      </span>
    );
  }
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t.account.projectsPage.rating.stars.replace("{n}", String(n))}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          whileHover={{ scale: 1.18, rotate: -8 }}
          whileTap={{ scale: 0.85 }}
          animate={value >= n ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="cursor-pointer rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
        >
          <IconStarFilled className={cn(box, "transition-colors duration-150", n <= shown ? "text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.55)]" : "text-white/15")} aria-hidden />
        </motion.button>
      ))}
    </div>
  );
}

/**
 * The client's rating of an approved project, at the top of its page (`#review`): quality, speed and attitude, one to
 * five stars each, and an optional comment. Before rating it is an invitation; afterwards a summary - the overall score
 * and each aspect - with Edit. Saved to `project_reviews` (supabase/changes.sql: only your own project, only once its
 * film is approved). `sample` keeps it in the page.
 */
export function ProjectRating({ projectId, userId, sample = false }: { projectId: string; userId: string | null; sample?: boolean }) {
  const { t } = useLanguage();
  const r = t.account.projectsPage.rating;
  const [review, setReview] = useState<ProjectReview | null>(null);
  const [loaded, setLoaded] = useState(sample);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (sample) return;
    let alive = true;
    void createClient()
      .from("project_reviews")
      .select("quality, speed, attitude, comment, updated_at")
      .eq("project_id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setReview(reviewFromRow(data as Record<string, unknown> | null));
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [projectId, sample]);

  const complete = REVIEW_ASPECTS.every((a) => draft[a] > 0);
  const form = !review || editing;

  function startEdit() {
    if (review) {
      setDraft({ quality: review.quality, speed: review.speed, attitude: review.attitude });
      setComment(review.comment ?? "");
    }
    setEditing(true);
  }

  async function save() {
    if (!complete || busy) return;
    setBusy(true);
    setError(false);
    const next: ProjectReview = { ...draft, comment: comment.trim() || null, updatedAt: new Date().toISOString() };
    if (!sample) {
      const row = { quality: draft.quality, speed: draft.speed, attitude: draft.attitude, comment: next.comment, updated_at: next.updatedAt };
      const supabase = createClient();
      const { error: saveError } = review
        ? await supabase.from("project_reviews").update(row).eq("project_id", projectId)
        : await supabase.from("project_reviews").insert({ ...row, project_id: projectId, user_id: userId });
      if (saveError) {
        setError(true);
        setBusy(false);
        return;
      }
    }
    setReview(next);
    setEditing(false);
    setThanks(true);
    setBusy(false);
  }

  if (!loaded) return <div id="review" className="h-40 animate-pulse scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.03]" />;

  return (
    <motion.section
      id="review"
      aria-labelledby="project-rating"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative scroll-mt-28 overflow-hidden rounded-2xl border border-emerald-400/30 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(52,211,153,0.14),transparent_55%),radial-gradient(90%_120%_at_100%_100%,rgba(252,211,77,0.08),transparent_60%),rgba(255,255,255,0.03)] p-5 @3xl:p-7"
    >
      <AnimatePresence mode="wait" initial={false}>
        {form ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <h2 id="project-rating" className="font-heading text-lg font-black uppercase text-emerald-300">
              {r.title}
            </h2>
            <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-white/70">{r.text}</p>
            <div className="mt-5 grid gap-4 @3xl:grid-cols-3">
              {REVIEW_ASPECTS.map((a) => (
                <div key={a} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-semibold">{r.aspects[a]}</p>
                  <p className="mb-2.5 text-xs text-white/45">{r.hints[a]}</p>
                  <Stars value={draft[a]} label={r.aspects[a]} onChange={(n) => setDraft((d) => ({ ...d, [a]: n }))} />
                </div>
              ))}
            </div>
            <label htmlFor={`rating-comment-${projectId}`} className="mt-5 block text-sm font-semibold">
              {r.comment}
            </label>
            <textarea
              id={`rating-comment-${projectId}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder={r.commentPlaceholder}
              className="mt-2 w-full resize-y rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-emerald-400/60"
            />
            {error ? (
              <p role="alert" className="mt-3 text-sm text-[#ffb066]">
                {r.error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void save()}
              disabled={!complete || busy}
              className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#059669,#34d399)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(52,211,153,0.8)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(52,211,153,0.95)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <IconStarFilled className="size-4" aria-hidden />
              {busy ? r.saving : r.submit}
            </button>
          </motion.div>
        ) : review ? (
          <motion.div key="summary" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5 @3xl:flex-row @3xl:items-center">
            <div className="flex items-center gap-4">
              <motion.span
                initial={{ rotate: -20, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] text-black shadow-[0_12px_30px_-10px_rgba(251,191,36,0.7)]"
              >
                <span className="font-heading text-2xl leading-none font-black">{reviewAverage(review).toFixed(1)}</span>
                <IconStarFilled className="mt-0.5 size-3.5" aria-hidden />
              </motion.span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">{thanks ? r.thanks : r.yours}</p>
                <h2 id="project-rating" className="font-heading text-lg font-black uppercase">
                  {r.overall}
                </h2>
                {review.comment ? <p className="mt-1 line-clamp-2 max-w-[48ch] text-sm text-white/65">“{review.comment}”</p> : null}
              </div>
            </div>
            <dl className="flex flex-1 flex-wrap gap-x-6 gap-y-2 @3xl:justify-end">
              {REVIEW_ASPECTS.map((a) => (
                <div key={a}>
                  <dt className="text-xs text-white/45">{r.aspects[a]}</dt>
                  <dd>
                    <Stars value={review[a]} label={r.aspects[a]} size="sm" />
                  </dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-full border border-white/15 px-3.5 text-sm font-semibold text-white/75 transition-[transform,background-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:text-white @3xl:self-center"
            >
              <IconPencil className="size-4" aria-hidden />
              {r.edit}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
