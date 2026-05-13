"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDevices, createDevice } from "@/lib/api";
import { syncDevice, syncDeviceCells, highlightItems, clearHighlight } from "@/lib/api/custom-routes";
import type { HighlightColor } from "@/lib/api/custom-routes";

export const deviceKeys = {
  all: ["devices"] as const,
  list: () => ["devices", "list"] as const,
};

export function useDevices() {
  return useQuery({
    queryKey: deviceKeys.list(),
    queryFn: getDevices,
    refetchInterval: 10_000,
  });
}

export function useSyncDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => syncDevice(deviceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}

export function useSyncCells() {
  return useMutation({
    mutationFn: (deviceId: string) => syncDeviceCells(deviceId),
  });
}

export function useHighlightItems() {
  return useMutation({
    mutationFn: ({ itemIds, color }: { itemIds: string[]; color: HighlightColor }) =>
      highlightItems(itemIds, color),
  });
}

export function useClearHighlight() {
  return useMutation({
    mutationFn: (deviceId?: string) => clearHighlight(deviceId),
  });
}

export type DeviceFieldErrors = Partial<Record<"name" | "url", string>>;

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string }) => createDevice(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}

export function parseDeviceErrors(error: unknown): DeviceFieldErrors {
  if (!error || typeof error !== "object") return {};
  const body = ((error as Record<string, unknown>).data as Record<string, unknown> | undefined) ?? {};
  const data = (body.data as Record<string, { message?: string }> | undefined) ?? {};
  return {
    name: data.name?.message,
    url: data.url?.message,
  };
}
