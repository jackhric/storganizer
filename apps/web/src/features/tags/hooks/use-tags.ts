"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTag, deleteTag, getTags, updateTag } from "@/lib/api";
import type { Create, Update } from "@/lib/api";

export const tagKeys = {
  all: ["tags"] as const,
  list: () => ["tags", "list"] as const,
};

export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: () => getTags(),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Create<"tags">) => createTag(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update<"tags"> }) =>
      updateTag(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}
