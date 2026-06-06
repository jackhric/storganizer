"use client";

import { useEffect, useMemo, useState } from "react";
import { mergeFrames, useFindStore } from "@/lib/stores/find";
import { useWarls, type WarlsFrame } from "@/lib/wled/use-warls";
import { useLightingSettings } from "@/features/settings/hooks/use-lighting-settings";
import {
  applyBrightness,
  effectBrightness,
  overlayFrames,
  recolorFrame,
} from "@/lib/wled/effects";

// Search-preview LEDs stream at this fraction of the highlight color, so the
// transient "candidates" layer reads as dimmer than clicked "found" items.
const PREVIEW_FACTOR = 0.4;

export function FindProvider() {
  const selections = useFindStore((s) => s.selections);
  const preview = useFindStore((s) => s.preview);
  const { color, effect } = useLightingSettings();
  // Recolor against the current setting so a color change applies live to
  // already-selected items, not just on the next click.
  const base = useMemo(() => {
    const merged = mergeFrames(selections);
    return merged ? recolorFrame(merged, color) : null;
  }, [selections, color]);

  // Bottom layer: the search preview, recolored and dimmed. Stays solid (no
  // blink/pulse) so it reads as a calm backdrop to the animated selections.
  const previewBase = useMemo(() => {
    const merged = mergeFrames(preview);
    if (!merged) return null;
    return applyBrightness(recolorFrame(merged, color), PREVIEW_FACTOR);
  }, [preview, color]);

  // For `solid` we feed the base frame straight through. For animated effects
  // we recompute a brightness-scaled copy on every animation frame and hold it
  // in state so `useWarls` streams the breathing/blinking color. The existing
  // send-throttle and backend keepalive handle the continuous updates.
  // Only the selections (`base`) layer animates; the preview stays solid.
  const animate = base !== null && effect !== "solid";
  const [animated, setAnimated] = useState<WarlsFrame | null>(null);

  useEffect(() => {
    if (!animate || !base) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const factor = effectBrightness(effect, now - start);
      setAnimated(applyBrightness(base, factor));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, base, effect]);

  // While animating, show the latest animated frame; otherwise the base frame
  // (solid, or cleared). `animated` may lag one frame at the start of an
  // animation — base is a safe stand-in until the first tick lands.
  const selectionFrame = animate ? (animated ?? base) : base;
  // Composite selections over the dimmed preview so found items keep their full
  // color on any LED shared with a previewed item.
  const frame = overlayFrames(previewBase, selectionFrame);
  useWarls(frame);
  return null;
}
