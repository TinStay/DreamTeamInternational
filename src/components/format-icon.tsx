import { IconAspectRatioFilled, IconDeviceDesktopFilled, IconDeviceMobileFilled, IconDeviceTabletFilled, IconDeviceTvFilled, IconMovie, IconSquareFilled } from "@tabler/icons-react";
import { formatsOf, type FormatKey } from "@/lib/project-changes";
import { cn } from "@/lib/utils";

/** The device or shape each format is for: a phone for 9:16, a screen for 16:9, a TV for 4:3, a tablet for 3:4, a square, a film for 21:9. */
export const FORMAT_ICONS: Record<FormatKey, typeof IconDeviceMobileFilled> = {
  vertical: IconDeviceMobileFilled,
  horizontal: IconDeviceDesktopFilled,
  classic: IconDeviceTvFilled,
  portrait: IconDeviceTabletFilled,
  square: IconSquareFilled,
  cinema: IconMovie,
};

/**
 * A project's format as an icon: the device it is made for - one, or the first two side by side when the film comes in
 * several formats. Unknown text falls back to the generic aspect-ratio icon.
 */
export function FormatIcon({ format, className }: { format: string | null | undefined; className?: string }) {
  const keys = formatsOf(format);
  if (keys.length === 0) return <IconAspectRatioFilled className={className} aria-hidden />;
  if (keys.length === 1) {
    const Icon = FORMAT_ICONS[keys[0]];
    return <Icon className={className} aria-hidden />;
  }
  const [A, B] = [FORMAT_ICONS[keys[0]], FORMAT_ICONS[keys[1]]];
  return (
    <span className="relative inline-flex items-end" aria-hidden>
      <A className={cn(className, "scale-90")} />
      <B className={cn(className, "-ml-2 scale-75 opacity-80")} />
    </span>
  );
}
