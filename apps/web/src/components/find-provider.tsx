"use client";

import { useFindStore } from "@/lib/stores/find";
import { useWarls } from "@/lib/wled/use-warls";

export function FindProvider() {
  const frame = useFindStore((s) => s.frame);
  useWarls(frame);
  return null;
}
