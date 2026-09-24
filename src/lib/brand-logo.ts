import type { Language } from "@/lib/i18n/config";

/**
 * The site's logo file per language: the English site is **IzI Video** (`public/izi-video-logo.png` - black ink on
 * transparent, trimmed to the ink, 1417 × 345), the Bulgarian one stays DreamTeam (`public/logo-1.png`). Both are dark
 * ink files, so they are inverted to white on a dark surface, as before.
 */
export function brandLogo(language: Language) {
  return language === "en"
    ? { src: "/izi-video-logo.png", alt: "IzI Video", width: 1417, height: 345 }
    : { src: "/logo-1.png", alt: "DreamTeam", width: 1024, height: 416 };
}
