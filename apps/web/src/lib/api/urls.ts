import { BACKEND_URL } from "./mutator";

export function itemImageUrl(
  itemId: string,
  size?: string,
  version?: string,
): string {
  const params = new URLSearchParams();
  if (size) params.set("size", size);
  // Cache-buster: when the item changes, `version` (its updated_at) changes,
  // so the URL changes and the browser refetches instead of serving the stale
  // image from its HTTP cache. Stable otherwise, keeping the cache effective.
  if (version) params.set("v", version);
  const query = params.toString();
  const path = `/api/items/${itemId}/image${query ? `?${query}` : ""}`;
  return `${BACKEND_URL}${path}`;
}

export function deviceIconUrl(deviceId: string, version?: string): string {
  // Cache-buster keyed off the device's updated_at: the icon URL is otherwise
  // stable across re-uploads, so without this the browser serves the stale icon.
  const query = version ? `?v=${encodeURIComponent(version)}` : "";
  return `${BACKEND_URL}/api/devices/${deviceId}/icon${query}`;
}
