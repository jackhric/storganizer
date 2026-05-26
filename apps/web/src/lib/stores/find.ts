"use client";

import { create } from "zustand";
import type { Rgb } from "@/lib/color/oklch";
import type { WarlsFrame, WarlsDeviceFrame } from "@/lib/wled/use-warls";

type FindState = {
  selections: Map<string, WarlsFrame>;
  toggle: (itemId: string, frame: WarlsFrame) => void;
  remove: (itemId: string) => void;
  clear: () => void;
};

export const useFindStore = create<FindState>((set) => ({
  selections: new Map(),
  toggle: (itemId, frame) =>
    set((state) => {
      const next = new Map(state.selections);
      if (next.has(itemId)) next.delete(itemId);
      else next.set(itemId, frame);
      return { selections: next };
    }),
  remove: (itemId) =>
    set((state) => {
      if (!state.selections.has(itemId)) return state;
      const next = new Map(state.selections);
      next.delete(itemId);
      return { selections: next };
    }),
  clear: () => set({ selections: new Map() }),
}));

/**
 * Merge all selected items' frames into a single WARLS frame.
 * Later selections win on conflicting LEDs.
 */
export function mergeFrames(selections: Map<string, WarlsFrame>): WarlsFrame | null {
  if (selections.size === 0) return null;
  const merged: WarlsFrame = new Map();
  for (const frame of selections.values()) {
    for (const [deviceId, perDevice] of frame) {
      let target = merged.get(deviceId) as WarlsDeviceFrame | undefined;
      if (!target) {
        target = new Map<number, Rgb>();
        merged.set(deviceId, target);
      }
      for (const [led, color] of perDevice) target.set(led, color);
    }
  }
  return merged;
}
