export type Partner = {
  id: string;
  /** Logo for light surfaces (dark ink). */
  light: string | null;
  /** Logo for dark surfaces (white ink). */
  dark: string | null;
  href?: string;
  ariaLabel: string;
  /** Only a white-ink mark exists: render it inverted (black) on light surfaces. */
  invertOnLight?: boolean;
};

export const PARTNER_ICON_BASE = "/company_icons/";

export const PARTNERS: Partner[] = [
  {
    id: "mindguard",
    light: null,
    dark: "mindguard_logo_dark.png", // white-ink mark only
    href: "https://mymindguard.ai/",
    ariaLabel: "Mindguard",
    invertOnLight: true,
  },
  // Parked (not shown for now): Asia Event Agency, Hubchev Properties, Valtcan, Designed by GG.
  // {
  //   id: "asia",
  //   light: "asia_agency_logo_light.png",
  //   dark: "asia_agency_logo_dark.png",
  //   href: "https://asiaeventagency.com/",
  //   ariaLabel: "Asia Event Agency",
  // },
  {
    id: "emblema",
    light: "emblema_logo_light.png",
    dark: null,
    href: "https://emblema.bg/",
    ariaLabel: "Emblema",
  },
  // {
  //   id: "hubchev",
  //   light: null,
  //   dark: "hubchev_logo_dark.png",
  //   href: "https://hubchevproperties.com/",
  //   ariaLabel: "Hubchev Properties",
  // },
  {
    id: "hus-estate",
    light: "hus_estate_logo_light.png",
    dark: "hus_estate_logo_dark.png",
    href: "https://husestate.com/bg/home",
    ariaLabel: "Hus Estate",
  },
  {
    id: "imotalert",
    light: "imot_alert_logo_light.png",
    dark: "imot_alert_logo_dark.png",
    href: "https://www.imotalert.bg/",
    ariaLabel: "ImotAlert",
  },
  {
    id: "infinity",
    light: "infinity_logo_light.png",
    dark: "infinity_logo_dark.png",
    href: "https://infinityproperty.bg/",
    ariaLabel: "Infinity Property",
  },
  {
    id: "boleron",
    light: "boleron_logo_light.png",
    dark: null,
    href: "https://boleron.bg/",
    ariaLabel: "Boleron",
  },
  {
    id: "isupport",
    light: "isupport_logo_light.png",
    dark: "isupport_logo_dark.png",
    ariaLabel: "iSupport",
  },
  {
    id: "oikia",
    light: "oikia_logo_light.png",
    dark: "oikia_logo_dark.png",
    href: "https://www.oikia.com/",
    ariaLabel: "Oikia",
  },
  {
    id: "osmo",
    light: "osmo_logo_light.png",
    dark: "osmo_logo_dark.png",
    href: "https://www.osmobg.com/",
    ariaLabel: "OSMO",
  },
  {
    id: "palltex",
    light: "pallteximot_logo_light.png",
    dark: null,
    href: "https://palltex.bg/",
    ariaLabel: "Palltex",
  },
  {
    id: "plasico",
    light: "plasico_logo_light.png",
    dark: null,
    href: "https://plasico.bg/",
    ariaLabel: "Plasico IT Superstore",
  },
  {
    id: "rsg",
    light: "rsg_logo_light.png",
    dark: "rsg_logo_dark.png",
    href: "https://rsgarch.com/",
    ariaLabel: "RSG Architects",
  },
  {
    id: "smartpharmacy",
    light: "smartpharmacy_logo_light.png",
    dark: null,
    href: "https://smartpharmacy.bg/",
    ariaLabel: "Smart Pharmacy",
  },
  {
    id: "stroy-alliance",
    light: "stroy_alliance_logo_light.png",
    dark: "stroy_alliance_logo_dark.png",
    href: "https://stroyalianceinvest.eu/",
    ariaLabel: "Stroy Alliance Invest",
  },
  // {
  //   id: "valtcan",
  //   light: "valtcan_logo_light.png",
  //   dark: "valtcan_logo_dark.png",
  //   href: "https://www.valtcan.com/",
  //   ariaLabel: "Valtcan",
  // },
  {
    id: "vidos",
    light: "vidos_logo_light.png",
    dark: null,
    href: "https://www.vidos.shop/",
    ariaLabel: "Vidos",
  },
  // {
  //   id: "designedbygg",
  //   light: "designedbygg_logo_light.png",
  //   dark: "designedbygg_logo_dark.png",
  //   href: "http://designedby.gg/",
  //   ariaLabel: "Designed by GG",
  // },
];

/**
 * The hero's two rows, left to right. The key clients - the case studies and the other big names (Plasico, Palltex,
 * Boleron, iSupport / Mindguard, Hus Estate, Emblema, Oikia, OSMO) - take the middle of each row and the rest the
 * sides (the client's ask); the phone marquees run the same two rows. An active partner left out of the plan is
 * appended to the second row, so nothing in `PARTNERS` can silently disappear.
 */
const HERO_ROW_PLAN: readonly (readonly string[])[] = [
  ["imotalert", "infinity", "plasico", "palltex", "boleron", "isupport", "rsg", "smartpharmacy"],
  ["stroy-alliance", "mindguard", "hus-estate", "emblema", "oikia", "osmo", "vidos"],
];

export function heroPartnerRows(): [Partner[], Partner[]] {
  const byId = new Map(PARTNERS.map((partner) => [partner.id, partner]));
  const rows = HERO_ROW_PLAN.map((ids) => ids.flatMap((id) => byId.get(id) ?? []));
  const placed = new Set(HERO_ROW_PLAN.flat());
  const [first = [], second = []] = rows;
  return [first, [...second, ...PARTNERS.filter((partner) => !placed.has(partner.id))]];
}
