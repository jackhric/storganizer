"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentPreset = {
  name: string;
  hue: number;
  chroma: number;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: "Amber",   hue: 54,  chroma: 0.18 },
  { name: "Red",     hue: 25,  chroma: 0.22 },
  { name: "Rose",    hue: 10,  chroma: 0.20 },
  { name: "Purple",  hue: 290, chroma: 0.20 },
  { name: "Blue",    hue: 230, chroma: 0.20 },
  { name: "Cyan",    hue: 200, chroma: 0.18 },
  { name: "Green",   hue: 145, chroma: 0.18 },
  { name: "Lime",    hue: 120, chroma: 0.20 },
];

type AccentState = {
  hue: number;
  chroma: number;
  setAccent: (hue: number, chroma?: number) => void;
};

export const useAccentStore = create<AccentState>()(
  persist(
    (set) => ({
      hue: 54,
      chroma: 0.18,
      setAccent: (hue, chroma = 0.18) => set({ hue, chroma }),
    }),
    { name: "storganizer-accent" }
  )
);
