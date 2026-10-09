import type { ProjectEvent } from "@/lib/email/project-notifications";

/**
 * Tells the server a project event happened, so it can email the right person (`/api/notifications/project`). Fire and
 * forget: called after the change is saved, never awaited, never shown to the user if it fails - an email is a courtesy,
 * the change itself already went through. `keepalive` lets it finish even if the page navigates away right after.
 */
export function notifyProject(projectId: string, event: ProjectEvent, extra: { commentId?: string; requestId?: string } = {}): void {
  if (typeof window === "undefined") return;
  void fetch("/api/notifications/project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, event, ...extra }),
    keepalive: true,
  }).catch(() => {});
}
