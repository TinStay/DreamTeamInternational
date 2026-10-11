import { getDictionary } from "@/lib/i18n/config";
import { renderBrandEmail, type BrandEmail } from "@/lib/email/layout";

/** What every email builder returns: ready for `sendEmail`. */
export type ProjectEmail = { subject: string; html: string; text: string };

/** The email copy (`emails` in `en.ts` - the site is English only). */
export const copy = () => getDictionary("en").emails;

/** Fills `{name}`-style placeholders; an unknown one is left as it is. */
export const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

export const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "";

/**
 * A client email: the greeting by first name, the copy, any facts / stage bar / quote, the buttons, the sign-off and
 * the small print (`footnotes` - why they got it; the project's reason by default).
 */
export function clientEmail(
  subject: string,
  name: string | null,
  parts: Omit<BrandEmail, "preheader" | "greeting" | "signoff" | "footnotes">,
  footnotes?: string[],
): ProjectEmail {
  const e = copy();
  const first = firstName(name);
  const { html, text } = renderBrandEmail({
    ...parts,
    preheader: parts.paragraphs[0] ?? subject,
    greeting: first ? fill(e.greeting, { name: first }) : e.greetingFallback,
    signoff: e.signoff,
    footnotes: footnotes ?? [e.help, e.reason],
  });
  return { subject, html, text };
}
