"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAccentStore } from "@/lib/stores/accent";

export function AccentProvider() {
  const { hue, chroma } = useAccentStore();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const dark = resolvedTheme === "dark";

    const primary      = `oklch(${dark ? "0.75" : "0.65"} ${chroma} ${hue})`;
    const primaryFg    = dark ? "oklch(0.09 0 0)" : "oklch(0.98 0 0)";
    const ring         = `oklch(${dark ? "0.75" : "0.65"} ${chroma} ${hue} / 60%)`;
    const sidebarPrimary = primary;
    const sidebarRing  = ring;
    const chart1       = primary;

    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", ring);
    root.style.setProperty("--sidebar-primary", sidebarPrimary);
    root.style.setProperty("--sidebar-ring", sidebarRing);
    root.style.setProperty("--chart-1", chart1);
  }, [hue, chroma, resolvedTheme]);

  return null;
}
