import { NextResponse } from "next/server";
import { Resend } from "resend";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  foundUs?: string;
  message?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  const from = process.env.RESEND_FROM ?? "info@dreamteam.technology";
  const to = (process.env.RESEND_TO ?? "info@dreamteam.technology")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const data = (await req.json().catch(() => ({}))) as Payload;

  const subject = `Website contact${data.subject ? `: ${data.subject}` : ""}`;
  const text = [
    `Name: ${data.name ?? "-"}`,
    `Email: ${data.email ?? "-"}`,
    `Phone: ${data.phone ?? "-"}`,
    `Subject: ${data.subject ?? "-"}`,
    `Found us: ${data.foundUs ?? "-"}`,
    "",
    "Message:",
    data.message ?? "-",
  ].join("\n");

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject,
    text,
  });

  return NextResponse.json({ ok: true, id: result.data?.id ?? null });
}

