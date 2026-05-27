"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTag, deleteTag, getTags, updateTag, getItems, updateItemTags } from "@/lib/api";
import type { Create, Update } from "@/lib/api";
import { itemKeys } from "@/features/items/hooks/use-items";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.all });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.all });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

type ApplyArgs = { tagIds: string[]; itemIds: string[] };

export function useApplyTagsToItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tagIds, itemIds }: ApplyArgs) => {
      const items = await getItems();
      const targets = items.filter((i) => itemIds.includes(i.id));
      for (const item of targets) {
        const current = new Set(Array.isArray(item.tags) ? item.tags : []);
        for (const id of tagIds) current.add(id);
        await updateItemTags(item.id, Array.from(current));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  });
}

export function useRemoveTagsFromItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tagIds, itemIds }: ApplyArgs) => {
      const items = await getItems();
      const targets = items.filter((i) => itemIds.includes(i.id));
      const remove = new Set(tagIds);
      for (const item of targets) {
        const current = Array.isArray(item.tags) ? item.tags : [];
        const next = current.filter((id) => !remove.has(id));
        if (next.length !== current.length) {
          await updateItemTags(item.id, next);
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  });
}

type MergeArgs = { sourceId: string; targetId: string };

export function useMergeTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, targetId }: MergeArgs) => {
      if (sourceId === targetId) return;
      const items = await getItems();
      for (const item of items) {
        const current = Array.isArray(item.tags) ? item.tags : [];
        if (!current.includes(sourceId)) continue;
        const next = Array.from(
          new Set(current.map((id) => (id === sourceId ? targetId : id))),
        );
        await updateItemTags(item.id, next);
      }
      await deleteTag(sourceId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.all });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
