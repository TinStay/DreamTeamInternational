"use client";

import { useEffect, useRef, useState } from "react";
import { IconDownload, IconFileDescription, IconLoader2, IconMovie, IconTrash, IconUpload } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { DELIVERY_BUCKET, formatBytes, type ClientProject, type DeliveryVideo, type ProjectFile } from "@/lib/client-projects";
import { createClient } from "@/lib/supabase/client";
import { downloadPrivate, safeFileName, signedUrl, uploadWithProgress } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#ff8a1f]/55 px-4 text-sm font-semibold text-[#ffb066] transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#ff7a1a]/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";
const ICON_BUTTON =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/70 transition-[transform,background-color,color] duration-200 ease-out hover:scale-105 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100";

/** A deliverable as it is stored in `projects.files`. */
const fileRow = (f: ProjectFile) => ({ name: f.name, ...(f.path ? { path: f.path } : {}), ...(f.url ? { url: f.url } : {}), size: f.size });

/**
 * The team's delivery controls on a project: the finished film and the files to download, uploaded straight to the private
 * `project-deliveries` bucket (supabase/delivery.sql) at `<client id>/<project id>/…` and written to the project at once -
 * the client sees them in their project window (through short-lived signed links), nothing is ever public. Replacing the
 * film or removing a file also deletes the old object.
 */
export function TeamDeliveryPanel({ project, sample, onChange }: { project: ClientProject; sample: boolean; onChange: (patch: Partial<ClientProject>) => void }) {
  const { t } = useLanguage();
  const d = t.team.delivery;
  const videoInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ name: string; pct: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ path: string; url: string } | null>(null);

  const video = project.deliveryVideo;
  // A signed link to watch the uploaded film here (an hour is plenty for a look).
  useEffect(() => {
    if (sample || !video) return;
    let alive = true;
    void signedUrl(DELIVERY_BUCKET, video.path, 3600).then((url) => {
      if (alive && url) setPreview({ path: video.path, url });
    });
    return () => {
      alive = false;
    };
  }, [sample, video]);
  const previewUrl = video && preview?.path === video.path ? preview.url : null;

  const folder = `${project.userId}/${project.id}`;
  const canUpload = !sample && Boolean(project.userId) && !busy;

  async function uploadVideo(file: File) {
    if (!canUpload) return;
    setMessage(null);
    setBusy({ name: file.name, pct: 0 });
    const path = `${folder}/video/${Date.now()}-${safeFileName(file.name)}`;
    try {
      await uploadWithProgress(DELIVERY_BUCKET, path, file, (f) => setBusy({ name: file.name, pct: Math.round(f * 100) }));
      const next: DeliveryVideo = { name: file.name, path, size: file.size, type: file.type || null };
      const { error } = await createClient().from("projects").update({ delivery_video: next }).eq("id", project.id);
      if (error) throw error;
      if (video) await createClient().storage.from(DELIVERY_BUCKET).remove([video.path]);
      onChange({ deliveryVideo: next });
      setMessage(d.uploaded);
    } catch {
      setMessage(d.error);
    }
    setBusy(null);
  }

  async function removeVideo() {
    if (!video || busy || sample) return;
    setMessage(null);
    const { error } = await createClient().from("projects").update({ delivery_video: null }).eq("id", project.id);
    if (error) {
      setMessage(d.removeError);
      return;
    }
    await createClient().storage.from(DELIVERY_BUCKET).remove([video.path]);
    onChange({ deliveryVideo: null });
  }

  async function addFiles(list: File[]) {
    if (!canUpload || list.length === 0) return;
    setMessage(null);
    let files = project.files;
    try {
      for (const file of list) {
        setBusy({ name: file.name, pct: 0 });
        const path = `${folder}/files/${Date.now()}-${safeFileName(file.name)}`;
        await uploadWithProgress(DELIVERY_BUCKET, path, file, (f) => setBusy({ name: file.name, pct: Math.round(f * 100) }));
        files = [...files, { name: file.name, url: null, path, size: formatBytes(file.size) }];
        const { error } = await createClient().from("projects").update({ files: files.map(fileRow) }).eq("id", project.id);
        if (error) throw error;
        onChange({ files });
      }
      setMessage(d.uploaded);
    } catch {
      setMessage(d.error);
    }
    setBusy(null);
  }

  async function removeFile(file: ProjectFile) {
    if (busy || sample) return;
    setMessage(null);
    const files = project.files.filter((f) => f !== file);
    const { error } = await createClient().from("projects").update({ files: files.map(fileRow) }).eq("id", project.id);
    if (error) {
      setMessage(d.removeError);
      return;
    }
    if (file.path) await createClient().storage.from(DELIVERY_BUCKET).remove([file.path]);
    onChange({ files });
  }

  async function openFile(file: ProjectFile) {
    if (file.path) {
      if (!(await downloadPrivate(DELIVERY_BUCKET, file.path, file.name))) setMessage(t.team.fileError);
    } else if (file.url && file.url !== "#") {
      window.open(file.url, "_blank", "noopener");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* The finished film. */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">{d.videoTitle}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => videoInput.current?.click()} disabled={!canUpload} className={OUTLINE_BUTTON}>
              <IconUpload className="size-4" aria-hidden />
              {video ? d.replaceVideo : d.uploadVideo}
            </button>
            {video ? (
              <button type="button" onClick={() => void removeVideo()} disabled={Boolean(busy) || sample} aria-label={`${d.remove} ${video.name}`} className={ICON_BUTTON}>
                <IconTrash className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadVideo(file);
            }}
          />
        </div>
        {video ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
              {previewUrl ? (
                <video src={previewUrl} controls playsInline preload="metadata" className="absolute inset-0 size-full object-contain" />
              ) : (
                <IconMovie className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white/25" stroke={1.4} aria-hidden />
              )}
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{video.name}</p>
              <p className="text-white/45">{formatBytes(video.size)}</p>
              {project.status !== "review" && project.status !== "delivered" ? <p className="mt-2 text-white/55">{d.reviewHint}</p> : null}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/45">{sample ? d.sample : d.noVideo}</p>
        )}
      </div>

      {/* The files to download. */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">{d.filesTitle}</p>
          <button type="button" onClick={() => filesInput.current?.click()} disabled={!canUpload} className={OUTLINE_BUTTON}>
            <IconUpload className="size-4" aria-hidden />
            {d.addFiles}
          </button>
          <input
            ref={filesInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              e.target.value = "";
              void addFiles(list);
            }}
          />
        </div>
        {project.files.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">{d.noFiles}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {project.files.map((f, i) => (
              <li key={`${f.path ?? f.url}-${i}`} className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
                <IconFileDescription className="size-5 shrink-0 text-[#ffb066]" stroke={1.5} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{f.name}</span>
                  {f.size ? <span className="text-xs text-white/45">{f.size}</span> : null}
                </span>
                <button type="button" onClick={() => void openFile(f)} aria-label={`${d.download} ${f.name}`} className={ICON_BUTTON}>
                  <IconDownload className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={() => void removeFile(f)} disabled={Boolean(busy) || sample} aria-label={`${d.remove} ${f.name}`} className={ICON_BUTTON}>
                  <IconTrash className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {busy ? (
        <div role="status" className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-2 text-sm text-white/75">
            <IconLoader2 className="size-4 animate-spin text-[#ff8a1f]" aria-hidden />
            {d.uploading.replace("{name}", busy.name).replace("{pct}", String(busy.pct))}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff5e00,#ffb066)] transition-[width] duration-200" style={{ width: `${busy.pct}%` }} />
          </div>
        </div>
      ) : null}
      {message ? (
        <p role="status" className={cn("text-sm", message === d.uploaded ? "text-emerald-300" : "text-[#ffb066]")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
