"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItems, getItem, createItem, updateItem, deleteItem } from "@/lib/api";
import type { Create, Update } from "@/lib/api";

export const itemKeys = {
  all: ["items"] as const,
  list: (filter?: string) => ["items", "list", filter ?? ""] as const,
  detail: (id: string) => ["items", "detail", id] as const,
};

export function useItems(filter?: string) {
  return useQuery({
    queryKey: itemKeys.list(filter),
    queryFn: () => getItems(filter),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => getItem(id),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Create<"items">) => createItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update<"items"> }) =>
      updateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  });
}
