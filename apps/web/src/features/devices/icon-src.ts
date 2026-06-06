import { deviceIconUrl } from "@/lib/api/urls";
import type { DeviceRead } from "@/lib/api/generated/storganizerAPI.schemas";
import { DEFAULT_DEVICE_ICON } from "@/features/devices/icons";

/**
 * The single source of truth for a device's `<img src>`. A device with an icon
 * is served from the backend (cache-busted on `updated_at`); otherwise we fall
 * back to the default ghost.
 */
export function deviceIconSrc(device: DeviceRead): string {
  return device.icon
    ? deviceIconUrl(device.id, device.updated_at)
    : DEFAULT_DEVICE_ICON;
}
