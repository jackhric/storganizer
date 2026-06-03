// HSL ↔ sRGB ↔ hex helpers.
//
// HSL is intuitive for picking: hue is "which color", saturation is "how
// vivid", lightness is "how bright". We use it for both the accent color and
// the LED highlight color, then convert to the RGB the LEDs expect or the CSS
// the theme expects.

export type Rgb = { r: number; g: number; b: number };

/** Hue 0–360, saturation/lightness 0–100 (percent). */
export type Hsl = { h: number; s: number; l: number };

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Convert HSL to 0–255 sRGB.
 * @param h Hue in degrees [0,360].
 * @param s Saturation in percent [0,100].
 * @param l Lightness in percent [0,100].
 */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const hue = ((h % 360) + 360) % 360;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Convert 0–255 sRGB to HSL (h 0–360, s/l 0–100). */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function toHex2(v: number): string {
  return clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
}

/** "#rrggbb" for an RGB triplet. */
export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

/** A CSS `rgb()` string, e.g. for inline style backgrounds. */
export function rgbCss({ r, g, b }: Rgb): string {
  return `rgb(${r} ${g} ${b})`;
}

/** A CSS `hsl()` string, e.g. for swatches and slider gradients. */
export function hslCss(h: number, s: number, l: number, alpha?: number): string {
  return alpha === undefined
    ? `hsl(${h} ${s}% ${l}%)`
    : `hsl(${h} ${s}% ${l}% / ${alpha}%)`;
}
