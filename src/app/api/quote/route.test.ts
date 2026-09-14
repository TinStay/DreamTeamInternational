// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vi.fn(async (_input: unknown) => ({ data: { id: "email-1" }, error: null }))
);

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { POST } from "./route";

process.env.RESEND_API_KEY = "test-key";

let ipCounter = 0;

/** Build a multipart request; unique IP per call so the rate limiter stays out of the way. */
function makeRequest(
  payload: unknown,
  files: { field: string; name: string; content?: string }[] = []
): Request {
  const fd = new FormData();
  fd.append(
    "payload",
    typeof payload === "string" ? payload : JSON.stringify(payload)
  );
  for (const f of files) {
    fd.append(f.field, new File([f.content ?? "content"], f.name));
  }
  ipCounter += 1;
  return new Request("http://localhost/api/quote", {
    method: "POST",
    body: fd,
    headers: { "x-forwarded-for": `10.0.0.${ipCounter}` },
  });
}

const validPayload = {
  name: "Тест Тестов",
  email: "test@example.com",
  termsAccepted: true,
  script: "ready",
  goal: "other",
  goalOther: "обучение на екипа",
  lengthSec: 90,
  lengthFlexible: false,
  formats: ["vertical"],
  voiceover: "yes",
  refLinks: "https://example.com/video",
  platforms: ["instagram", "youtube"],
  deadline: "2026-09-05",
  deadlineFlexible: false,
  notes: "бележка",
  phone: "+359881234567",
  company: "Тест ООД",
  foundUs: "google",
  language: "bg",
  website: "",
};

beforeEach(() => {
  sendMock.mockClear();
});

describe("POST /api/quote", () => {
  it("pretends success on the honeypot without sending an email", async () => {
    const res = await POST(makeRequest({ ...validPayload, website: "bot" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: null });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects a null payload with 400 instead of crashing", async () => {
    const res = await POST(makeRequest("null"));
    expect(res.status).toBe(400);
  });

  it("rejects missing required fields with 422 and names them", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields).toEqual(
      expect.arrayContaining(["name", "email", "termsAccepted"])
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects disallowed attachment types with 422", async () => {
    const res = await POST(
      makeRequest(validPayload, [{ field: "scriptFile", name: "evil.exe" }])
    );
    expect(res.status).toBe(422);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects oversized attachments with 413", async () => {
    const big = "x".repeat(4_500_000);
    const res = await POST(
      makeRequest(validPayload, [{ field: "scriptFile", name: "big.txt", content: big }])
    );
    expect(res.status).toBe(413);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends the email with the collected answers on the happy path", async () => {
    const res = await POST(
      makeRequest(validPayload, [
        { field: "scriptFile", name: "сюжет.pdf" },
        { field: "refFile", name: "лого.png" },
      ])
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: "email-1" });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const email = sendMock.mock.calls[0]![0] as unknown as Record<string, unknown> & {
      html: string;
      text: string;
      attachments: { filename: string }[];
    };
    expect(email.subject).toBe("Заявка за видео - Тест Тестов");
    expect(email.replyTo).toBe("test@example.com");
    expect(email.to).toEqual(["info@dreamteam.technology"]);
    // Answers reach the email, with option keys resolved to Bulgarian labels.
    expect(email.text).toContain("Да, имам готов сюжет");
    expect(email.text).toContain("обучение на екипа");
    expect(email.text).toContain("1:30 мин");
    expect(email.text).toContain("Instagram, YouTube");
    // Dates use the project-wide DD-MM-YYYY display format.
    expect(email.text).toContain("05-09-2026");
    expect(email.text).not.toContain("2026-09-05");
    expect(email.attachments.map((a) => a.filename)).toEqual([
      "сюжет.pdf",
      "лого.png",
    ]);
  });

  it("rejects unknown keys for required options instead of echoing them", async () => {
    const res = await POST(makeRequest({ ...validPayload, goal: "<img src=x>" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields).toContain("goal");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("drops unknown keys from optional multi-selects instead of echoing them", async () => {
    const res = await POST(
      makeRequest({ ...validPayload, platforms: ["<b>x</b>", "instagram"] })
    );
    expect(res.status).toBe(200);
    const email = sendMock.mock.calls[0]![0] as unknown as { html: string };
    expect(email.html).not.toContain("<b>x</b>");
    expect(email.html).toContain("Instagram");
  });

  it("discards a non-ISO deadline instead of printing it into the email", async () => {
    await POST(makeRequest({ ...validPayload, deadline: "call me maybe" }));
    const email = sendMock.mock.calls[0]![0] as unknown as { text: string };
    expect(email.text).not.toContain("call me maybe");
  });

  it("uses the no-deadline label when the deadline is flexible", async () => {
    await POST(
      makeRequest({ ...validPayload, deadline: "", deadlineFlexible: true })
    );
    const email = sendMock.mock.calls[0]![0] as unknown as { text: string };
    expect(email.text).toContain("Нямам краен срок");
  });

  describe("other services", () => {
    const imagesPayload = {
      service: "images",
      name: "Мария",
      email: "maria@example.com",
      termsAccepted: true,
      imageCount: "some",
      imageResolution: "4k",
      imageRatios: ["9:16", "1:1", "<b>x</b>"],
      imageUsage: ["social", "shop"],
      brief: "Три продукта на бял фон",
      refLinks: "",
      deadline: "",
      deadlineFlexible: true,
      notes: "",
      language: "bg",
      website: "",
    };

    it("validates the AI images flow on its own required answers, not the video ones", async () => {
      const res = await POST(makeRequest({ ...imagesPayload, brief: "" }));
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.fields).toEqual(["brief"]);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("sends the AI images request with its own subject and labels", async () => {
      const res = await POST(makeRequest(imagesPayload, [{ field: "refFile", name: "продукт.png" }]));
      expect(res.status).toBe(200);
      const email = sendMock.mock.calls[0]![0] as unknown as {
        subject: string;
        text: string;
        html: string;
        attachments: { filename: string }[];
      };
      expect(email.subject).toBe("Заявка за AI изображения - Мария");
      expect(email.text).toContain("6-20");
      expect(email.text).toContain("4K");
      expect(email.text).toContain("9:16, 1:1");
      expect(email.html).not.toContain("<b>x</b>");
      expect(email.text).toContain("Социални мрежи, Онлайн магазин / маркетплейс");
      expect(email.text).toContain("Три продукта на бял фон");
      expect(email.text).not.toContain("Войсоувър");
      expect(email.attachments.map((a) => a.filename)).toEqual(["продукт.png"]);
    });

    it("gates the mascot and automation flows on their required answers", async () => {
      const mascot = await POST(
        makeRequest({ ...imagesPayload, service: "mascot", mascotType: "3d", brief: "Дружелюбен робот" })
      );
      expect(mascot.status).toBe(422);
      expect((await mascot.json()).fields).toEqual(["mascotStyle"]);

      const automation = await POST(
        makeRequest({
          ...imagesPayload,
          service: "automation",
          automationTasks: ["productVideos"],
          automationVolume: "large",
          platforms: ["tiktok"],
          brief: "Видео за всеки нов продукт от фийда",
        })
      );
      expect(automation.status).toBe(200);
      const email = sendMock.mock.calls.at(-1)![0] as unknown as { subject: string; text: string };
      expect(email.subject).toBe("Заявка за автоматизация - Мария");
      expect(email.text).toContain("Продуктови видеа");
      expect(email.text).toContain("50-200");
      expect(email.text).toContain("TikTok");
    });
  });
});
