"use client";

import { useCallback } from "react";
import { useFindStore } from "@/lib/stores/find";
import { useLightingSettings } from "@/features/settings/hooks/use-lighting-settings";
import type { Rgb } from "@/lib/color/hsl";
import type { WarlsFrame } from "@/lib/wled/use-warls";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

/**
 * Build a WLED frame lighting every assigned cell of `item` with `color`.
 * Returns `null` when the item has no lightable cells (nothing to show).
 */
function buildItemFrame(item: ItemRead, color: Rgb): WarlsFrame | null {
  const frame: WarlsFrame = new Map();
  for (const a of item.assignments ?? []) {
    const cell = a.cell;
    if (!cell) continue;
    let perDevice = frame.get(cell.device_id);
    if (!perDevice) {
      perDevice = new Map();
      frame.set(cell.device_id, perDevice);
    }
    perDevice.set(cell.led_index, color);
  }
  return frame.size === 0 ? null : frame;
}

/**
 * Shared item "find"/selection behavior, backed by the global `useFindStore`.
 *
 * Selecting an item builds a WLED frame from its cell assignments (lit with the
 * configured highlight color) and toggles it into the store. Because the store
 * is an app-wide singleton, selection made here is the *same* selection shown on
 * the Items page — and vice versa. This hook is the single source of that logic
 * so the search menu and the Items grid never drift apart.
 */
export function useFindSelection() {
  const selections = useFindStore((s) => s.selections);
  const toggleSelection = useFindStore((s) => s.toggle);
  const removeSelection = useFindStore((s) => s.remove);
  const { color: highlightColor } = useLightingSettings();

  const isSelected = useCallback(
    (itemId: string) => selections.has(itemId),
    [selections],
  );

  const toggle = useCallback(
    (item: ItemRead) => {
      if (selections.has(item.id)) {
        removeSelection(item.id);
        return;
      }
      // Items with no assigned cells can't be lit; nothing to select.
      const frame = buildItemFrame(item, highlightColor);
      if (!frame) return;
      toggleSelection(item.id, frame);
    },
    [selections, removeSelection, toggleSelection, highlightColor],
  );

  return { selections, isSelected, toggle };
}

/**
 * Search-driven LED *preview*, backed by the global `useFindStore`'s `preview`
 * slice. Unlike `useFindSelection` (a per-item, persistent toggle), this sets
 * the entire preview to the items currently shown in search — and clears it.
 * The preview is rendered dimmer and beneath manual selections (see
 * `FindProvider`), so it never disturbs clicked "found" items.
 */
export function useSearchPreview() {
  const setPreview = useFindStore((s) => s.setPreview);
  const clearPreview = useFindStore((s) => s.clearPreview);
  const { color: highlightColor } = useLightingSettings();

  const setPreviewItems = useCallback(
    (items: ItemRead[]) => {
      const frames = new Map<string, WarlsFrame>();
      for (const item of items) {
        const frame = buildItemFrame(item, highlightColor);
        if (frame) frames.set(item.id, frame);
      }
      setPreview(frames);
    },
    [setPreview, highlightColor],
  );

  return { setPreviewItems, clearPreview };
}
