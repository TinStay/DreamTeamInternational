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

  it("shows an approved project as Approved - a green last step after Delivered - with no way to ask for a revision", () => {
    const base = SAMPLE_PROJECTS[0];
    const approved = { ...base, status: "delivered" as const, approvedAt: "2026-10-06T10:00:00Z", timeline: null };
    render(
      <LanguageProvider>
        <ProjectDetailView project={approved} sample />
      </LanguageProvider>
    );
    expect(screen.getAllByText(p.status.approved).length).toBeGreaterThan(0);
    expect(screen.getAllByText("06-10-2026").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: p.requestRevision })).toBeNull();
    expect(screen.queryByRole("button", { name: p.review.approve })).toBeNull();
  });

  it("offers Approve and Request a revision only while the film is in review", () => {
    const inReview = { ...SAMPLE_PROJECTS[0], status: "review" as const, approvedAt: null, revisionsTotal: 2, revisionsUsed: 0 };
    render(
      <LanguageProvider>
        <ProjectDetailView project={inReview} sample />
      </LanguageProvider>
    );
    expect(screen.getByRole("button", { name: p.review.approve })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: p.review.revision }).length).toBeGreaterThan(0);
    expect(screen.queryByText(p.status.approved)).toBeNull();
  });

  it("opens a change request from the drawer's facts - the deadline, from the Due card", () => {
    const making = { ...SAMPLE_PROJECTS[0], status: "production" as const, approvedAt: null, dueDate: "2099-01-20", timeline: null };
    render(
      <LanguageProvider>
        <ProjectDetailView project={making} sample />
      </LanguageProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${p.changes.edit}: ${p.due}`) }));
    expect(screen.getByRole("dialog", { name: p.changes.deadline.title })).toBeTruthy();
  });

  it("still lets the client approve while a revision is being made - but not ask for another", () => {
    const reworking = { ...SAMPLE_PROJECTS[0], status: "production" as const, approvedAt: null, revisionsTotal: 2, revisionsUsed: 1, timeline: null };
    render(
      <LanguageProvider>
        <ProjectDetailView project={reworking} sample />
      </LanguageProvider>
    );
    expect(screen.getByText(p.review.reworkTitle)).toBeTruthy();
    expect(screen.getByRole("button", { name: p.review.approve })).toBeTruthy();
    expect(screen.queryByRole("button", { name: p.review.revision })).toBeNull();
  });
});
