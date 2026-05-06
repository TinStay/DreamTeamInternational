import { NextResponse } from "next/server";
import { Resend } from "resend";

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
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  const from = process.env.RESEND_FROM ?? "info@dreamteam.technology";
  // Always deliver training/contact inquiries to the main inbox.
  const to = ["info@dreamteam.technology"];

  const data = (await req.json().catch(() => ({}))) as Payload;

  const subject = `Website contact${data.subject ? `: ${data.subject}` : ""}`;
  const text = [
    `Name: ${data.name ?? "-"}`,
    `Email: ${data.email ?? "-"}`,
    `Phone: ${data.phone ?? "-"}`,
    `Subject: ${data.subject ?? "-"}`,
    `Found us: ${data.foundUs ?? "-"}`,
    `Form (BG, internal): ${data.formStateBg ?? "-"}`,
    `Training target: ${data.trainingTarget ?? "-"}`,
    `Training why: ${data.trainingWhy ?? "-"}`,
    "",
    "Message:",
    data.message ?? "-",
  ].join("\n");

  const rows: Array<[string, string]> = [
    ["Name", data.name ?? "-"],
    ["Email", data.email ?? "-"],
    ["Phone", data.phone ?? "-"],
    ["Subject", data.subject ?? "-"],
    ["Found us", data.foundUs ?? "-"],
    ["Форма (вътрешно)", data.formStateBg ?? "-"],
    ["Training target", data.trainingTarget ?? "-"],
    ["Training why", data.trainingWhy ?? "-"],
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
              data.message ?? "-"
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
  const result = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
  });

  return NextResponse.json({ ok: true, id: result.data?.id ?? null });
}

