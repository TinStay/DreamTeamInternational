import { beforeEach, describe, expect, it } from "vitest";

import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  deniedCategories,
  parseConsent,
  purgeVendorStorage,
  readConsent,
  serializeConsent,
  withdrawn,
  writeConsent,
  type Consent,
} from "./consent";

function clearCookies() {
  for (const part of document.cookie.split("; ")) {
    const name = part.split("=")[0];
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

const cookieNames = () =>
  document.cookie
    .split("; ")
    .map((part) => part.split("=")[0])
    .filter(Boolean);

beforeEach(() => {
  clearCookies();
  localStorage.clear();
  sessionStorage.clear();
});

describe("the consent cookie", () => {
  it("round-trips a choice", () => {
    expect(readConsent()).toBeNull();
    const written = writeConsent({ analytics: true, marketing: false });
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=`);
    expect(readConsent()).toEqual(written);
    expect(written).toMatchObject({ version: CONSENT_VERSION, analytics: true, marketing: false });
    expect(Number.isNaN(Date.parse(written.at))).toBe(false);
  });

  it("serialises compactly and parses back", () => {
    const consent: Consent = { version: CONSENT_VERSION, analytics: false, marketing: true, at: "2026-09-22T10:00:00.000Z" };
    expect(serializeConsent(consent)).toBe(encodeURIComponent('{"v":1,"a":0,"m":1,"t":"2026-09-22T10:00:00.000Z"}'));
    expect(parseConsent(serializeConsent(consent))).toEqual(consent);
  });

  it("treats garbage, a missing value and an older version as no choice", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent("not json")).toBeNull();
    expect(parseConsent(encodeURIComponent('{"v":1,"a":1,"m":1}'))).toBeNull();
    const older = { v: CONSENT_VERSION - 1, a: 1, m: 1, t: "2026-01-01T00:00:00.000Z" };
    expect(parseConsent(encodeURIComponent(JSON.stringify(older)))).toBeNull();
  });
});

describe("withdrawn", () => {
  const decided = (analytics: boolean, marketing: boolean): Consent => ({ version: CONSENT_VERSION, analytics, marketing, at: "" });

  it("is never a withdrawal without a previous choice", () => {
    expect(withdrawn(null, { analytics: false, marketing: false })).toBe(false);
  });

  it("is a withdrawal only when a granted category is taken away", () => {
    expect(withdrawn(decided(true, true), { analytics: true, marketing: true })).toBe(false);
    expect(withdrawn(decided(false, false), { analytics: true, marketing: true })).toBe(false);
    expect(withdrawn(decided(true, false), { analytics: false, marketing: true })).toBe(true);
    expect(withdrawn(decided(true, true), { analytics: true, marketing: false })).toBe(true);
  });
});

describe("purgeVendorStorage", () => {
  it("removes the vendors' cookies and storage and keeps the site's own", () => {
    document.cookie = "_gcl_au=1.1.1804602367; Path=/";
    document.cookie = "__obref=7087ecca; Path=/";
    document.cookie = "ph_phc_key_posthog=%7B%7D; Path=/";
    writeConsent({ analytics: false, marketing: false });
    localStorage.setItem("app-lang", "bg");
    localStorage.setItem("theme", "dark");
    localStorage.setItem("_gcl_ls", "x");
    localStorage.setItem("ph_phc_key_posthog", "{}");
    sessionStorage.setItem("oaiq_cs:9vxEQCFdaKzy9yXADo8cMC", "1");
    sessionStorage.setItem("ph_phc_key_window_id", "w");

    purgeVendorStorage();

    expect(cookieNames()).toEqual([CONSENT_COOKIE]);
    expect(localStorage.getItem("app-lang")).toBe("bg");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("_gcl_ls")).toBeNull();
    expect(localStorage.getItem("ph_phc_key_posthog")).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("purges only the categories it is given", () => {
    document.cookie = "_gcl_au=1.1.1804602367; Path=/";
    document.cookie = "ph_phc_key_posthog=%7B%7D; Path=/";
    localStorage.setItem("ph_phc_key_posthog", "{}");
    sessionStorage.setItem("oaiq_cs:9vxEQCFdaKzy9yXADo8cMC", "1");

    purgeVendorStorage(["marketing"]);

    expect(cookieNames()).toEqual(["ph_phc_key_posthog"]);
    expect(localStorage.getItem("ph_phc_key_posthog")).toBe("{}");
    expect(sessionStorage.length).toBe(0);
  });
});

describe("deniedCategories", () => {
  it("lists what a choice leaves out", () => {
    expect(deniedCategories({ analytics: true, marketing: true })).toEqual([]);
    expect(deniedCategories({ analytics: true, marketing: false })).toEqual(["marketing"]);
    expect(deniedCategories({ analytics: false, marketing: false })).toEqual(["analytics", "marketing"]);
  });
});
