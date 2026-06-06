/**
 * Built-in device icon presets. These are a *frontend-only* convenience — the
 * backend has no concept of a preset. Clicking a preset fetches its bundled
 * asset bytes and uploads them as the device's icon, exactly like a custom file.
 *
 * Assets live in `apps/web/public/device-icons/`. To add a preset, drop a
 * PNG/GIF there (animation is supported) and add an entry below. The picker
 * renders a 4x4 grid: the first 15 presets fill cells 1–15, cell 16 is the
 * "upload custom" tile.
 */
export const DEVICE_ICON_PRESETS = [
  { key: "ghost", src: "/device-icons/ghost.png" },
] as const;

/** Fallback shown when a device has no icon set. */
export const DEFAULT_DEVICE_ICON = "/wled_device.png";
