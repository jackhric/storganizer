"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectionBorderStyle = "marching-ants" | "solid";

type SelectionBorderState = {
  style: SelectionBorderStyle;
  setStyle: (style: SelectionBorderStyle) => void;
};

export const useSelectionBorderStore = create<SelectionBorderState>()(
  persist(
    (set) => ({
      style: "marching-ants",
      setStyle: (style) => set({ style }),
    }),
    { name: "storganizer-selection-border" },
  ),
);
