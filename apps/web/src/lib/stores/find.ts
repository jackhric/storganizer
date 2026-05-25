"use client";

import { create } from "zustand";
import type { WarlsFrame } from "@/lib/wled/use-warls";

type FindState = {
  itemId: string | null;
  frame: WarlsFrame | null;
  setFind: (itemId: string, frame: WarlsFrame) => void;
  clearFind: () => void;
};

export const useFindStore = create<FindState>((set) => ({
  itemId: null,
  frame: null,
  setFind: (itemId, frame) => set({ itemId, frame }),
  clearFind: () => set({ itemId: null, frame: null }),
}));
