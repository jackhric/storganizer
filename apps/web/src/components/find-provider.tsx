"use client";

import { useMemo } from "react";
import { mergeFrames, useFindStore } from "@/lib/stores/find";
import { useWarls } from "@/lib/wled/use-warls";

export function FindProvider() {
  const selections = useFindStore((s) => s.selections);
  const frame = useMemo(() => mergeFrames(selections), [selections]);
  useWarls(frame);
  return null;
}
