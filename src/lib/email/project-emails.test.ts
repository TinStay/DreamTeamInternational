import { describe, expect, it } from "vitest";
import { approvedEmail, requestResolvedEmail, statusEmail, submittedEmail, teamAlertEmail, teamCommentEmail } from "@/lib/email/project-emails";

const ORIGIN = "https://keplerbay.com";
const ID = "11111111-2222-3333-4444-555555555555";
const base = { id: ID, title: "Spring launch film", status: "review" as const, dueDate: "2026-10-20", durationSeconds: 60, format: "16:9", revisionsTotal: 2, revisionsUsed: 0, approvedAt: null };

describe("project emails", () => {
  it("ready for review: one Review & approve button, opening the review card on the project page", () => {
    const e = statusEmail(base, "Ana Petrova", ORIGIN)!;
    expect(e.subject).toBe("Your video is ready to review: Spring launch film");
    expect(e.html).toContain(`${ORIGIN}/en/my-projects/${ID}?action=approve`);
    expect(e.html).not.toContain("?action=revision");
    expect(e.html).not.toContain("Request a revision");
    expect(e.html).toContain("Hi Ana,");
    expect(e.html).toContain("2 of 2 revisions left");
    expect(e.text).toContain(`Review & approve: ${ORIGIN}/en/my-projects/${ID}?action=approve`);
    // Dates in the site's DD-MM-YYYY.
    expect(e.html).toContain("20-10-2026");
  });

  it("with no revisions left, says so and still offers Approve", () => {
    const e = statusEmail({ ...base, revisionsUsed: 2 }, null, ORIGIN)!;
    expect(e.html).toContain("used all your included revisions");
    expect(e.html).toContain("Hi there,");
  });

  it("tells a rework apart from first production, and says nothing for the brief", () => {
    expect(statusEmail({ ...base, status: "production" }, null, ORIGIN)!.subject).toBe("Spring launch film is in production");
    expect(statusEmail({ ...base, status: "production", revisionsUsed: 1 }, null, ORIGIN)!.subject).toBe("We're working on your revision: Spring launch film");
    expect(statusEmail({ ...base, status: "brief" }, null, ORIGIN)).toBeNull();
  });

  it("delivered and approved emails link the files, the approval also the rating", () => {
    expect(statusEmail({ ...base, status: "delivered" }, null, ORIGIN)!.html).toContain("#project-files");
    const approved = approvedEmail({ ...base, status: "delivered", approvedAt: "2026-10-09T10:00:00Z" }, null, ORIGIN);
    expect(approved.html).toContain("#project-files");
    expect(approved.html).toContain("#review");
  });

  it("escapes what clients and the team typed", () => {
    const e = teamCommentEmail({ ...base, title: "<b>Film</b>" }, "Ana", "Nikolay", "<script>alert(1)</script>", ORIGIN);
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("&lt;b&gt;Film&lt;/b&gt;");
    expect(e.html).toContain("#project-comments");
  });

  it("change requests and team alerts carry their details and links", () => {
    const declined = requestResolvedEmail(base, "Ana", { kind: "deadline", status: "declined", teamNote: "The shoot is booked." }, ORIGIN);
    expect(declined.html).toContain("an earlier deadline");
    expect(declined.html).toContain("The shoot is booked.");
    const alert = teamAlertEmail(base, { name: "Ana Petrova", email: "ana@example.com" }, { kind: "revision", note: "Make the logo bigger" }, ORIGIN);
    expect(alert.subject).toBe("Revision requested: Spring launch film (Ana Petrova)");
    expect(alert.html).toContain(`${ORIGIN}/en/admin?project=${ID}`);
    expect(alert.html).toContain("Make the logo bigger");
  });

  it("is branded: the wordmark, the orange rule, the legal line and a plain-text twin", () => {
    const e = submittedEmail({ ...base, status: "brief" }, "Ana", ORIGIN);
    expect(e.html).toContain(">Kepler<span style=\"color:#ff8a1f;\">bay</span></a>");
    expect(e.html).toContain("#ff6a14");
    expect(e.html).toContain("DT A I, trading as Keplerbay");
    expect(e.text).toContain("BRIEF RECEIVED");
    expect(e.text).not.toContain("<");
  });
});
