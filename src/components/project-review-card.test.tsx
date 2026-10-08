import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { getDictionary } from "@/lib/i18n/config";
import { projectFromRow, type ClientProject } from "@/lib/client-projects";
import { ProjectReviewCard } from "./project-review-card";

/**
 * The client's answer to a video in review - the one place a client changes a project. Approve and Request a revision
 * go through `client_project_action()`; a revision needs a note, uses up one included revision and is posted as a
 * comment so the team sees it.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/my-projects/p1" }));

const supabase = vi.hoisted(() => ({
  rpc: vi.fn(),
  inserted: [] as Record<string, unknown>[],
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: supabase.rpc,
    auth: { getUser: async () => ({ data: { user: { id: "u1", email: "client@example.com", user_metadata: { full_name: "Client Name" } } } }) },
    from: () => ({ insert: async (row: Record<string, unknown>) => (supabase.inserted.push(row), { error: null }) }),
  }),
}));

const r = getDictionary("en").account.projectsPage.review;
const prefix = getDictionary("en").account.projectsPage.comments.revisionPrefill;
const project = (over: Record<string, unknown> = {}) => projectFromRow({ id: "p1", title: "Summer Sale Reel", status: "review", revisions_total: 2, revisions_used: 0, created_at: "2026-10-01T09:00:00Z", ...over });

function Harness({ value, onDone }: { value: ClientProject; onDone: (p: ClientProject, notice: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <LanguageProvider>
      <ProjectReviewCard project={value} sample={false} revisionOpen={open} onRevisionOpen={setOpen} onDone={onDone} />
    </LanguageProvider>
  );
}

beforeEach(() => {
  supabase.rpc.mockReset();
  supabase.inserted.length = 0;
});
afterEach(cleanup);

describe("ProjectReviewCard", () => {
  it("approves the video through the RPC and hands back the delivered project", async () => {
    supabase.rpc.mockResolvedValue({ data: { id: "p1", title: "Summer Sale Reel", status: "delivered", approved_at: "2026-10-07T10:00:00Z" }, error: null });
    const onDone = vi.fn();
    render(<Harness value={project()} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: r.approve }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(supabase.rpc).toHaveBeenCalledWith("client_project_action", { p_id: "p1", p_action: "approve", p_note: null });
    expect(onDone.mock.calls[0][0]).toMatchObject({ status: "delivered", approvedAt: "2026-10-07T10:00:00Z" });
    expect(onDone.mock.calls[0][1]).toBe(r.approvedNotice);
    expect(supabase.inserted).toHaveLength(0);
  });

  it("asks for a note before a revision, sends it, and posts it as a comment", async () => {
    supabase.rpc.mockResolvedValue({ data: { id: "p1", status: "production", revisions_used: 1 }, error: null });
    const onDone = vi.fn();
    render(<Harness value={project()} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: r.revision }));
    const send = screen.getByRole("button", { name: r.send });
    expect((send as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(r.revisionLabel), { target: { value: "  Make the logo bigger at 0:12  " } });
    fireEvent.click(send);
    await waitFor(() => expect(onDone).toHaveBeenCalled());

    expect(supabase.rpc).toHaveBeenCalledWith("client_project_action", { p_id: "p1", p_action: "revision", p_note: "Make the logo bigger at 0:12" });
    expect(supabase.inserted).toEqual([expect.objectContaining({ project_id: "p1", user_id: "u1", is_team: false, body: `${prefix}Make the logo bigger at 0:12` })]);
    expect(onDone.mock.calls[0][1]).toBe(r.revisionNotice);
  });

  it("offers no revision once the included ones are used up", () => {
    render(<Harness value={project({ revisions_used: 2 })} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: r.revision }));
    expect(screen.getByText(r.noneLeft)).toBeTruthy();
    expect(screen.queryByRole("button", { name: r.send })).toBeNull();
  });

  it("says so when the server refuses (no revisions left), and changes nothing", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "no_revisions_left" } });
    const onDone = vi.fn();
    render(<Harness value={project()} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: r.revision }));
    fireEvent.change(screen.getByLabelText(r.revisionLabel), { target: { value: "One more change" } });
    fireEvent.click(screen.getByRole("button", { name: r.send }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(r.noneLeft));
    expect(onDone).not.toHaveBeenCalled();
    expect(supabase.inserted).toHaveLength(0);
  });

  it("explains when the project has already been approved (e.g. in another tab), and posts no comment", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "already_approved" } });
    const onDone = vi.fn();
    render(<Harness value={project()} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: r.revision }));
    fireEvent.change(screen.getByLabelText(r.revisionLabel), { target: { value: "Late change" } });
    fireEvent.click(screen.getByRole("button", { name: r.send }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(r.moved));
    expect(onDone).not.toHaveBeenCalled();
    expect(supabase.inserted).toHaveLength(0);
  });
});
