import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { SAMPLE_PROJECTS } from "@/lib/client-projects-sample";
import { getDictionary } from "@/lib/i18n/config";
import { ProjectDetailView } from "./project-detail-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/my-projects/p1" }));
// The page chrome is not under test here (and pulls in browser-only pieces).
vi.mock("@/components/site-header", () => ({ SiteHeader: () => null }));
vi.mock("@/components/mobile-nav", () => ({ MobileNav: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));
vi.mock("@/components/ui/gradient-blur-bg", () => ({ GradientBlurPageBg: () => null }));

const p = getDictionary("en").account.projectsPage;

afterEach(cleanup);

describe("ProjectDetailView", () => {
  const project = SAMPLE_PROJECTS.find((x) => x.status !== "delivered") ?? SAMPLE_PROJECTS[0];

  function renderPage() {
    return render(
      <LanguageProvider>
        <ProjectDetailView project={project} sample />
      </LanguageProvider>
    );
  }

  it("is its own page: a way back, the title, and every section - no dialog, no tab bar", () => {
    renderPage();
    expect(screen.getByRole("link", { name: new RegExp(p.backToAll) }).getAttribute("href")).toBe("/en/my-projects?sample=1");
    expect(screen.getByRole("heading", { level: 1, name: project.title })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    for (const title of [p.tabs.files, p.tabs.timeline, p.videoFile, p.tabs.comments]) {
      expect(screen.getByRole("heading", { name: new RegExp(`^${title}`) })).toBeTruthy();
    }
  });

  it("lets the drawer be resized from the keyboard, within its limits", () => {
    renderPage();
    const edge = screen.getByRole("separator", { name: p.resizeDrawer });
    const before = Number(edge.getAttribute("aria-valuenow"));
    fireEvent.keyDown(edge, { key: "ArrowLeft" });
    expect(Number(edge.getAttribute("aria-valuenow"))).toBeLessThan(before);
    for (let i = 0; i < 40; i++) fireEvent.keyDown(edge, { key: "ArrowLeft" });
    expect(Number(edge.getAttribute("aria-valuenow"))).toBe(Number(edge.getAttribute("aria-valuemin")));
  });
});
