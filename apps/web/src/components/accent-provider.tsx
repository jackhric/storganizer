"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAccentStore } from "@/lib/stores/accent";
import { hslCss } from "@/lib/color/hsl";

export function AccentProvider() {
  const { h, s, l, autoAdjust } = useAccentStore();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const dark = resolvedTheme === "dark";

    // In dark mode, optionally nudge the accent lighter for contrast against the
    // dark background. With auto-adjust off, the picked color is used as-is.
    const lightness = dark && autoAdjust ? Math.min(l + 12, 92) : l;

    const primary = hslCss(h, s, lightness);
    // Pick a readable foreground: dark text on light accents, light text on dark.
    const primaryFg = lightness > 60 ? "oklch(0.09 0 0)" : "oklch(0.98 0 0)";
    const ring = hslCss(h, s, lightness, 60);

    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", ring);
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--sidebar-ring", ring);
    root.style.setProperty("--chart-1", primary);
  }, [h, s, l, autoAdjust, resolvedTheme]);

  return null;
}
