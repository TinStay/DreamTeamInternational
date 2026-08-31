import { describe, expect, it } from "vitest";

import {
  FORMAT_OPTIONS,
  GOAL_OPTIONS,
  LENGTH_SLIDER,
  LENGTH_TICKS,
  PLATFORM_OPTIONS,
  QUOTE_FORM_DEFAULTS,
  QUOTE_STEPS,
  SCRIPT_OPTIONS,
  UPLOAD_ACCEPT,
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_MAX_TOTAL_BYTES,
  VOICEOVER_OPTIONS,
  formatLengthSec,
  isAllowedUploadName,
} from "./constants";

const BG_UNITS = { seconds: "сек", minutes: "мин", lengthMax: "5+ мин" };

describe("LENGTH_TICKS", () => {
  it("steps by 5s up to one minute", () => {
    const belowMinute = LENGTH_TICKS.filter((t) => t <= 60);
    expect(belowMinute).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
  });

  it("steps by 10s after one minute up to five minutes", () => {
    const above = LENGTH_TICKS.filter((t) => t > 60 && t <= 300);
    expect(above[0]).toBe(70);
    expect(above.at(-1)).toBe(300);
    for (let i = 1; i < above.length; i++) {
      expect(above[i] - above[i - 1]).toBe(10);
    }
  });

  it('ends with the "5+ min" sentinel and contains the default', () => {
    expect(LENGTH_TICKS.at(-1)).toBe(LENGTH_SLIDER.max);
    expect(LENGTH_TICKS).toContain(LENGTH_SLIDER.default);
  });

  it("is strictly increasing (index-based slider requirement)", () => {
    for (let i = 1; i < LENGTH_TICKS.length; i++) {
      expect(LENGTH_TICKS[i]).toBeGreaterThan(LENGTH_TICKS[i - 1]);
    }
  });
});

describe("formatLengthSec", () => {
  it("formats sub-minute values in seconds", () => {
    expect(formatLengthSec(45, BG_UNITS)).toBe("45 сек");
    expect(formatLengthSec(5, BG_UNITS)).toBe("5 сек");
  });

  it("formats minute values as M:SS", () => {
    expect(formatLengthSec(60, BG_UNITS)).toBe("1:00 мин");
    expect(formatLengthSec(90, BG_UNITS)).toBe("1:30 мин");
    expect(formatLengthSec(300, BG_UNITS)).toBe("5:00 мин");
  });

  it("renders the max tick as the open-ended label", () => {
    expect(formatLengthSec(LENGTH_SLIDER.max, BG_UNITS)).toBe("5+ мин");
  });
});

describe("isAllowedUploadName", () => {
  it("accepts script document types", () => {
    for (const name of ["script.pdf", "сюжет.docx", "idea.DOC", "notes.txt", "logo.png"]) {
      expect(isAllowedUploadName(name), name).toBe(true);
    }
  });

  it("rejects executables and unknown types", () => {
    for (const name of ["evil.exe", "video.mp4", "archive.zip", "noext"]) {
      expect(isAllowedUploadName(name), name).toBe(false);
    }
  });

  it("judges only the final extension (no double-extension bypass)", () => {
    expect(isAllowedUploadName("script.pdf.exe")).toBe(false);
  });
});

describe("upload limits", () => {
  it("stays under the Vercel 4.5 MB request-body ceiling", () => {
    expect(UPLOAD_MAX_TOTAL_BYTES).toBeLessThan(4_500_000);
  });

  it("keeps the accept attribute in sync with the extension allowlist", () => {
    const fromAccept = UPLOAD_ACCEPT.split(",").map((s) => s.trim().replace(/^\./, ""));
    expect([...fromAccept].sort()).toEqual([...UPLOAD_ALLOWED_EXTENSIONS].sort());
  });
});

describe("catalogue integrity", () => {
  it("option keys are unique within each group", () => {
    for (const group of [SCRIPT_OPTIONS, GOAL_OPTIONS, FORMAT_OPTIONS, VOICEOVER_OPTIONS, PLATFORM_OPTIONS]) {
      const keys = group.map((o) => o.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("defaults start every choice empty and the slider on a real tick", () => {
    expect(QUOTE_FORM_DEFAULTS.script).toBe("");
    expect(QUOTE_FORM_DEFAULTS.goal).toBe("");
    expect(QUOTE_FORM_DEFAULTS.formats).toEqual([]);
    expect(QUOTE_FORM_DEFAULTS.termsAccepted).toBe(false);
    expect(LENGTH_TICKS).toContain(QUOTE_FORM_DEFAULTS.lengthSec);
  });

  it("has five steps ending on contact", () => {
    expect(QUOTE_STEPS).toHaveLength(5);
    expect(QUOTE_STEPS.at(-1)).toBe("contact");
  });
});
