// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/auth/callback` - where every sign-in lands. It must trade the code for a session, land the client on Your Projects
 * (or the page they asked for), never bounce them to another site, and send a failed sign-in home with `?auth=error`.
 */
const exchange = vi.fn<(code: string) => Promise<{ error: null | { message: string } }>>(async () => ({ error: null }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }) }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfigured: true }));

const { GET } = await import("./route");

const land = async (query: string) => {
  const res = await GET(new Request(`http://localhost:3000/auth/callback${query}`));
  return { status: res.status, to: res.headers.get("location") };
};

beforeEach(() => exchange.mockClear().mockResolvedValue({ error: null }));

describe("/auth/callback", () => {
  it("signs the client in and lands them on Your Projects by default", async () => {
    expect(await land("?code=abc")).toEqual({ status: 307, to: "http://localhost:3000/en/my-projects" });
    expect(exchange).toHaveBeenCalledWith("abc");
  });

  it("lands on the page asked for, on this site", async () => {
    expect((await land("?code=abc&next=%2Fen%2Faccount")).to).toBe("http://localhost:3000/en/account");
  });

  it("never redirects to another site, whatever `next` says", async () => {
    for (const next of ["https://evil.example", "//evil.example", "evil.example"]) {
      expect((await land(`?code=abc&next=${encodeURIComponent(next)}`)).to).toBe("http://localhost:3000/en/my-projects");
    }
  });

  it("stays on the host it was reached on (localhost in development, the live domain in production)", async () => {
    const res = await GET(new Request("https://keplerbay.com/auth/callback?code=abc"));
    expect(res.headers.get("location")).toBe("https://keplerbay.com/en/my-projects");
  });

  it("sends a failed or missing code home with ?auth=error", async () => {
    exchange.mockResolvedValueOnce({ error: { message: "expired" } });
    expect((await land("?code=old")).to).toBe("http://localhost:3000/en?auth=error");
    expect((await land("")).to).toBe("http://localhost:3000/en?auth=error");
  });
});
