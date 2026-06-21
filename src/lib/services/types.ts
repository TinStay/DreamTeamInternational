import type { en } from "@/lib/i18n/en";

/** Shape of one entry in `t.services.items` (shared across en/bg locales). */
export type ServiceItem = (typeof en.services.items)[number];

import type { ServiceCardVariant } from "@/lib/services/constants";

export type ServiceItemWithVariant = ServiceItem & {
  variant: ServiceCardVariant | "default";
};
