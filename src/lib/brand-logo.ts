import type { Language } from "@/lib/i18n/config";

/**
 * The site's logo file per language: the English site is **KeplerBay** (`public/keplerbay-logo.png` - the planet and the
 * name side by side, white and orange on transparent, trimmed to the ink, 1571 × 241: made for the dark site, so it is
 * never inverted or greyed), the Bulgarian one stays DreamTeam (`public/logo-1.png`, dark ink, inverted to white on a
 * dark surface as before). `public/keplerbay-logo-mark.png` is the planet alone (the favicon), `-stacked` the planet
 * above the name.
 */
export function brandLogo(language: Language) {
  return language === "en"
    ? { src: "/keplerbay-logo.png", alt: "KeplerBay", width: 1571, height: 241 }
    : { src: "/logo-1.png", alt: "DreamTeam", width: 1024, height: 416 };
}
