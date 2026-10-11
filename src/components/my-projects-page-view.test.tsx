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
// The dropdown itself is base-ui's listbox (popups, positioning) - here a plain stand-in, to test the page's sorting.
vi.mock("@/components/ui/pill-select", () => ({
  PillSelect: ({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) => (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const tb = getDictionary("en").account.projectsPage.toolbar;

afterEach(cleanup);

const grid = () => screen.getAllByRole("list").find((l) => l.tagName === "UL" && l.className.includes("grid"))!;
// The project cards' links (not the "Leave a review" CTAs beside them).
const titles = () => within(grid()).getAllByRole("link").filter((a) => !a.getAttribute("href")?.endsWith("#review")).map((a) => a.textContent ?? "");
const p = getDictionary("en").account.projectsPage;

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

  it("sorts by name from the sort field on the filters' row", () => {
    render(
      <LanguageProvider>
        <MyProjectsPageView projects={SAMPLE_PROJECTS} sample />
      </LanguageProvider>
    );
    // No "Sort by" caption - the field alone, named for assistive tech.
    expect(screen.queryByText(tb.sortLabel)).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: tb.sortLabel }), { target: { value: "name" } });
    const sorted = [...SAMPLE_PROJECTS].map((x) => x.title).sort((a, b) => a.localeCompare(b));
    expect(titles().map((t) => sorted.find((s) => t.includes(s)))).toEqual(sorted);
  });

  it("drops the status under the title, and offers a review on an approved film that is not rated yet", () => {
    const approved = { ...SAMPLE_PROJECTS[0], id: "a1", title: "Approved Film", status: "delivered" as const, approvedAt: "2026-10-06T10:00:00Z", reviewed: false };
    const rated = { ...approved, id: "a2", title: "Rated Film", reviewed: true };
    const making = { ...SAMPLE_PROJECTS[0], id: "m1", title: "Being Made", status: "production" as const, approvedAt: null };
    render(
      <LanguageProvider>
        <MyProjectsPageView projects={[approved, rated, making]} sample />
      </LanguageProvider>
    );
    const ctas = screen.getAllByRole("link", { name: p.rating.cta });
    expect(ctas).toHaveLength(1);
    expect(ctas[0].getAttribute("href")).toBe("/en/my-projects/a1?sample=1#review");
    // The stage reads once per card - on the chip - not again in the card's bottom row.
    const card = screen.getByRole("link", { name: /Being Made/ });
    expect(within(card).getAllByText(p.status.production)).toHaveLength(1);
  });
});
