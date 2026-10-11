import { describe, expect, it } from "vitest";
import { loginPath, safeNextPath } from "@/lib/routes";

describe("safeNextPath", () => {
  it("keeps a path on this site", () => {
    expect(safeNextPath("/en/my-projects/abc?action=approve")).toBe("/en/my-projects/abc?action=approve");
  });

  it("refuses anything that could leave the site", () => {
    for (const bad of ["https://evil.example", "//evil.example", String.raw`/\evil.example`, "javascript:alert(1)", "/x:y", "", null, undefined]) {
      expect(safeNextPath(bad)).toBeNull();
    }
  });

  it("builds the log-in link that returns to it", () => {
    expect(loginPath("en", "/en/team?project=1")).toBe("/en?login=1&next=%2Fen%2Fteam%3Fproject%3D1");
  });
});
