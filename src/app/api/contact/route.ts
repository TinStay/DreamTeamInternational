import { NextResponse } from "next/server";
import { Resend } from "resend";

import {
  EMAIL_RE,
  clean,
  clientIp,
  createRateLimiter,
  escapeHtml,
} from "@/lib/server/form-guards";

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  foundUs?: string;
  /** Internal moderator-only label (Bulgarian). */
  formStateBg?: string;
  /** Training-specific details (optional). */
  trainingTarget?: string;
  trainingWhy?: string;
  message?: string;
  /** Honeypot — must stay empty for real users. */
  website?: string;
};

/** Per-field length caps to bound payload size and email content. */
const MAX = {
  name: 200,
  email: 320,
  phone: 60,
  subject: 200,
  foundUs: 80,
  formStateBg: 120,
  trainingTarget: 2000,
  trainingWhy: 2000,
  message: 5000,
} as const;

const isRateLimited = createRateLimiter(60_000, 5);

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("contact: RESEND_API_KEY is not set");
    return NextResponse.json(
      { ok: false, error: "Email service is not configured." },
      { status: 500 }
    );
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (clean(body.website, 100)) {
    return NextResponse.json({ ok: true, id: null });
  }

  if (isRateLimited(clientIp(req), Date.now())) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const phone = clean(body.phone, MAX.phone);
  const subjectField = clean(body.subject, MAX.subject);
  const foundUs = clean(body.foundUs, MAX.foundUs);
  const formStateBg = clean(body.formStateBg, MAX.formStateBg);
  const trainingTarget = clean(body.trainingTarget, MAX.trainingTarget);
  const trainingWhy = clean(body.trainingWhy, MAX.trainingWhy);
  const message = clean(body.message, MAX.message);

  const invalidFields: string[] = [];
  if (!name) invalidFields.push("name");
  if (!email || !EMAIL_RE.test(email)) invalidFields.push("email");
  if (!message) invalidFields.push("message");
  if (invalidFields.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please fill out the required fields.",
        fields: invalidFields,
      },
      { status: 422 }
    );
  }

  const from = process.env.RESEND_FROM ?? "info@dreamteam.technology";
  // Always deliver training/contact inquiries to the main inbox.
  const to = ["info@dreamteam.technology"];

  const subject = `Website contact${subjectField ? `: ${subjectField}` : ""}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "-"}`,
    `Subject: ${subjectField || "-"}`,
    `Found us: ${foundUs || "-"}`,
    `Form (BG, internal): ${formStateBg || "-"}`,
    `Training target: ${trainingTarget || "-"}`,
    `Training why: ${trainingWhy || "-"}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "-"],
    ["Subject", subjectField || "-"],
    ["Found us", foundUs || "-"],
    ["Форма (вътрешно)", formStateBg || "-"],
    ["Training target", trainingTarget || "-"],
    ["Training why", trainingWhy || "-"],
  ];

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f6fa;">
    <div style="padding:28px 16px;">
      <div style="max-width:720px;margin:0 auto;border-radius:22px;overflow:hidden;background:#ffffff;border:1px solid rgba(15,23,42,0.10);box-shadow:0 24px 70px rgba(15,23,42,0.12);">
        <div style="padding:22px 22px 18px;background:linear-gradient(135deg,#db4e4e 0%,#6b3f9a 100%);">
          <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;letter-spacing:-0.02em;color:#ffffff;">
            <div style="font-size:12px;opacity:0.92;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;">DreamTeam Website</div>
            <div style="margin-top:8px;font-size:22px;font-weight:900;line-height:1.2;">${escapeHtml(subject)}</div>
          </div>
        </div>

        <div style="padding:18px 22px 8px;background:#ffffff;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px;">
            ${rows
              .map(([k, v]) => {
                return `<tr>
                  <td style="width:170px;vertical-align:top;padding:10px 12px;border-radius:14px;background:#f3f4f6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;font-weight:800;color:rgba(15,23,42,0.82);">${escapeHtml(
                    k
                  )}</td>
                  <td style="vertical-align:top;padding:10px 12px;border-radius:14px;background:#ffffff;border:1px solid rgba(15,23,42,0.10);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:13px;color:rgba(15,23,42,0.92);">${escapeHtml(
                    v || "-"
                  )}</td>
                </tr>`;
              })
              .join("")}
          </table>
        </div>

        <div style="padding:0 22px 22px;background:#ffffff;">
          <div style="margin-top:6px;padding:14px 14px;border-radius:18px;background:#f9fafb;border:1px solid rgba(15,23,42,0.10);">
            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;font-weight:900;color:rgba(15,23,42,0.80);text-transform:uppercase;letter-spacing:0.14em;">Message</div>
            <div style="margin-top:10px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;line-height:1.55;color:rgba(15,23,42,0.92);white-space:pre-wrap;">${escapeHtml(
              message
            )}</div>
          </div>
        </div>
      </div>
      <div style="max-width:720px;margin:14px auto 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;color:rgba(15,23,42,0.55);text-align:center;">
        Auto-generated from the website contact / training forms.
      </div>
    </div>
  </body>
</html>`;

  const resend = new Resend(apiKey);
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
      replyTo: email,
    });

    if (result.error) {
      console.error("contact: Resend returned an error", result.error);
      return NextResponse.json(
        { ok: false, error: "Could not send your message. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, id: result.data?.id ?? null });
  } catch (err) {
    console.error("contact: failed to send email", err);
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 502 }
    );
  }
}
