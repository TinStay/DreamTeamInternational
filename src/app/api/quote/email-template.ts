/**
 * Internal notification email for the video quote form (`/api/quote`).
 *
 * Standalone template — deliberately NOT shared with the contact-form email in
 * `/api/contact/route.ts`, so the two can evolve independently. Visual
 * language matches the site: brand gradient header, white card, rounded
 * surfaces. Content is grouped into titled sections; every field renders its
 * label above the value with breathing room between them.
 */

export type QuoteEmailField = {
  label: string;
  value: string;
  /** Render the value as a pre-wrap block (free-text answers). */
  multiline?: boolean;
};

export type QuoteEmailSection = {
  title: string;
  fields: QuoteEmailField[];
};

export type QuoteEmailInput = {
  /** Big headline in the gradient header (e.g. "Заявка за видео"). */
  title: string;
  /** Line under the headline (e.g. the sender's name). */
  subtitle: string;
  sections: QuoteEmailSection[];
  footerNote: string;
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const FONT =
  "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial";

function renderField(field: QuoteEmailField): string {
  const value = field.value || "-";
  const valueHtml = field.multiline
    ? `<div style="margin-top:8px;padding:12px 14px;border-radius:12px;background:#f9fafb;border:1px solid rgba(15,23,42,0.08);font-family:${FONT};font-size:14px;line-height:1.6;color:rgba(15,23,42,0.92);white-space:pre-wrap;">${escapeHtml(value)}</div>`
    : `<div style="margin-top:8px;font-family:${FONT};font-size:14px;line-height:1.5;color:rgba(15,23,42,0.92);">${escapeHtml(value)}</div>`;

  return `<div style="margin-bottom:18px;">
            <div style="font-family:${FONT};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:rgba(15,23,42,0.55);">${escapeHtml(field.label)}</div>
            ${valueHtml}
          </div>`;
}

function renderSection(section: QuoteEmailSection): string {
  return `<div style="margin:0 22px 16px;border-radius:18px;border:1px solid rgba(15,23,42,0.10);overflow:hidden;">
          <div style="padding:10px 18px;background:#f3f4f6;font-family:${FONT};font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.14em;color:#6b3f9a;">${escapeHtml(section.title)}</div>
          <div style="padding:18px 18px 4px;background:#ffffff;">
            ${section.fields.map(renderField).join("\n")}
          </div>
        </div>`;
}

export function buildQuoteEmailHtml(input: QuoteEmailInput): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f6fa;">
    <div style="padding:28px 16px;">
      <div style="max-width:720px;margin:0 auto;border-radius:22px;overflow:hidden;background:#ffffff;border:1px solid rgba(15,23,42,0.10);box-shadow:0 24px 70px rgba(15,23,42,0.12);">
        <div style="padding:24px 22px 20px;background:linear-gradient(135deg,#db4e4e 0%,#6b3f9a 100%);">
          <div style="font-family:${FONT};letter-spacing:-0.02em;color:#ffffff;">
            <div style="font-size:12px;opacity:0.92;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;">DreamTeam Website</div>
            <div style="margin-top:10px;font-size:24px;font-weight:900;line-height:1.2;">${escapeHtml(input.title)}</div>
            <div style="margin-top:6px;font-size:14px;opacity:0.92;">${escapeHtml(input.subtitle)}</div>
          </div>
        </div>

        <div style="padding:20px 0 8px;background:#ffffff;">
          ${input.sections.map(renderSection).join("\n")}
        </div>
      </div>
      <div style="max-width:720px;margin:14px auto 0;font-family:${FONT};font-size:12px;color:rgba(15,23,42,0.55);text-align:center;">
        ${escapeHtml(input.footerNote)}
      </div>
    </div>
  </body>
</html>`;
}

export function buildQuoteEmailText(input: QuoteEmailInput): string {
  const lines: string[] = [input.title, input.subtitle, ""];
  for (const section of input.sections) {
    lines.push(`== ${section.title} ==`);
    for (const field of section.fields) {
      const value = field.value || "-";
      if (field.multiline && value.includes("\n")) {
        lines.push(`${field.label}:`, value);
      } else {
        lines.push(`${field.label}: ${value}`);
      }
    }
    lines.push("");
  }
  lines.push(input.footerNote);
  return lines.join("\n");
}
