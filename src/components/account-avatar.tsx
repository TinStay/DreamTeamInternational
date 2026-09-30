import { cn } from "@/lib/utils";

/** The visitor's picture (Google gives one) or their initial, in the orange pearl ring the site's icons wear. */
export function AccountAvatar({ name, url, className }: { name: string; url?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] p-px shadow-[0_0_18px_rgba(255,110,20,0.28)]",
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a provider-hosted avatar (any host), tiny, never optimised
        <img src={url} alt="" referrerPolicy="no-referrer" className="size-full rounded-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center rounded-full bg-[#141518] text-[0.9em] font-black text-[#ffb066]">
          {(name[0] ?? "?").toUpperCase()}
        </span>
      )}
    </span>
  );
}
