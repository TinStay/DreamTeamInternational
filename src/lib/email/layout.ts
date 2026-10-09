import { BRAND_NAME, LEGAL_ENTITY } from "@/lib/brand";
import { SITE_URL } from "@/lib/seo";

/**
 * The Keplerbay email layout - the one look every notification shares, in the site's own style: the deep near-black
 * ground (`#050506`), a dark card with a hairline edge, the orange gradient (`#ff5e00` → `#ffb066`) as the top rule and
 * on the main button, Exo 2 where the mail app loads web fonts, and the wordmark set as text (there is no logo file yet).
 *
 * Built the way email has to be: tables for layout, every style inline, buttons as padded links inside a table cell (no
 * images to block, works in Outlook), a hidden preheader, dark colour scheme declared so clients do not invert it, and
 * a plain-text twin of every message.
 */

export type EmailButton = { label: string; href: string; variant?: "primary" | "secondary" };
export type EmailFact = { label: string; value: string };

export type BrandEmail = {
  /** The line inbox previews show after the subject. */
  preheader: string;
  /** Small orange label over the title. */
  eyebrow: string;
  title: string;
  greeting?: string;
  /** Paragraphs, in order. */
  paragraphs: string[];
  /** A quoted message (a comment, a revision note) shown in a callout. */
  quote?: { label?: string; text: string };
  /** The project's facts as label / value rows. */
  facts?: EmailFact[];
  /** Where the project stands: 1-5 of the five stages, drawn as a bar. */
  progress?: { step: number; label: string };
  buttons: EmailButton[];
  signoff?: string;
  /** Small print: why this email, and how to get help. */
  footnotes: string[];
};

const FONT = "'Exo 2',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
const INK = "#f5f5f6";
const MUTED = "#a1a1aa";
const FAINT = "#71717a";
const ORANGE = "#ff6a14";
const GROUND = "#050506";
const CARD = "#121317";
const EDGE = "#26272d";

export function escapeHtml(input: string) {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function button(b: EmailButton): string {
  const primary = (b.variant ?? "primary") === "primary";
  const style = primary
    ? `background:${ORANGE};background-image:linear-gradient(115deg,#ff5e00 0%,#ff8a1f 55%,#ffb066 100%);color:#140a03;border:1px solid ${ORANGE};`
    : `background:transparent;color:${INK};border:1px solid #3f3f46;`;
  return `<td style="padding:6px 10px 6px 0;" class="kb-btn-cell">
            <a href="${escapeHtml(b.href)}" target="_blank" style="${style}display:inline-block;padding:13px 24px;border-radius:999px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;text-decoration:none;mso-padding-alt:0;">${escapeHtml(b.label)}</a>
          </td>`;
}

function progressBar(step: number, label: string): string {
  const cells = [1, 2, 3, 4, 5]
    .map((i) => `<td width="20%" style="padding:0 3px;"><div style="height:6px;border-radius:6px;background:${i <= step ? ORANGE : "#2a2b31"};font-size:0;line-height:0;">&nbsp;</div></td>`)
    .join("");
  return `<tr><td style="padding:0 32px 24px;">
          <div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${FAINT};margin-bottom:8px;">${escapeHtml(label)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -3px;"><tr>${cells}</tr></table>
        </td></tr>`;
}

function factsTable(facts: EmailFact[]): string {
  const rows = facts
    .map(
      (f, i) => `<tr>
            <td style="padding:11px 0;${i ? `border-top:1px solid ${EDGE};` : ""}font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${FAINT};width:40%;vertical-align:top;">${escapeHtml(f.label)}</td>
            <td style="padding:11px 0;${i ? `border-top:1px solid ${EDGE};` : ""}font-family:${FONT};font-size:15px;color:${INK};vertical-align:top;">${escapeHtml(f.value)}</td>
          </tr>`,
    )
    .join("");
  return `<tr><td style="padding:4px 32px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:14px;background:#17181d;border:1px solid ${EDGE};">
            <tr><td style="padding:6px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>
          </table>
        </td></tr>`;
}

/** The message as HTML and plain text, ready for Resend. */
export function renderBrandEmail(e: BrandEmail): { html: string; text: string } {
  const paragraphs = e.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${MUTED};">${escapeHtml(p)}</p>`)
    .join("");
  const quote = e.quote
    ? `<tr><td style="padding:0 32px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="border-left:3px solid ${ORANGE};background:#17181d;border-radius:0 12px 12px 0;padding:16px 20px;">
              ${e.quote.label ? `<div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${ORANGE};margin-bottom:8px;">${escapeHtml(e.quote.label)}</div>` : ""}
              <div style="font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};white-space:pre-wrap;">${escapeHtml(e.quote.text)}</div>
            </td>
          </tr></table>
        </td></tr>`
    : "";
  const buttons = e.buttons.length
    ? `<tr><td style="padding:4px 32px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${e.buttons.map(button).join("")}</tr></table></td></tr>`
    : "";
  const year = new Date().getFullYear();

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(e.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    a { color: ${ORANGE}; }
    @media (max-width: 600px) {
      .kb-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .kb-btn-cell { display: block !important; padding-right: 0 !important; }
      .kb-btn-cell a { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${GROUND};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${GROUND};">${escapeHtml(e.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${GROUND};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td style="padding:0 8px 20px;">
          <a href="${SITE_URL}" target="_blank" aria-label="${BRAND_NAME}" style="font-family:${FONT};font-size:26px;font-weight:900;letter-spacing:-0.01em;text-transform:uppercase;color:#ffffff;text-decoration:none;">Kepler<span style="color:#ff8a1f;">bay</span></a>
        </td></tr>
        <tr><td style="background:${CARD};border:1px solid ${EDGE};border-radius:22px;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height:4px;line-height:4px;font-size:0;background:${ORANGE};background-image:linear-gradient(90deg,#ff5e00,#ff8a1f,#ffb066);border-radius:22px 22px 0 0;">&nbsp;</td></tr>
            <tr><td class="kb-pad" style="padding:32px 32px 8px;">
              <div style="font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${ORANGE};">${escapeHtml(e.eyebrow)}</div>
              <h1 style="margin:10px 0 18px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:800;color:#ffffff;">${escapeHtml(e.title)}</h1>
              ${e.greeting ? `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${INK};">${escapeHtml(e.greeting)}</p>` : ""}
              ${paragraphs}
            </td></tr>
            ${quote}
            ${e.progress ? progressBar(e.progress.step, e.progress.label) : ""}
            ${e.facts?.length ? factsTable(e.facts) : ""}
            ${buttons}
            ${e.signoff ? `<tr><td class="kb-pad" style="padding:0 32px 32px;font-family:${FONT};font-size:15px;line-height:1.6;color:${MUTED};">${escapeHtml(e.signoff)}</td></tr>` : ""}
          </table>
        </td></tr>
        <tr><td style="padding:22px 12px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${FAINT};text-align:center;">
          ${e.footnotes.map((f) => `<div style="margin-bottom:6px;">${escapeHtml(f)}</div>`).join("")}
          <div style="margin-top:10px;">© ${year} ${LEGAL_ENTITY}, trading as ${BRAND_NAME} · Sofia, Bulgaria · <a href="${SITE_URL}" target="_blank" style="color:${MUTED};text-decoration:underline;">${SITE_URL.replace(/^https?:\/\//, "")}</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    BRAND_NAME.toUpperCase(),
    "",
    e.eyebrow.toUpperCase(),
    e.title,
    "",
    ...(e.greeting ? [e.greeting, ""] : []),
    ...e.paragraphs.flatMap((p) => [p, ""]),
    ...(e.quote ? [...(e.quote.label ? [`${e.quote.label}:`] : []), ...e.quote.text.split("\n").map((l) => `> ${l}`), ""] : []),
    ...(e.progress ? [e.progress.label, ""] : []),
    ...(e.facts?.length ? [...e.facts.map((f) => `${f.label}: ${f.value}`), ""] : []),
    ...e.buttons.flatMap((b) => [`${b.label}: ${b.href}`]),
    "",
    ...(e.signoff ? [e.signoff, ""] : []),
    "--",
    ...e.footnotes,
    `${LEGAL_ENTITY}, trading as ${BRAND_NAME} · Sofia, Bulgaria · ${SITE_URL}`,
  ].join("\n");

  return { html, text };
}
