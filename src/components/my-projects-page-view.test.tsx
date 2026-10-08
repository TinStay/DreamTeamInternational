import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { SAMPLE_PROJECTS } from "@/lib/client-projects-sample";
import { getDictionary } from "@/lib/i18n/config";
import { MyProjectsPageView } from "./my-projects-page-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/my-projects" }));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => null }));
vi.mock("@/components/mobile-nav", () => ({ MobileNav: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));
vi.mock("@/components/ui/gradient-blur-bg", () => ({ GradientBlurPageBg: () => null }));
vi.mock("@/components/account-side-nav", () => ({ AccountSideNav: () => null }));
vi.mock("@/components/page-breadcrumbs", () => ({ PageBreadcrumbs: () => null }));

const tb = getDictionary("en").account.projectsPage.toolbar;

afterEach(cleanup);

const titles = () => within(screen.getAllByRole("list").find((l) => l.tagName === "UL" && l.className.includes("grid"))!).getAllByRole("link").map((a) => a.textContent ?? "");

describe("Your Projects - search, filter, sort", () => {
  it("filters by where a project stands and searches by title", () => {
    render(
      <LanguageProvider>
        <MyProjectsPageView projects={SAMPLE_PROJECTS} sample />
      </LanguageProvider>
    );
    const all = titles().length;
    expect(all).toBe(SAMPLE_PROJECTS.length);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${tb.filters.delivered}`) }));
    expect(titles().length).toBe(SAMPLE_PROJECTS.filter((x) => x.status === "delivered").length);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${tb.filters.all}`) }));
    const first = SAMPLE_PROJECTS[0].title;
    fireEvent.change(screen.getByRole("textbox", { name: tb.search }), { target: { value: first.slice(0, 6) } });
    expect(titles().some((t) => t.includes(first))).toBe(true);
  });

  it("sorts by name", () => {
    render(
      <LanguageProvider>
        <MyProjectsPageView projects={SAMPLE_PROJECTS} sample />
      </LanguageProvider>
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "name" } });
    const sorted = [...SAMPLE_PROJECTS].map((x) => x.title).sort((a, b) => a.localeCompare(b));
    expect(titles().map((t) => sorted.find((s) => t.includes(s)))).toEqual(sorted);
  });
});
