"use client";

import { useCallback } from "react";
import { useFindStore } from "@/lib/stores/find";
import { useLightingSettings } from "@/features/settings/hooks/use-lighting-settings";
import type { WarlsFrame } from "@/lib/wled/use-warls";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

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
      const frame: WarlsFrame = new Map();
      for (const a of item.assignments ?? []) {
        const cell = a.cell;
        if (!cell) continue;
        let perDevice = frame.get(cell.device_id);
        if (!perDevice) {
          perDevice = new Map();
          frame.set(cell.device_id, perDevice);
        }
        perDevice.set(cell.led_index, highlightColor);
      }
      // Items with no assigned cells can't be lit; nothing to select.
      if (frame.size === 0) return;
      toggleSelection(item.id, frame);
    },
    [selections, removeSelection, toggleSelection, highlightColor],
  );

  return { selections, isSelected, toggle };
}
