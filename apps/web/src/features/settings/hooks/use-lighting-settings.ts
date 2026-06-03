"use client";

import {
  getGetSettingsQueryKey,
  useGetSettings,
  useUpdateSettings as useUpdateSettingsGenerated,
} from "@/lib/api/generated/settings";
import type {
  SettingsRead,
  SettingsUpdate,
} from "@/lib/api/generated/storganizerAPI.schemas";
import type { Rgb } from "@/lib/color/hsl";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export type HighlightEffect = SettingsRead["highlight_effect"];

/**
 * Default highlight — the original hardcoded orange. Used as a fallback while
 * the server settings are still loading so LEDs never go dark mid-fetch.
 */
export const DEFAULT_HIGHLIGHT_COLOR: Rgb = { r: 255, g: 140, b: 0 };
export const DEFAULT_HIGHLIGHT_EFFECT: HighlightEffect = "solid";

/**
 * The single source of truth for LED highlight appearance (color + effect),
 * backed by the global server settings. Falls back to the orange/solid defaults
 * until the first fetch resolves.
 */
export function useLightingSettings() {
  const { data, isLoading } = useGetSettings();
  // Stable identity: derive a single color object keyed on the raw channels so
  // consumers' `useMemo`/`useEffect` deps don't churn every render (a new object
  // literal each render would re-run downstream effects and can loop).
  const r = data?.highlight_r ?? DEFAULT_HIGHLIGHT_COLOR.r;
  const g = data?.highlight_g ?? DEFAULT_HIGHLIGHT_COLOR.g;
  const b = data?.highlight_b ?? DEFAULT_HIGHLIGHT_COLOR.b;
  const color: Rgb = useMemo(() => ({ r, g, b }), [r, g, b]);
  const effect: HighlightEffect = data?.highlight_effect ?? DEFAULT_HIGHLIGHT_EFFECT;
  return { settings: data, color, effect, isLoading };
}

/**
 * Mutation that patches the global lighting settings and refreshes the cache so
 * every consumer (inventory page, find provider, settings UI) reacts at once.
 */
export function useUpdateLightingSettings() {
  const qc = useQueryClient();
  const mutation = useUpdateSettingsGenerated({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() }),
    },
  });
  return {
    ...mutation,
    mutate: (payload: SettingsUpdate) => mutation.mutate({ data: payload }),
    mutateAsync: (payload: SettingsUpdate) =>
      mutation.mutateAsync({ data: payload }),
  };
}
