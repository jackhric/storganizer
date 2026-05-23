"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDevices, createDevice, updateDevice, deleteDevice } from "@/lib/api";
import { syncDevice, syncDeviceCells, highlightItems, clearHighlight, refreshDevices } from "@/lib/api/custom-routes";
import type { HighlightColor } from "@/lib/api/custom-routes";
import { pb } from "@/lib/api/client";
import type { DevicesResponse } from "@/lib/api/types";

export const deviceKeys = {
  all: ["devices"] as const,
  list: () => ["devices", "list"] as const,
};

export function useDevices() {
  const qc = useQueryClient();

  useEffect(() => {
    let unsub: (() => Promise<void>) | undefined;

    pb.collection("devices").subscribe<DevicesResponse>("*", ({ action, record }) => {
      qc.setQueryData<DevicesResponse[]>(deviceKeys.list(), (old = []) => {
        if (action === "create") return [...old, record].sort((a, b) => a.name.localeCompare(b.name));
        if (action === "update") return old.map((d) => (d.id === record.id ? record : d));
        if (action === "delete") return old.filter((d) => d.id !== record.id);
        return old;
      });
    }).then((fn) => { unsub = fn; });

    return () => { unsub?.(); };
  }, [qc]);

  return useQuery({
    queryKey: deviceKeys.list(),
    queryFn: getDevices,
  });
}

export function useSyncDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => syncDevice(deviceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}

export function useRefreshDevices() {
  return useMutation({
    mutationFn: () => refreshDevices(),
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

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) => updateDevice(id, data as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),
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
