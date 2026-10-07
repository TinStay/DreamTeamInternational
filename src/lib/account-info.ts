import type { User } from "@supabase/supabase-js";

/** What the account menu and the account pages show about the signed-in visitor. */
export type AccountInfo = {
  name: string;
  email: string;
  avatarUrl: string | null;
  /** `google`, `azure` (Microsoft) or `email`. */
  provider: string;
  createdAt: string;
  /** The plan's name; "Free" until billing sets one. */
  plan: string;
  secondsLeft: number;
  secondsTotal: number;
};

/**
 * Reads the visitor from their Supabase user. The plan and the video time are not a billing system yet: they are read
 * from the user's `app_metadata` (`plan`, `video_seconds_left`, `video_seconds_total` - settable in the Supabase
 * dashboard or, later, by the payment webhook) and default to the Free plan with no time. Swap this one function when
 * real billing exists.
 */
export function accountInfoFromUser(user: User): AccountInfo {
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string; picture?: string };
  const app = (user.app_metadata ?? {}) as { provider?: string; plan?: string; video_seconds_left?: number; video_seconds_total?: number };
  const total = Math.max(0, Number(app.video_seconds_total) || 0);
  const left = Math.min(total, Math.max(0, Number(app.video_seconds_left) || 0));
  return {
    name: meta.full_name || meta.name || user.email?.split("@")[0] || "",
    email: user.email ?? "",
    avatarUrl: meta.avatar_url || meta.picture || null,
    provider: app.provider ?? "email",
    createdAt: user.created_at,
    plan: app.plan || "Free",
    secondsLeft: left,
    secondsTotal: total,
  };
}

/**
 * Video time: under a minute in seconds only (15 -> "15 sec", 0 -> "0 sec"); from a minute up, minutes AND seconds, always
 * both (95 -> "1 min 35 sec", 120 -> "2 min 0 sec").
 */
export function formatVideoTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} sec`;
  return `${Math.floor(s / 60)} min ${s % 60} sec`;
}
