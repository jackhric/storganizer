"use client";

import { useQuery } from "@tanstack/react-query";
import { getCellsByDevice } from "@/lib/api";

export const cellKeys = {
  all: ["cells"] as const,
  byDevice: (deviceId: string) => ["cells", "byDevice", deviceId] as const,
};

export function useCellsByDevice(deviceId: string | null) {
  return useQuery({
    queryKey: cellKeys.byDevice(deviceId ?? ""),
    queryFn: () => getCellsByDevice(deviceId as string),
    enabled: !!deviceId,
  });
}
