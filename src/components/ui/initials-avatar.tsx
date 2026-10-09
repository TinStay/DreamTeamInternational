import { cn } from "@/lib/utils";

/** Two letters for a name: the first letters of its first two words ("Martin Staykov" → MS), else its first two ("ana@x" → AN). */
export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/[\s@._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

/** A sign-in picture we will show: an https address only (it is copied onto comments, see supabase/comment-avatars.sql). */
export function safeAvatarUrl(url: unknown): string | null {
  return typeof url === "string" && /^https:\/\//.test(url) && url.length <= 500 ? url : null;
}

/**
 * Someone's picture in a rounded tile - their sign-in photo when there is one, else their two initials in the orange ink on
 * a dark orange tint (the admin inbox's tiles). `tone="team"` lights a team member's tile in the orange gradient.
 */
export function InitialsAvatar({ name, url, tone = "client", className }: { name: string | null | undefined; url?: string | null; tone?: "client" | "team"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl font-heading text-[13px] font-black tracking-tight",
        tone === "team" ? "bg-[linear-gradient(135deg,#ff5e00,#ffb066)] text-[#140a03]" : "bg-[#ff7a1a]/12 text-[#ffb066] ring-1 ring-[#ff8a1f]/20",
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a provider-hosted avatar (Google / Microsoft), tiny, never optimised
        <img src={url} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
