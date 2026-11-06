"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { IconArrowBarToUp, IconCheck, IconExternalLink, IconFilterFilled, IconGripVertical, IconLoader2, IconPlus, IconTagFilled, IconTrashFilled } from "@tabler/icons-react";
import { ACCOUNT_CARD } from "@/components/account-shell";
import { Input } from "@/components/ui/input";
import { PillMultiSelect, PillSelect } from "@/components/ui/pill-select";
import { useLanguage } from "@/lib/i18n/language-context";
import { bunny } from "@/lib/bunny-stream";
import { PORTFOLIO_KEYS, filterPortfolio, type PortfolioFilter, type PortfolioItem, type PortfolioKey } from "@/lib/portfolio-grid";
import { parseVideoLink, posterOf, reorderWithin, rowFromItem, watchUrlOf } from "@/lib/portfolio-videos";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Orientation = PortfolioItem["orientation"];
type Status = "idle" | "saving" | "saved" | "failed";

const ICON_BUTTON =
  "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition-[transform,border-color,background-color,color] duration-200 ease-out hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.08] hover:text-white";

const CATEGORY_ICON = <IconTagFilled className="size-4 text-[#ff8a1f]" aria-hidden />;

/** 16:9 or 9:16 - two small pills side by side. */
function FormatToggle({ value, onChange, label, wide, tall }: { value: Orientation; onChange: (value: Orientation) => void; label: string; wide: string; tall: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 gap-0.5 rounded-full border border-white/12 bg-black/40 p-0.5">
      {(["wide", "tall"] as const).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-8 cursor-pointer rounded-full px-3 text-xs font-bold transition-[color,background-color,transform] duration-200 ease-out hover:-translate-y-px",
            value === key ? "bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white" : "text-white/60 hover:text-white"
          )}
        >
          {key === "wide" ? wide : tall}
        </button>
      ))}
    </div>
  );
}

/** One film in the list: dragged by its handle, so the fields in the row stay usable. */
function Row({
  item,
  number,
  categories,
  onChange,
  onTop,
  onRemove,
}: {
  item: PortfolioItem;
  number: number;
  categories: { value: PortfolioKey; label: string }[];
  onChange: (patch: Partial<Pick<PortfolioItem, "categories" | "orientation">>) => void;
  onTop: () => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const p = t.team.admin.portfolio;
  const drag = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={drag}
      whileDrag={{ scale: 1.01, boxShadow: "0 18px 40px -18px rgba(0,0,0,0.9)" }}
      className={cn(ACCOUNT_CARD, "relative flex flex-wrap items-center gap-3 p-2.5 pe-3")}
    >
      <button
        type="button"
        aria-label={p.drag}
        onPointerDown={(event) => drag.start(event)}
        className="grid h-14 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-white/40 transition-colors duration-200 hover:text-white active:cursor-grabbing"
      >
        <IconGripVertical className="size-5" aria-hidden />
      </button>
      <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums text-white/50">{number}</span>
      <a href={watchUrlOf(item)} target="_blank" rel="noreferrer" aria-label={p.watch} className="group/poster relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- video posters (Bunny's is referer-gated, YouTube's is a still) */}
        <img src={posterOf(item)} alt="" loading="lazy" referrerPolicy="origin" className={cn("size-full transition-transform duration-300 group-hover/poster:scale-105", item.orientation === "tall" ? "object-contain" : "object-cover")} />
        <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/poster:opacity-100">
          <IconExternalLink className="size-4 text-white" aria-hidden />
        </span>
      </a>
      <span className="w-16 shrink-0 text-xs font-semibold text-white/50">{item.film ? p.bunny : p.youtube}</span>
      <PillMultiSelect values={item.categories} onChange={(next) => onChange({ categories: next })} options={categories} label={p.category} className="w-56 max-w-full" icon={CATEGORY_ICON} />
      <FormatToggle value={item.orientation} onChange={(orientation) => onChange({ orientation })} label={p.format} wide={p.wide} tall={p.tall} />
      <div className="ms-auto flex gap-2">
        <button type="button" onClick={onTop} aria-label={p.toTop} title={p.toTop} className={ICON_BUTTON}>
          <IconArrowBarToUp className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={onRemove} aria-label={p.remove} title={p.remove} className={cn(ICON_BUTTON, "hover:border-red-400/60 hover:text-red-300")}>
          <IconTrashFilled className="size-4" aria-hidden />
        </button>
      </div>
    </Reorder.Item>
  );
}

/**
 * The Portfolio tab of the admin dashboard: every film of the portfolio page in its order. Drag a film by its handle (with
 * a category picked, the order within it), send it to the top, change its category or format, remove it, or add a new one
 * by pasting its link. Nothing reaches the site until Save: the whole list goes to `save_portfolio()` in one transaction,
 * and "Undo changes" returns to the last saved list.
 */
export function PortfolioManager({ initial, sample }: { initial: PortfolioItem[]; sample: boolean }) {
  const { t } = useLanguage();
  const p = t.team.admin.portfolio;
  const names = t.packages.items as Record<string, { title: string }>;
  const [items, setItems] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [link, setLink] = useState("");
  const [newCategories, setNewCategories] = useState<PortfolioKey[]>([PORTFOLIO_KEYS[0]]);
  const [orientation, setOrientation] = useState<Orientation>("wide");
  const [addError, setAddError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const categories = useMemo(() => PORTFOLIO_KEYS.map((key) => ({ value: key, label: names[key].title })), [names]);
  const filters = useMemo(
    () => [{ value: "all" as PortfolioFilter, label: `${p.all} · ${items.length}` }, ...PORTFOLIO_KEYS.map((key) => ({ value: key as PortfolioFilter, label: `${names[key].title} · ${filterPortfolio(items, key).length}` }))],
    [items, names, p.all]
  );
  const shown = useMemo(() => filterPortfolio(items, filter), [items, filter]);
  const dirty = useMemo(() => JSON.stringify(items.map(rowFromItem)) !== JSON.stringify(saved.map(rowFromItem)), [items, saved]);

  // Leaving with unsaved work asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (next: PortfolioItem[]) => {
    setItems(next);
    setStatus("idle");
  };

  const add = () => {
    const parsed = parseVideoLink(link);
    if (!parsed) return setAddError(p.badLink);
    const id = parsed.source === "bunny" ? `film-${parsed.id}` : `yt-${parsed.id}`;
    if (items.some((item) => item.id === id)) return setAddError(p.duplicate);
    const format = parsed.tall ? "tall" : orientation;
    const film: PortfolioItem = parsed.source === "bunny" ? { id, categories: newCategories, orientation: format, film: bunny(parsed.id) } : { id, categories: newCategories, orientation: format, youtubeId: parsed.id };
    edit([film, ...items]);
    setLink("");
    setAddError(null);
    if (filterPortfolio([film], filter).length === 0) setFilter("all");
  };

  const save = async () => {
    setStatus("saving");
    const { error } = await createClient().rpc("save_portfolio", { p_items: items.map(rowFromItem) });
    if (error) {
      console.error("portfolio: save failed", error);
      setStatus("failed");
      return;
    }
    await fetch("/api/portfolio/refresh", { method: "POST" }).catch(() => undefined);
    setSaved(items);
    setStatus("saved");
  };

  return (
    <div className="mt-8 flex flex-col gap-5">
      <form
        className={cn(ACCOUNT_CARD, "flex flex-wrap items-center gap-3 p-4")}
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Input
          value={link}
          onChange={(event) => {
            setLink(event.target.value);
            setAddError(null);
          }}
          placeholder={p.linkPlaceholder}
          aria-label={p.link}
          aria-invalid={addError !== null}
          className="h-10 min-w-64 flex-1 rounded-full border-white/12 bg-white/[0.04] px-4 text-white placeholder:text-white/40"
        />
        <PillMultiSelect values={newCategories} onChange={setNewCategories} options={categories} label={p.category} className="w-56 max-w-full" icon={CATEGORY_ICON} />
        <FormatToggle value={orientation} onChange={setOrientation} label={p.format} wide={p.wide} tall={p.tall} />
        <button
          type="submit"
          disabled={!link.trim()}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] px-5 text-sm font-bold text-white transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_rgba(255,106,20,0.9)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <IconPlus className="size-4" aria-hidden />
          {p.add}
        </button>
        {addError ? (
          <p role="alert" className="w-full text-sm font-semibold text-red-300">
            {addError}
          </p>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[70ch] text-sm text-white/60">{p.hint}</p>
        <PillSelect value={filter} onChange={setFilter} options={filters} label={p.filter} className="w-64 max-w-full" icon={<IconFilterFilled className="size-4 text-[#ff8a1f]" aria-hidden />} />
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-white/60">{p.empty}</p>
      ) : (
        <Reorder.Group axis="y" values={shown} onReorder={(next) => edit(reorderWithin(items, next))} className="flex flex-col gap-2">
          {shown.map((item, index) => (
            <Row
              key={item.id}
              item={item}
              number={index + 1}
              categories={categories}
              onChange={(patch) => edit(items.map((other) => (other.id === item.id ? { ...other, ...patch } : other)))}
              onTop={() => edit([item, ...items.filter((other) => other.id !== item.id)])}
              onRemove={() => edit(items.filter((other) => other.id !== item.id))}
            />
          ))}
        </Reorder.Group>
      )}

      <div className={cn(ACCOUNT_CARD, "sticky bottom-4 z-20 flex flex-wrap items-center gap-3 p-3 ps-5")}>
        <p role="status" className={cn("flex-1 text-sm font-semibold", status === "failed" ? "text-red-300" : status === "saved" ? "text-emerald-300" : "text-white/70")}>
          {status === "failed" ? p.failed : status === "saved" ? p.saved : sample ? p.sample : dirty ? p.unsaved : p.upToDate}
        </p>
        <button
          type="button"
          disabled={!dirty || status === "saving"}
          onClick={() => edit(saved)}
          className="h-10 cursor-pointer rounded-full border border-white/15 px-5 text-sm font-bold text-white/80 transition-[transform,border-color,color] duration-200 ease-out hover:-translate-y-px hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {p.undo}
        </button>
        <button
          type="button"
          disabled={!dirty || sample || status === "saving"}
          onClick={save}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] px-6 text-sm font-bold text-white transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_rgba(255,106,20,0.9)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {status === "saving" ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : <IconCheck className="size-4" aria-hidden />}
          {p.save}
        </button>
      </div>
    </div>
  );
}
