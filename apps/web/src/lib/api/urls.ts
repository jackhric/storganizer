import { BACKEND_URL } from "./mutator";

export function itemImageUrl(itemId: string, size?: string): string {
  const path = `/api/items/${itemId}/image${size ? `?size=${encodeURIComponent(size)}` : ""}`;
  return `${BACKEND_URL}${path}`;
}
