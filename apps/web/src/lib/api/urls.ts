import { BACKEND_URL } from "./mutator";

export function itemImageUrl(itemId: string, size?: string): string {
  const url = new URL(`${BACKEND_URL}/api/items/${itemId}/image`);
  if (size) url.searchParams.set("size", size);
  return url.toString();
}
