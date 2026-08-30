import { NextResponse } from "next/server";
import { Resend } from "resend";

import { dictionaries } from "@/lib/i18n/config";
import {
  FORMAT_OPTIONS,
  GOAL_OPTIONS,
  LENGTH_SLIDER,
  PLATFORM_OPTIONS,
  SCRIPT_OPTIONS,
  UPLOAD_MAX_FILES_PER_FIELD,
  UPLOAD_MAX_TOTAL_BYTES,
  VOICEOVER_OPTIONS,
  formatLengthSec,
  isAllowedUploadName,
} from "@/lib/quote-form/constants";
import {
  buildQuoteEmailHtml,
  buildQuoteEmailText,
  type QuoteEmailInput,
} from "./email-template";

export const runtime = "nodejs";

/** Per-field length caps to bound payload size and email content. */
const MAX = {
  name: 200,
  email: 320,
  phone: 60,
  company: 200,
  goalOther: 300,
  scriptText: 5000,
  voiceDetails: 300,
  refLinks: 2000,
  deadline: 20,
  notes: 3000,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim, coerce to string, strip control chars (header injection), cap length. */
function clean(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/[\r\n\t\0]+/g, " ").trim().slice(0, max)
    : "";
}

/** Like `clean` but preserves newlines — for multi-line free-text fields. */
function cleanMultiline(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/[\0]/g, "").trim().slice(0, max)
    : "";
}

// Best-effort in-memory rate limit (same trade-offs as /api/contact).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const recentHits = new Map<string, number[]>();

function isRateLimited(ip: string, now: number): boolean {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (recentHits.get(ip) ?? []).filter((tick) => tick > windowStart);
  hits.push(now);
  recentHits.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

/** Keep only a safe basename for email attachments; truncation preserves the extension. */
function sanitizeFilename(name: string): string {
  const base = (name.split(/[\\/]/).pop() ?? "file").replace(/[^\w.\- ()Ѐ-ӿ]/g, "_");
  if (base.length <= 100) return base || "file";
  const dot = base.lastIndexOf(".");
  const ext = dot > 0 ? base.slice(dot) : "";
  return base.slice(0, 100 - ext.length) + ext;
}

/** Resolve an option key to its Bulgarian label (internal email), or "-". */
function label(map: Record<string, string>, key: string): string {
  return key ? (map[key] ?? key) : "-";
}

/** Narrow an unknown payload value to one of the allowed option keys. */
function pickKey(
  value: unknown,
  options: readonly { key: string }[]
): string {
  return typeof value === "string" && options.some((o) => o.key === value)
    ? value
    : "";
}

function pickKeys(value: unknown, options: readonly { key: string }[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(options.map((o) => o.key));
  return [...new Set(value.filter((v): v is string => typeof v === "string" && allowed.has(v)))];
}

/** Browser-reported MIME types accepted alongside the extension allowlist. */
const ALLOWED_MIME_RE =
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/rtf|text\/|image\/(png|jpeg|webp|gif))/;

async function collectFiles(
  form: FormData,
  field: string
): Promise<{ filename: string; content: Buffer }[] | null> {
  const entries = form.getAll(field);
  if (entries.length > UPLOAD_MAX_FILES_PER_FIELD) return null;
  const files: { filename: string; content: Buffer }[] = [];
  for (const entry of entries) {
    if (!(entry instanceof File)) return null;
    if (!isAllowedUploadName(entry.name)) return null;
    // Extension is the contract; when the client also sent a MIME type, it
    // must at least belong to an allowed family.
    if (entry.type && !ALLOWED_MIME_RE.test(entry.type)) return null;
    files.push({
      filename: sanitizeFilename(entry.name),
      content: Buffer.from(await entry.arrayBuffer()),
    });
  }
  return files;
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("quote: RESEND_API_KEY is not set");
    return NextResponse.json(
      { ok: false, error: "Email service is not configured." },
      { status: 500 }
    );
  }

  // Rate limit BEFORE buffering the multipart body — headers are enough.
  const now = Date.now();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip, now)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(String(form.get("payload") ?? ""));
    // JSON.parse("null") / arrays / primitives succeed — reject non-objects.
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("payload must be a JSON object");
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (clean(payload.website, 100)) {
    return NextResponse.json({ ok: true, id: null });
  }

  const name = clean(payload.name, MAX.name);
  const email = clean(payload.email, MAX.email);
  const phone = clean(payload.phone, MAX.phone);
  const company = clean(payload.company, MAX.company);
  const goalOther = clean(payload.goalOther, MAX.goalOther);
  const scriptText = cleanMultiline(payload.scriptText, MAX.scriptText);
  const voiceDetails = clean(payload.voiceDetails, MAX.voiceDetails);
  const refLinks = cleanMultiline(payload.refLinks, MAX.refLinks);
  const deadline = clean(payload.deadline, MAX.deadline);
  const notes = cleanMultiline(payload.notes, MAX.notes);
  const userLanguage = clean(payload.language, 5) || "bg";

  const script = pickKey(payload.script, SCRIPT_OPTIONS);
  const goal = pickKey(payload.goal, GOAL_OPTIONS);
  const voiceover = pickKey(payload.voiceover, VOICEOVER_OPTIONS);
  const formats = pickKeys(payload.formats, FORMAT_OPTIONS);
  const platforms = pickKeys(payload.platforms, PLATFORM_OPTIONS);
  const lengthFlexible = payload.lengthFlexible === true;
  const deadlineFlexible = payload.deadlineFlexible === true;
  const rawLength = Number(payload.lengthSec);
  const lengthSec = Number.isFinite(rawLength)
    ? Math.min(Math.max(Math.round(rawLength), LENGTH_SLIDER.min), LENGTH_SLIDER.max)
    : LENGTH_SLIDER.default;

  const invalidFields: string[] = [];
  if (!name) invalidFields.push("name");
  if (!email || !EMAIL_RE.test(email)) invalidFields.push("email");
  // The client gates submit on the terms checkbox; enforce it here too.
  if (payload.termsAccepted !== true) invalidFields.push("termsAccepted");
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

  const scriptFiles = await collectFiles(form, "scriptFile");
  const refFiles = await collectFiles(form, "refFile");
  if (!scriptFiles || !refFiles) {
    return NextResponse.json(
      { ok: false, error: "Unsupported attachment." },
      { status: 422 }
    );
  }
  const totalBytes = [...scriptFiles, ...refFiles].reduce(
    (sum, f) => sum + f.content.byteLength,
    0
  );
  if (totalBytes > UPLOAD_MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Attachments are too large." },
      { status: 413 }
    );
  }

  // Internal email is in Bulgarian — labels come from the bg dictionary so the
  // form copy and the email stay in sync.
  const bgQuote = dictionaries.bg.quoteForm;
  const goalLabels: Record<string, string> = bgQuote.video.goals;
  const scriptLabels: Record<string, string> = Object.fromEntries(
    SCRIPT_OPTIONS.map((o) => [o.key, bgQuote.script.options[o.key].label])
  );
  const formatLabels: Record<string, string> = Object.fromEntries(
    FORMAT_OPTIONS.map((o) => [
      o.key,
      `${bgQuote.video.formats[o.key].label} (${bgQuote.video.formats[o.key].hint})`,
    ])
  );
  const voiceLabels: Record<string, string> = bgQuote.style.voices;
  const platformLabels: Record<string, string> = bgQuote.details.platforms;
  const foundUsLabels: Record<string, string> = dictionaries.bg.contact.foundUsOptions;
  const foundUs =
    typeof payload.foundUs === "string" && payload.foundUs in foundUsLabels
      ? payload.foundUs
      : "";

  const lengthText = lengthFlexible
    ? bgQuote.video.lengthFlexibleLabel
    : formatLengthSec(lengthSec, bgQuote.video);

  const attachmentNames = [...scriptFiles, ...refFiles].map((f) => f.filename);

  const emailInput: QuoteEmailInput = {
    title: "Заявка за видео",
    subtitle: name,
    footerNote: `Автоматично генерирано от формата за оферта на сайта. Език на формата: ${userLanguage}.`,
    sections: [
      {
        title: "Контакт",
        fields: [
          { label: "Име", value: name },
          { label: "Имейл", value: email },
          { label: "Телефон", value: phone },
          { label: "Компания", value: company },
          { label: "Как ни намерихте", value: label(foundUsLabels, foundUs) },
        ],
      },
      {
        title: "Видео",
        fields: [
          {
            label: "Основна цел",
            value: `${label(goalLabels, goal)}${goal === "other" && goalOther ? ` - ${goalOther}` : ""}`,
          },
          { label: "Дължина", value: lengthText },
          {
            label: "Формат",
            value: formats.map((f) => label(formatLabels, f)).join(", "),
          },
          {
            label: "Войсоувър",
            value: voiceover
              ? `${label(voiceLabels, voiceover)}${voiceDetails ? ` - ${voiceDetails}` : ""}`
              : "",
          },
        ],
      },
      {
        title: "Сюжет",
        fields: [
          { label: "Има ли готов сюжет", value: label(scriptLabels, script) },
          { label: "Описание на идеята / сюжета", value: scriptText, multiline: true },
        ],
      },
      {
        title: "Разпространение и срокове",
        fields: [
          {
            label: "Платформи",
            value: platforms.map((p) => label(platformLabels, p)).join(", "),
          },
          {
            label: "Краен срок",
            value: deadlineFlexible ? bgQuote.details.noDeadline : deadline,
          },
        ],
      },
      {
        title: "Референции",
        fields: [
          { label: "Линкове", value: refLinks, multiline: true },
          { label: "Прикачени файлове", value: attachmentNames.join(", ") },
        ],
      },
      {
        title: "Друга информация",
        fields: [{ label: "Бележки", value: notes, multiline: true }],
      },
    ],
  };

  const subject = `Заявка за видео - ${name}`;
  const text = buildQuoteEmailText(emailInput);
  const html = buildQuoteEmailHtml(emailInput);

  const from = process.env.RESEND_FROM ?? "info@dreamteam.technology";
  const to = ["info@dreamteam.technology"];
  const attachments = [...scriptFiles, ...refFiles].map((f) => ({
    filename: f.filename,
    content: f.content,
  }));

  const resend = new Resend(apiKey);
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
      replyTo: email,
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    if (result.error) {
      console.error("quote: Resend returned an error", result.error);
      return NextResponse.json(
        { ok: false, error: "Could not send your request. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, id: result.data?.id ?? null });
  } catch (err) {
    console.error("quote: failed to send email", err);
    return NextResponse.json(
      { ok: false, error: "Could not send your request. Please try again." },
      { status: 502 }
    );
  }
}
