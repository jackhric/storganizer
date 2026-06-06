import { deviceIconSrc } from "@/features/devices/icon-src";
import type { DeviceRead } from "@/lib/api/generated/storganizerAPI.schemas";
import { cn } from "@/lib/utils";

type Props = {
  device: DeviceRead;
  /** Square box size in px. The image always fits inside this 1:1 box. */
  size: number;
  className?: string;
};

/**
 * Renders a device's icon inside a fixed square box. The image is *contained*,
 * never resizing the box — a non-square custom upload is letterboxed instead of
 * stretching or cropping. Use this everywhere a device icon appears so sizing is
 * consistent app-wide.
 */
export function DeviceIcon({ device, size, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={deviceIconSrc(device)}
      alt={device.name}
      width={size}
      height={size}
      className={cn(
        "shrink-0 object-contain",
        !device.is_online && "grayscale opacity-40",
        className,
      )}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}
