import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { getDictionary } from "@/lib/i18n/config";
import { SAMPLE_PROJECTS } from "@/lib/client-projects-sample";
import type { ClientProject } from "@/lib/client-projects";
import { ProjectChanges } from "./project-changes";
import type { ChangeKind } from "@/lib/project-changes";
import { ProjectRating } from "./project-rating";

/**
 * Changing a project and rating it, as the client sees them (sample mode - nothing leaves the page). Each change opens its
 * own window that shows the price before anything is sent: $50 a day for an earlier deadline, length within the plan,
 * a format for the film's length in seconds, $49 a revision. A finished project can't be changed; an approved one can be
 * rated on quality, speed and attitude.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/my-projects/p1" }));

const p = getDictionary("en").account.projectsPage;
const c = p.changes;
afterEach(cleanup);

const project = (over: Partial<ClientProject> = {}): ClientProject => ({
  ...SAMPLE_PROJECTS[0],
  id: "p1",
  status: "production",
  approvedAt: null,
  dueDate: "2099-01-20",
  durationSeconds: 30,
  format: "16:9 horizontal",
  revisionsTotal: 2,
  revisionsUsed: 1,
  ...over,
});

function Harness({ value }: { value: ClientProject }) {
  const [open, setOpen] = useState<ChangeKind | null>(null);
  return <ProjectChanges project={value} sample open={open} onOpenChange={setOpen} />;
}
const show = (value: ClientProject) =>
  render(
    <LanguageProvider>
      <Harness value={value} />
    </LanguageProvider>
  );

const tile = (kind: keyof typeof c.kinds) => screen.getByRole("button", { name: new RegExp(c.kinds[kind].title) });

describe("ProjectChanges", () => {
  it("offers the four changes, each only at a stage where it makes sense", () => {
    show(project({ status: "brief" }));
    expect((tile("deadline") as HTMLButtonElement).disabled).toBe(false);
    expect((tile("duration") as HTMLButtonElement).disabled).toBe(false);
    expect((tile("format") as HTMLButtonElement).disabled).toBe(false);
    // Nothing to revise before there is a script.
    expect((tile("revision") as HTMLButtonElement).disabled).toBe(true);
  });

  it("prices an earlier deadline at $50 a day and a later one as free, before anything is sent", () => {
    show(project());
    fireEvent.click(tile("deadline"));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText(c.deadline.dateLabel), { target: { value: "2099-01-17" } });
    expect(dialog.getByText("$150")).toBeTruthy();
    expect(dialog.getByRole("button", { name: (n) => n.includes(c.pay.replace("{amount}", "$150")) })).toBeTruthy();

    fireEvent.change(dialog.getByLabelText(c.deadline.dateLabel), { target: { value: "2099-01-25" } });
    expect(dialog.getByText(c.free)).toBeTruthy();
    expect(dialog.getByText(c.deadline.later)).toBeTruthy();
    expect(dialog.getByRole("button", { name: new RegExp(c.send) })).toBeTruthy();
  });

  it("makes the film longer from the video time - and past it, buying the missing seconds or upgrading", () => {
    // The sample account has 45 seconds of video time; the slider goes two minutes past it.
    show(project());
    fireEvent.click(tile("duration"));
    const dialog = within(screen.getByRole("dialog"));
    const slider = dialog.getByLabelText(c.duration.add) as HTMLInputElement;
    expect(slider.max).toBe("165");
    fireEvent.change(slider, { target: { value: "15" } });
    expect(dialog.getByText(c.costSeconds.replace("{n}", "15 sec"))).toBeTruthy();
    expect(dialog.queryByRole("link", { name: new RegExp(c.duration.upgrade) })).toBeNull();

    fireEvent.change(slider, { target: { value: "60" } });
    expect(dialog.getByText(c.costMixed.replace("{n}", "45 sec").replace("{amount}", "$178.50"))).toBeTruthy();
    expect(dialog.getByText(c.duration.topupTitle.replace("{n}", "15 sec"))).toBeTruthy();
    expect(dialog.getByRole("link", { name: new RegExp(c.duration.upgrade) }).getAttribute("href")).toBe("/en/pricing?for=business");
    expect(dialog.getByRole("button", { name: (n) => n.includes(c.pay.replace("{amount}", "$178.50")) })).toBeTruthy();
  });

  it("explains when the film is already 10 minutes long", () => {
    show(project({ durationSeconds: 600 }));
    fireEvent.click(tile("duration"));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(c.duration.noRoom)).toBeTruthy();
    expect((dialog.getByRole("button", { name: new RegExp(c.send) }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("adds a format for the film's length in seconds - never one it already has - and lists the request", async () => {
    show(project());
    fireEvent.click(tile("format"));
    const dialog = within(screen.getByRole("dialog"));
    expect((dialog.getByRole("radio", { name: new RegExp(c.format.names.horizontal) }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(dialog.getByRole("radio", { name: new RegExp(c.format.names.vertical) }));
    expect(dialog.getByText(c.costSeconds.replace("{n}", "30 sec"))).toBeTruthy();
    fireEvent.click(dialog.getByRole("button", { name: new RegExp(c.send) }));
    expect(await screen.findByText(c.summary.format.replace("{format}", "9:16 vertical"))).toBeTruthy();
    expect(screen.getByText(c.status.requested)).toBeTruthy();
    // One open request of a kind at a time.
    expect((tile("format") as HTMLButtonElement).disabled).toBe(true);
  });

  it("prices one more revision at $49", () => {
    show(project({ status: "review" }));
    fireEvent.click(tile("revision"));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("$49")).toBeTruthy();
    expect(dialog.getByText("+1")).toBeTruthy();
  });

  it("can't change a finished project", () => {
    show(project({ status: "delivered", approvedAt: "2026-10-06T10:00:00Z" }));
    expect(screen.getByText(c.closed)).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(c.kinds.deadline.title) })).toBeNull();
  });
});

describe("ProjectRating", () => {
  it("rates quality, speed and attitude - all three needed - and shows the overall score", async () => {
    const r = p.rating;
    render(
      <LanguageProvider>
        <ProjectRating projectId="p1" userId="u1" sample />
      </LanguageProvider>
    );
    const submit = screen.getByRole("button", { name: new RegExp(r.submit) }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    const pick = (aspect: string, n: number) => fireEvent.click(within(screen.getByRole("radiogroup", { name: aspect })).getByRole("radio", { name: r.stars.replace("{n}", String(n)) }));
    pick(r.aspects.quality, 5);
    pick(r.aspects.speed, 4);
    expect(submit.disabled).toBe(true);
    pick(r.aspects.attitude, 5);
    expect(submit.disabled).toBe(false);
    fireEvent.change(screen.getByLabelText(r.comment), { target: { value: "Great team" } });
    fireEvent.click(submit);
    expect(await screen.findByText("4.7")).toBeTruthy();
    expect(screen.getByText(r.thanks)).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(r.edit) })).toBeTruthy();
  });
});
