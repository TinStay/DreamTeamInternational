/** Stable icon paths — used as service identifiers across locales (i18n items have no separate id). */
export const SERVICE_ICONS = {
  video: "/services/icons/ai_video.png",
  mascot: "/services/icons/ai_mascot.png",
  images: "/services/icons/ai_images.png",
  automation: "/services/icons/ai_automation.png",
} as const;

/** Card accent colors, matched to `services.items` order in i18n files. */
export const SERVICE_CARD_VARIANTS = ["red", "orange", "gray", "blue"] as const;

export type ServiceCardVariant = (typeof SERVICE_CARD_VARIANTS)[number];

/** Render size passed to Next.js Image (icons are 2048×2048; displayed smaller via CSS). */
export const SERVICE_CARD_ICON_PX = 256;

/** Matches `h-56` / `sm:h-72` display sizes in ServiceCard. */
export const SERVICE_CARD_ICON_SIZES = "(max-width: 640px) 224px, 288px";

/** Default desktop carousel column height in service modals. */
export const SERVICE_MODAL_PANEL_MIN_HEIGHT = 640;

/** Delay after closing modal before scrolling to portfolio (lets exit animation finish). */
export const SERVICE_MODAL_PORTFOLIO_NAV_DELAY_MS = 150;

/** Portfolio category keys — must match `PortfolioSection` category `key` values. */
export const PORTFOLIO_CATEGORIES = {
  all: "all",
  mascots: "mascots",
} as const;

/** Services that show a “View portfolio” CTA in the modal footer. */
export const SERVICE_PORTFOLIO_LINKS: Partial<
  Record<(typeof SERVICE_ICONS)[keyof typeof SERVICE_ICONS], { category: string }>
> = {
  [SERVICE_ICONS.video]: { category: PORTFOLIO_CATEGORIES.all },
  [SERVICE_ICONS.mascot]: { category: PORTFOLIO_CATEGORIES.mascots },
};

export function getServicePortfolioLink(iconSrc: string) {
  return SERVICE_PORTFOLIO_LINKS[iconSrc as keyof typeof SERVICE_PORTFOLIO_LINKS] ?? null;
}

export function getServiceCardVariant(index: number): ServiceCardVariant | "default" {
  return SERVICE_CARD_VARIANTS[index] ?? "default";
}
