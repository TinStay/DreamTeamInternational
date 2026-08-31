import { describe, expect, it } from "vitest";

import { formatDateDisplay, ISO_DATE_RE } from "./dates";

describe("formatDateDisplay", () => {
  it("converts ISO dates to the DD-MM-YYYY display format", () => {
    expect(formatDateDisplay("2026-09-05")).toBe("05-09-2026");
    expect(formatDateDisplay("2026-12-31")).toBe("31-12-2026");
  });

  it("passes non-ISO input through unchanged", () => {
    expect(formatDateDisplay("")).toBe("");
    expect(formatDateDisplay("05-09-2026")).toBe("05-09-2026");
  });
});

describe("ISO_DATE_RE", () => {
  it("anchors the whole string", () => {
    expect(ISO_DATE_RE.test("2026-09-05")).toBe(true);
    expect(ISO_DATE_RE.test("x2026-09-05")).toBe(false);
    expect(ISO_DATE_RE.test("2026-09-05x")).toBe(false);
  });
});
