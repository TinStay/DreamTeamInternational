import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { SAMPLE_PROJECTS } from "@/lib/client-projects-sample";
import { getDictionary } from "@/lib/i18n/config";
import type { ProjectStatus } from "@/lib/client-projects";
import { ProjectPopupFrame } from "./project-popup";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/my-projects" }));

const p = getDictionary("en").account.projectsPage;
const labels = p.status as Record<ProjectStatus, string>;

afterEach(cleanup);

describe("ProjectPopupFrame", () => {
  it("is one page - files, timeline, film, comments - with no tab bar", () => {
    const project = SAMPLE_PROJECTS.find((x) => x.status !== "delivered") ?? SAMPLE_PROJECTS[0];
    render(
      <LanguageProvider>
        <ProjectPopupFrame project={project} statusLabels={labels} onClose={() => {}} sample />
      </LanguageProvider>
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    for (const title of [p.tabs.files, p.tabs.timeline, p.videoFile, p.tabs.comments]) {
      expect(screen.getByRole("heading", { name: new RegExp(`^${title}`) })).toBeTruthy();
    }
    // The fourth fact is the revisions left, not the start date.
    expect(screen.getAllByText(p.revisionsLeft).length).toBeGreaterThan(0);
    expect(screen.queryByText(p.started)).toBeNull();
  });
});
