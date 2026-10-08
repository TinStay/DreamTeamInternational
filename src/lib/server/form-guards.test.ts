import { describe, expect, it } from "vitest";
import { EMAIL_RE, clean, cleanMultiline, clientIp, createRateLimiter, escapeHtml, isCrossSite } from "./form-guards";

/**
 * The request hygiene every form and payment route leans on: no header injection through a field, no markup in an
 * email, bursts blunted, and no state change from another site riding the visitor's cookies.
 */
const req = (headers: Record<string, string>, url = "https://www.dreamteamvideo.com/api/subscription") => new Request(url, { method: "POST", headers });

describe("clean / cleanMultiline", () => {
  it("strips line breaks and control characters (header injection), trims and caps", () => {
    expect(clean("  Ann\r\nBcc: evil@x.com\t\0 ", 100)).toBe("Ann Bcc: evil@x.com");
    expect(clean("abcdef", 3)).toBe("abc");
    expect(clean(42, 10)).toBe("");
    expect(clean(undefined, 10)).toBe("");
  });

  it("keeps newlines in free text but drops NUL bytes", () => {
    expect(cleanMultiline("line 1\nline 2\0", 100)).toBe("line 1\nline 2");
  });
});

describe("escapeHtml", () => {
  it("neutralises markup and attribute breakouts", () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe("&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;");
  });
});

describe("EMAIL_RE", () => {
  it("accepts an address and refuses junk", () => {
    expect(EMAIL_RE.test("client@example.com")).toBe(true);
    for (const bad of ["client", "client@", "@example.com", "a b@example.com", "client@example"]) expect(EMAIL_RE.test(bad)).toBe(false);
  });
});

describe("clientIp", () => {
  it("takes the first forwarded address, then x-real-ip", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(req({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(req({}))).toBe("unknown");
  });
});

describe("createRateLimiter", () => {
  it("allows `max` hits per window per source, then refuses until the window has passed", () => {
    const limited = createRateLimiter(60_000, 2);
    expect(limited("a", 0)).toBe(false);
    expect(limited("a", 1)).toBe(false);
    expect(limited("a", 2)).toBe(true);
    // Another source has its own budget.
    expect(limited("b", 2)).toBe(false);
    // A minute later the old hits have expired.
    expect(limited("a", 60_003)).toBe(false);
  });

  it("forgets quiet sources once it holds many, and still limits a busy one", () => {
    const limited = createRateLimiter(1_000, 1);
    for (let i = 0; i < 5_001; i++) limited(`ip-${i}`, 0);
    expect(limited("busy", 5_000)).toBe(false);
    expect(limited("busy", 5_001)).toBe(true);
  });
});

describe("isCrossSite", () => {
  it("lets our own pages through", () => {
    expect(isCrossSite(req({ origin: "https://www.dreamteamvideo.com" }))).toBe(false);
    expect(isCrossSite(req({ "sec-fetch-site": "same-origin" }))).toBe(false);
    expect(isCrossSite(req({ origin: "http://localhost:3001" }, "http://localhost:3001/api/checkout"))).toBe(false);
  });

  it("refuses another site, a look-alike host, plain http and a garbage origin", () => {
    expect(isCrossSite(req({ origin: "https://evil.example" }))).toBe(true);
    expect(isCrossSite(req({ origin: "https://www.dreamteamvideo.com.evil.example" }))).toBe(true);
    expect(isCrossSite(req({ origin: "http://www.dreamteamvideo.com" }))).toBe(true);
    expect(isCrossSite(req({ origin: "null" }))).toBe(true);
    expect(isCrossSite(req({ "sec-fetch-site": "cross-site" }))).toBe(true);
    expect(isCrossSite(req({ "sec-fetch-site": "same-site" }))).toBe(true);
  });

  it("lets a request without browser headers through (it still needs the session cookie)", () => {
    expect(isCrossSite(req({}))).toBe(false);
  });
});
