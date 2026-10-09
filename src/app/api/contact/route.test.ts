// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/contact` - every contact and training inquiry. Bots get a quiet fake success, required fields are checked on the
 * server, a burst from one address is slowed, nothing a visitor types can inject markup or mail headers, and a failed
 * send is never reported as sent.
 */
const send = vi.hoisted(() => vi.fn(async (...args: [Record<string, unknown>]): Promise<{ data: { id: string } | null; error: unknown }> => (void args, { data: { id: "email-1" }, error: null })));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const { POST } = await import("./route");

let ip = 0;
const post = (body: unknown, from = `10.0.0.${++ip}`) =>
  POST(new Request("http://localhost:3000/api/contact", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers: { "Content-Type": "application/json", "x-forwarded-for": from } }));

const valid = { name: "Ann Client", email: "ann@example.com", message: "We need a 30-second product video." };

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  send.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("/api/contact", () => {
  it("sends a valid inquiry to the inbox, with the visitor as reply-to", async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: "email-1" });
    expect(send.mock.calls[0][0]).toMatchObject({ to: ["info@dreamteamvideo.com"], replyTo: "ann@example.com" });
  });

  it("names the missing or invalid fields (422) and sends nothing", async () => {
    const res = await post({ name: "", email: "not-an-email", message: "  " });
    expect(res.status).toBe(422);
    expect((await res.json()).fields).toEqual(["name", "email", "message"]);
    expect(send).not.toHaveBeenCalled();
  });

  it("gives a bot that fills the honeypot a fake success and sends nothing", async () => {
    expect(await (await post({ ...valid, website: "http://spam.example" })).json()).toEqual({ ok: true, id: null });
    expect(send).not.toHaveBeenCalled();
  });

  it("refuses a broken body (400) and is honest when email is not set up (500)", async () => {
    expect((await post("{oops")).status).toBe(400);
    delete process.env.RESEND_API_KEY;
    expect((await post(valid)).status).toBe(500);
  });

  it("escapes markup in the email and keeps line breaks out of the subject (header injection)", async () => {
    await post({ ...valid, name: "<script>alert(1)</script>", subject: "Hi\r\nBcc: victim@example.com" });
    const msg = send.mock.calls[0][0] as { html: string; subject: string };
    expect(msg.html).not.toContain("<script>");
    expect(msg.html).toContain("&lt;script&gt;");
    expect(msg.subject).not.toMatch(/[\r\n]/);
  });

  it("never reports success when Resend fails", async () => {
    send.mockResolvedValueOnce({ data: null, error: { message: "domain not verified" } });
    expect((await post(valid)).status).toBe(502);
    send.mockRejectedValueOnce(new Error("network"));
    const res = await post(valid);
    expect(res.status).toBe(502);
    expect((await res.json()).ok).toBe(false);
  });

  it("slows a burst from one address (429)", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await post(valid, "203.0.113.9")).status);
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});
