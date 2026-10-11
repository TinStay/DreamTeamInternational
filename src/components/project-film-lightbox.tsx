"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconLoader2, IconX } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StatusChip } from "@/components/project-status-chip";
import { useLanguage } from "@/lib/i18n/language-context";
import { DELIVERY_BUCKET, isApproved, projectFilm, statusLabelOf, projectPoster, type ClientProject, type ProjectStatus } from "@/lib/client-projects";
import { signedUrl } from "@/lib/supabase/storage";

/**
 * A project's film, played large over Your Projects - the cards' play button opens it, so a film can be watched without
 * leaving the list. An uploaded film plays through a signed link (fetched when it opens); an older row's or a sample's
 * from Bunny. Under it: the title, the stage and the way into the project's page.
 */
export function ProjectFilmLightbox({ project, href, sample, onClose }: { project: ClientProject | null; href: string; sample: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const p = t.account.projectsPage;
  const statusLabels = p.status as Record<ProjectStatus, string>;
  const delivery = project?.deliveryVideo ?? null;
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (sample || !delivery) return;
    let alive = true;
    void signedUrl(DELIVERY_BUCKET, delivery.path, 3600).then((url) => {
      if (alive && url) setSigned({ path: delivery.path, url });
    });
    return () => {
      alive = false;
    };
  }, [sample, delivery]);

  const film = project ? (delivery && !sample ? (signed?.path === delivery.path ? signed.url : null) : projectFilm(project)) : null;

  return (
    <Dialog open={project !== null} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent showCloseButton={false} className="w-[min(96vw,72rem)] max-w-none gap-0 rounded-2xl border-0 bg-[#0c0d10] p-0 text-white ring-white/15 sm:max-w-none">
        {project ? (
          <>
            {/* First in the DOM, so the dialog's initial focus lands here, not in the player. */}
            <button
              type="button"
              onClick={onClose}
              aria-label={p.close}
              className="absolute -top-3 -right-3 z-[1] grid size-11 cursor-pointer place-items-center rounded-full bg-white text-neutral-900 shadow-lg transition-transform duration-200 ease-out hover:scale-105 sm:-top-4 sm:-right-4"
            >
              <IconX className="size-5" aria-hidden />
            </button>
            <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-black">
              {film ? (
                <video key={film} src={film} poster={projectPoster(project) ?? undefined} controls autoPlay playsInline className="absolute inset-0 size-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/60">
                  <IconLoader2 className="size-5 animate-spin text-[#ff8a1f]" aria-hidden />
                  {p.loadingVideo}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <StatusChip status={project.status} label={statusLabelOf(project, statusLabels)} approved={isApproved(project)} />
                <DialogTitle className="mt-2 font-heading text-lg font-black uppercase">{project.title}</DialogTitle>
                <DialogDescription className="sr-only">{p.panelDescription}</DialogDescription>
              </div>
              <Link
                href={href}
                className="group inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-5 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5"
              >
                {p.openProject}
                <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
