import type { TagsResponse } from "@/lib/api/types";

/** djb2 hash of a string. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/** h: 0–360, s/l: 0–100. */
function hslToHex(h: number, s: number, l: number): string {
  const S = s / 100;
  const L = l / 100;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Deterministic fallback color for a tag name. */
export function deterministicColor(name: string): string {
  const hue = hash(name) % 360;
  return hslToHex(hue, 55, 50);
}

/** Pleasant random hex color (constrained saturation + lightness). */
export function randomTagColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return hslToHex(hue, 55, 50);
}

/** Returns the configured hex color for a tag name, or a deterministic fallback. */
export function getTagColor(name: string, tags?: TagsResponse[] | null): string {
  if (tags) {
    const t = tags.find((x) => x.name === name);
    if (t?.color) return t.color;
  }
  return deterministicColor(name);
}

/**
 * Returns a readable foreground color (#000 or #fff) for the given hex
 * background using relative luminance.
 */
export function readableForeground(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#000";
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.55 ? "#000" : "#fff";
}
