import { describe, expect, it } from "vitest";

import { EMAIL_RE } from "@/lib/server/form-guards";
import {
  QUOTE_FORM_DEFAULTS,
  isQuoteStepValid,
  type QuoteFormData,
} from "./constants";

function withData(patch: Partial<QuoteFormData>): QuoteFormData {
  return { ...QUOTE_FORM_DEFAULTS, ...patch };
}

describe("isQuoteStepValid", () => {
  it("script: requires a choice", () => {
    expect(isQuoteStepValid("script", QUOTE_FORM_DEFAULTS, EMAIL_RE)).toBe(false);
    expect(isQuoteStepValid("script", withData({ script: "none" }), EMAIL_RE)).toBe(true);
  });

  it("goal: requires a goal", () => {
    expect(isQuoteStepValid("goal", QUOTE_FORM_DEFAULTS, EMAIL_RE)).toBe(false);
    expect(isQuoteStepValid("goal", withData({ goal: "sales" }), EMAIL_RE)).toBe(true);
  });

  it("video: requires a format AND a voice-over answer", () => {
    expect(isQuoteStepValid("video", withData({ formats: ["vertical"] }), EMAIL_RE)).toBe(false);
    expect(isQuoteStepValid("video", withData({ voiceover: "no" }), EMAIL_RE)).toBe(false);
    expect(
      isQuoteStepValid("video", withData({ formats: ["vertical"], voiceover: "no" }), EMAIL_RE)
    ).toBe(true);
  });

  it("details: is always passable (all fields optional)", () => {
    expect(isQuoteStepValid("details", QUOTE_FORM_DEFAULTS, EMAIL_RE)).toBe(true);
  });

  it("contact: requires name, a valid email and accepted terms", () => {
    const filled = withData({ name: "Тест", email: "t@e.io", termsAccepted: true });
    expect(isQuoteStepValid("contact", filled, EMAIL_RE)).toBe(true);
    expect(isQuoteStepValid("contact", { ...filled, email: "nope" }, EMAIL_RE)).toBe(false);
    expect(isQuoteStepValid("contact", { ...filled, termsAccepted: false }, EMAIL_RE)).toBe(false);
    expect(isQuoteStepValid("contact", { ...filled, name: "  " }, EMAIL_RE)).toBe(false);
  });
});
