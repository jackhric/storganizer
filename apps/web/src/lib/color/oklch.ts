// OKLCH → sRGB conversion. Reference: https://bottosson.github.io/posts/oklab/
//
// Pipeline: OKLCH (cylindrical) → OKLab (cartesian) → linear sRGB → sRGB (gamma).
// Out-of-gamut colors are clipped per-channel into [0,1] before gamma encoding.

export type Rgb = { r: number; g: number; b: number };

/**
 * Convert OKLCH to 0–255 sRGB.
 * @param l Lightness in [0,1] (e.g. 0.65 in the app's light theme).
 * @param c Chroma (the accent store's chroma value).
 * @param hDegrees Hue in degrees.
 */
export function oklchToRgb(l: number, c: number, hDegrees: number): Rgb {
  const hRad = (hDegrees * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLab → linear LMS
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = l - 0.0894841775 * a - 1.2914855480 * b;

  const lLms = lRoot ** 3;
  const mLms = mRoot ** 3;
  const sLms = sRoot ** 3;

  // Linear LMS → linear sRGB
  const rLin = +4.0767416621 * lLms - 3.3077115913 * mLms + 0.2309699292 * sLms;
  const gLin = -1.2684380046 * lLms + 2.6097574011 * mLms - 0.3413193965 * sLms;
  const bLin = -0.0041960863 * lLms - 0.7034186147 * mLms + 1.7076147010 * sLms;

  return {
    r: Math.round(linearToSrgb(clamp01(rLin)) * 255),
    g: Math.round(linearToSrgb(clamp01(gLin)) * 255),
    b: Math.round(linearToSrgb(clamp01(bLin)) * 255),
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}
