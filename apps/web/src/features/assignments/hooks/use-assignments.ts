"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createAssignment, deleteAssignment, getAssignmentsByDevice, updateAssignment } from "@/lib/api";
import type { Update } from "@/lib/api";
import { itemKeys } from "@/features/items/hooks/use-items";

export const assignmentKeys = {
  all: ["assignments"] as const,
  byDevice: (deviceId: string) => ["assignments", "byDevice", deviceId] as const,
};

export function useAssignmentsByDevice(deviceId: string | null) {
  return useQuery({
    queryKey: assignmentKeys.byDevice(deviceId ?? ""),
    queryFn: () => getAssignmentsByDevice(deviceId as string),
    enabled: !!deviceId,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, itemId }: { cellId: string; itemId: string }) =>
      createAssignment({ cell_id: cellId, item_id: itemId, quantity: 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update<"assignments"> }) =>
      updateAssignment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
