import { NextResponse } from "next/server";
import { Resend } from "resend";

import { dictionaries } from "@/lib/i18n/config";
import { formatDateDisplay, ISO_DATE_RE } from "@/lib/dates";
import { isFoundUsKey } from "@/lib/found-us";
import {
  EMAIL_RE,
  clean,
  cleanMultiline,
  clientIp,
  createRateLimiter,
} from "@/lib/server/form-guards";
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
  refLinks: 2000,
  deadline: 20,
  notes: 3000,
} as const;

const isRateLimited = createRateLimiter(60_000, 5);

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

/**
 * Browser-reported MIME types accepted alongside the extension allowlist.
 * `application/octet-stream` is allowed — it's the generic type many
 * browsers/systems assign to perfectly valid documents; the extension
 * allowlist remains the real contract.
 */
const ALLOWED_MIME_RE =
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/rtf|application\/octet-stream|text\/|image\/(png|jpeg|webp|gif))/;

/** Cheap pre-buffering checks: count, type and name — sizes are on File already. */
function validateFileEntries(form: FormData, field: string): File[] | null {
  const entries = form.getAll(field);
  if (entries.length > UPLOAD_MAX_FILES_PER_FIELD) return null;
  const files: File[] = [];
  for (const entry of entries) {
    if (!(entry instanceof File)) return null;
    if (!isAllowedUploadName(entry.name)) return null;
    if (entry.type && !ALLOWED_MIME_RE.test(entry.type)) return null;
    files.push(entry);
  }
  return files;
}

/** Buffer already-validated files concurrently. */
function bufferFiles(files: File[]) {
  return Promise.all(
    files.map(async (file) => ({
      filename: sanitizeFilename(file.name),
      content: Buffer.from(await file.arrayBuffer()),
    }))
  );
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
  if (isRateLimited(clientIp(req), Date.now())) {
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
  const refLinks = cleanMultiline(payload.refLinks, MAX.refLinks);
  // Deadline must be a real ISO date — anything else is discarded, not echoed.
  const rawDeadline = clean(payload.deadline, MAX.deadline);
  const deadline = ISO_DATE_RE.test(rawDeadline) ? rawDeadline : "";
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

  // Server-side validation mirrors the wizard's required steps — the server
  // is the contract, not the client gating.
  const invalidFields: string[] = [];
  if (!name) invalidFields.push("name");
  if (!email || !EMAIL_RE.test(email)) invalidFields.push("email");
  if (payload.termsAccepted !== true) invalidFields.push("termsAccepted");
  if (!script) invalidFields.push("script");
  if (!goal) invalidFields.push("goal");
  if (formats.length === 0) invalidFields.push("formats");
  if (!voiceover) invalidFields.push("voiceover");
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

  // Validate types/counts and the total size BEFORE buffering anything.
  const scriptEntries = validateFileEntries(form, "scriptFile");
  const refEntries = validateFileEntries(form, "refFile");
  if (!scriptEntries || !refEntries) {
    return NextResponse.json(
      { ok: false, error: "Unsupported attachment." },
      { status: 422 }
    );
  }
  const totalBytes = [...scriptEntries, ...refEntries].reduce(
    (sum, f) => sum + f.size,
    0
  );
  if (totalBytes > UPLOAD_MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Attachments are too large." },
      { status: 413 }
    );
  }
  const [scriptFiles, refFiles] = await Promise.all([
    bufferFiles(scriptEntries),
    bufferFiles(refEntries),
  ]);

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
  // Key allowlist (not `in` — that would accept prototype keys like "toString").
  const foundUs = isFoundUsKey(payload.foundUs) ? payload.foundUs : "";

  const lengthText = lengthFlexible
    ? bgQuote.video.lengthFlexibleLabel
    : formatLengthSec(lengthSec, bgQuote.video);

  const scriptFileNames = scriptFiles.map((f) => f.filename);
  const refFileNames = refFiles.map((f) => f.filename);

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
          { label: "Войсоувър", value: label(voiceLabels, voiceover) },
        ],
      },
      {
        title: "Сюжет",
        fields: [
          { label: "Има ли готов сюжет", value: label(scriptLabels, script) },
          { label: "Описание на идеята / сюжета", value: scriptText, multiline: true },
          { label: "Файлове със сюжета", value: scriptFileNames.join(", ") },
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
            value: deadlineFlexible
              ? bgQuote.details.noDeadline
              : formatDateDisplay(deadline),
          },
        ],
      },
      {
        title: "Референции и материали",
        fields: [
          { label: "Линкове", value: refLinks, multiline: true },
          { label: "Прикачени материали", value: refFileNames.join(", ") },
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
