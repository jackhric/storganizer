import type { Rgb } from "@/lib/color/hsl";
import type { WarlsFrame, WarlsDeviceFrame } from "@/lib/wled/use-warls";
import type { HighlightEffect } from "@/features/settings/hooks/use-lighting-settings";

// Animation timings. Blink is a hard on/off square wave; pulse is a smooth
// sine "breathe" that never fully darkens so the location stays readable.
const BLINK_PERIOD_MS = 700; // full on→off→on cycle
const PULSE_PERIOD_MS = 1600;
const PULSE_MIN = 0.15; // floor brightness so pulse never reads as "off"

/**
 * Brightness factor in [0,1] for a given effect at a point in time.
 * `solid` is always full; `blink`/`pulse` vary with `elapsedMs`.
 */
export function effectBrightness(effect: HighlightEffect, elapsedMs: number): number {
  switch (effect) {
    case "blink":
      // First half of the period on, second half off.
      return elapsedMs % BLINK_PERIOD_MS < BLINK_PERIOD_MS / 2 ? 1 : 0;
    case "pulse": {
      // Sine eased from PULSE_MIN..1.
      const phase = (elapsedMs % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
      const wave = (Math.sin(phase * 2 * Math.PI - Math.PI / 2) + 1) / 2; // 0..1
      return PULSE_MIN + (1 - PULSE_MIN) * wave;
    }
    case "solid":
    default:
      return 1;
  }
}

function scaleChannel(value: number, factor: number): number {
  const scaled = Math.round(value * factor);
  return scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
}

function scaleColor(color: Rgb, factor: number): Rgb {
  return {
    r: scaleChannel(color.r, factor),
    g: scaleChannel(color.g, factor),
    b: scaleChannel(color.b, factor),
  };
}

/**
 * Return a copy of the frame with every lit LED set to `color`. Used so a
 * global color change recolors already-selected items live, instead of only
 * on the next click.
 */
export function recolorFrame(frame: WarlsFrame, color: Rgb): WarlsFrame {
  const out: WarlsFrame = new Map();
  for (const [deviceId, perDevice] of frame) {
    const recolored: WarlsDeviceFrame = new Map();
    for (const led of perDevice.keys()) recolored.set(led, color);
    out.set(deviceId, recolored);
  }
  return out;
}

/**
 * Composite two frames into a new one: `over` is layered on top of `under`, so
 * on any LED lit by both, `over`'s color wins. Used to render the search
 * preview (`under`, dimmed) beneath the manual selections (`over`, full
 * brightness) without either layer mutating the other.
 */
export function overlayFrames(
  under: WarlsFrame | null,
  over: WarlsFrame | null,
): WarlsFrame | null {
  if (!under) return over;
  if (!over) return under;
  const out: WarlsFrame = new Map();
  for (const [deviceId, perDevice] of under) {
    out.set(deviceId, new Map(perDevice));
  }
  for (const [deviceId, perDevice] of over) {
    let target = out.get(deviceId);
    if (!target) {
      target = new Map<number, Rgb>();
      out.set(deviceId, target);
    }
    for (const [led, color] of perDevice) target.set(led, color);
  }
  return out;
}

/**
 * Return a brightness-scaled copy of a merged frame. `factor === 1` returns the
 * frame unchanged (the solid path pays no per-LED cost).
 */
export function applyBrightness(frame: WarlsFrame, factor: number): WarlsFrame {
  if (factor === 1) return frame;
  const out: WarlsFrame = new Map();
  for (const [deviceId, perDevice] of frame) {
    const scaled: WarlsDeviceFrame = new Map();
    for (const [led, color] of perDevice) scaled.set(led, scaleColor(color, factor));
    out.set(deviceId, scaled);
  }
  return out;
}
