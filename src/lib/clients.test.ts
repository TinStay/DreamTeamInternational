import { describe, expect, it } from "vitest";
import { clientFromRow, clientLabel, ledgerFromRow, profilePatch } from "@/lib/clients";

describe("clients", () => {
  it("reads a client_overview row (numbers may arrive as strings, unknown plans dropped)", () => {
    const c = clientFromRow({ id: "u1", email: "a@b.example", full_name: null, balance_seconds: "36000", project_count: 2, open_projects: 1, plan_key: "nope", is_team: false, created_at: "2026-10-06T00:00:00Z", last_activity: null });
    expect(c).toMatchObject({ id: "u1", balanceSeconds: 36000, projectCount: 2, openProjects: 1, planKey: null, fullName: null });
    expect(clientFromRow({ id: "u2", plan_key: "creator" }).planKey).toBe("creator");
  });

  it("labels a client by name, else the email's local part", () => {
    expect(clientLabel({ fullName: "Maria", email: "m@x.example" }, "?")).toBe("Maria");
    expect(clientLabel({ fullName: null, email: "maria@x.example" }, "?")).toBe("maria");
    expect(clientLabel({ fullName: null, email: null }, "?")).toBe("?");
  });

  it("saves blank profile fields as null", () => {
    expect(profilePatch({ fullName: " Ana ", company: "", phone: " ", country: "BG" })).toEqual({ full_name: "Ana", company: null, phone: null, country: "BG" });
  });

  it("reads a ledger row", () => {
    expect(ledgerFromRow({ id: "l1", seconds: -30, kind: "spend", created_at: "2026-10-01" })).toMatchObject({ seconds: -30, kind: "spend", note: null });
  });
});
