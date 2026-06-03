"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentPreset = {
  name: string;
  h: number;
  s: number;
  l: number;
};

// HSL presets — intuitive hue/saturation/lightness. The first (Amber) is the
// app default, matching the original accent.
export const ACCENT_PRESETS: AccentPreset[] = [
  { name: "Amber", h: 35, s: 95, l: 55 },
  { name: "Red", h: 5, s: 85, l: 55 },
  { name: "Rose", h: 350, s: 80, l: 58 },
  { name: "Purple", h: 270, s: 75, l: 60 },
  { name: "Blue", h: 220, s: 80, l: 58 },
  { name: "Cyan", h: 190, s: 80, l: 50 },
  { name: "Green", h: 145, s: 65, l: 45 },
  { name: "Lime", h: 95, s: 70, l: 48 },
];

const DEFAULT = ACCENT_PRESETS[0];

type AccentState = {
  h: number;
  s: number;
  l: number;
  // When on, the accent is nudged lighter in dark mode for contrast. When off,
  // the exact picked color is used on both themes.
  autoAdjust: boolean;
  setAccent: (h: number, s: number, l: number) => void;
  setAutoAdjust: (autoAdjust: boolean) => void;
};

export const useAccentStore = create<AccentState>()(
  persist(
    (set) => ({
      h: DEFAULT.h,
      s: DEFAULT.s,
      l: DEFAULT.l,
      autoAdjust: true,
      setAccent: (h, s, l) => set({ h, s, l }),
      setAutoAdjust: (autoAdjust) => set({ autoAdjust }),
    }),
    // New key — the old "storganizer-accent" held an OKLCH {hue, chroma} shape.
    { name: "storganizer-accent-hsl" },
  ),
);
