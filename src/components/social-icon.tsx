import type { ComponentType } from "react";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/** The glyph for each profile in `SOCIAL_LINKS`, by its `alt`. */
const GLYPHS: Record<string, ComponentType<{ className?: string; stroke?: number }>> = {
  Facebook: IconBrandFacebook,
  Instagram: IconBrandInstagram,
  LinkedIn: IconBrandLinkedin,
  YouTube: IconBrandYoutube,
  TikTok: IconBrandTiktok,
};

/**
 * A social profile's icon in the site's dress (it replaced the platforms' own coloured PNG discs): the brand glyph in
 * warm orange on a dark disc inside the orange pearl ring - the ring the "How it works" steps wear. Put it in a
 * `group` link: on hover the disc fills with the pearl and the glyph turns white. `className` sizes it (`size-10` by
 * default); the glyph is half the disc.
 */
export function SocialIcon({ name, className }: { name: string; className?: string }) {
  const Glyph = GLYPHS[name];
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] p-px shadow-[0_0_16px_rgba(255,110,20,0.22)] transition-shadow duration-200 ease-out group-hover:shadow-[0_0_24px_rgba(255,110,20,0.5)]",
        className
      )}
    >
      <span className="flex size-full items-center justify-center rounded-full bg-[#141518] transition-colors duration-200 ease-out group-hover:bg-transparent">
        {Glyph ? (
          <Glyph
            className="size-1/2 text-[#ffb066] transition-colors duration-200 ease-out group-hover:text-white"
            stroke={1.7}
          />
        ) : null}
      </span>
    </span>
  );
}
