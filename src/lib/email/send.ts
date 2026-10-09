import { Resend } from "resend";
import { EMAIL_PRIMARY } from "@/lib/contact-info";

/** The address every email is sent from (a domain verified in Resend), shown as "Keplerbay <…>". */
export function emailFrom(): string {
  const address = process.env.RESEND_FROM ?? EMAIL_PRIMARY.label;
  return address.includes("<") ? address : `Keplerbay <${address}>`;
}

/**
 * TEST ENVIRONMENT: every admin email - the contact and quote forms, project and subscription alerts - goes to the
 * DreamTeam inbox for now. Switch this to `EMAIL_PRIMARY.label` (info@keplerbay.com) when Keplerbay goes live.
 */
export const ADMIN_INBOX = "info@dreamteamvideo.com";

/** Where admin emails go: `TEAM_NOTIFY_EMAIL` when set, else `ADMIN_INBOX`. */
export function teamInbox(): string {
  return process.env.TEAM_NOTIFY_EMAIL || ADMIN_INBOX;
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /**
   * The same key within 24 hours sends nothing new (Resend's `Idempotency-Key`): a status saved twice, a retried
   * webhook or a double click never mails the client twice.
   */
  idempotencyKey: string;
  /** Resend tags, for filtering in its dashboard (letters, numbers, `_` and `-` only). */
  tags?: { name: string; value: string }[];
};

export type SendResult = { ok: true; id: string | null } | { ok: false; reason: "not_configured" | "failed" };

/** Sends one email through Resend. Never throws: a notification must never break the action that triggered it. */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "not_configured" };
  try {
    const result = await new Resend(apiKey).emails.send(
      {
        from: emailFrom(),
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: email.replyTo ?? EMAIL_PRIMARY.label,
        tags: email.tags,
      },
      { idempotencyKey: email.idempotencyKey.slice(0, 256) },
    );
    if (result.error) {
      console.error("email: Resend returned an error", result.error);
      return { ok: false, reason: "failed" };
    }
    return { ok: true, id: result.data?.id ?? null };
  } catch (err) {
    console.error("email: sending failed", err);
    return { ok: false, reason: "failed" };
  }
}
