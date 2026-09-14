/** Stable icon paths — used as service identifiers across locales (i18n items have no separate id). */
export const SERVICE_ICONS = {
  video: "/services/icons/ai_video.png",
  mascot: "/services/icons/ai_mascot.png",
  images: "/services/icons/ai_images.png",
  automation: "/services/icons/ai_automation.png",
} as const;

export type ServiceKey = keyof typeof SERVICE_ICONS;

/** Reverse lookup: icon path -> service key (the quote wizard's `service`). */
export const SERVICE_KEY_BY_ICON: Record<string, ServiceKey> = Object.fromEntries(
  (Object.entries(SERVICE_ICONS) as [ServiceKey, string][]).map(([key, icon]) => [icon, key])
);

/** Service key for a card, looked up by its icon path (the stable identifier). */
export function getServiceKey(iconSrc: string): ServiceKey | undefined {
  return SERVICE_KEY_BY_ICON[iconSrc];
}

/** Card surfaces (warm tints: video blue · mascot amber · images coral · automation green), in `services.items` order. */
export const SERVICE_CARD_VARIANTS = ["blue", "amber", "coral", "green"] as const;

export type ServiceCardVariant = (typeof SERVICE_CARD_VARIANTS)[number];

/** Render size passed to Next.js Image (icons are 2048×2048; displayed smaller via CSS). */
export const SERVICE_CARD_ICON_PX = 320;

/** Icon fills the card's right column (~230px tall) in ServiceCard. */
export const SERVICE_CARD_ICON_SIZES = "(max-width: 640px) 1024px, 2048px";

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

/** SEO-friendly, locale-independent URL slug per service, keyed to the stable icon path. */
export const SERVICE_SLUG_BY_ICON: Record<string, string> = {
  [SERVICE_ICONS.video]: "ai-video",
  [SERVICE_ICONS.mascot]: "brand-mascots",
  [SERVICE_ICONS.images]: "ai-images",
  [SERVICE_ICONS.automation]: "ai-automation",
};

/** Reverse lookup: slug -> icon path. */
export const SERVICE_ICON_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_SLUG_BY_ICON).map(([icon, slug]) => [slug, icon])
);

/** All service slugs, in card order. */
export const SERVICE_SLUGS = Object.values(SERVICE_SLUG_BY_ICON);

/** Slug for a service, looked up by its icon path (the stable identifier). */
export function getServiceSlug(iconSrc: string): string | undefined {
  return SERVICE_SLUG_BY_ICON[iconSrc];
}

/** Icon path (service identifier) for a URL slug. */
export function getServiceIconBySlug(slug: string): string | undefined {
  return SERVICE_ICON_BY_SLUG[slug];
}
