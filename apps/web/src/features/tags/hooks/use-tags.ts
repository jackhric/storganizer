"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getListItemsQueryKey,
  listItems,
  updateItemTags,
} from "@/lib/api/generated/items";
import {
  deleteTag,
  getListTagsQueryKey,
} from "@/lib/api/generated/tags";

const TAGS_KEY = getListTagsQueryKey();
const ITEMS_KEY = getListItemsQueryKey();

// ---- multi-step orchestration ---------------------------------------------
// These mutations fan out across multiple endpoints and don't map to a single
// orval-generated hook. They use orval's bare request functions internally.

type ApplyArgs = { tagIds: string[]; itemIds: string[] };

export function useApplyTagsToItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tagIds, itemIds }: ApplyArgs) => {
      const items = await listItems();
      const targets = items.filter((i) => itemIds.includes(i.id));
      for (const item of targets) {
        const current = new Set((item.tags ?? []).map((t) => t.id));
        for (const id of tagIds) current.add(id);
        await updateItemTags(item.id, { tag_ids: Array.from(current) });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useRemoveTagsFromItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tagIds, itemIds }: ApplyArgs) => {
      const items = await listItems();
      const targets = items.filter((i) => itemIds.includes(i.id));
      const remove = new Set(tagIds);
      for (const item of targets) {
        const currentIds = (item.tags ?? []).map((t) => t.id);
        const next = currentIds.filter((id) => !remove.has(id));
        if (next.length !== currentIds.length) {
          await updateItemTags(item.id, { tag_ids: next });
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

type MergeArgs = { sourceId: string; targetId: string };

export function useMergeTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, targetId }: MergeArgs) => {
      if (sourceId === targetId) return;
      const items = await listItems();
      for (const item of items) {
        const currentIds = (item.tags ?? []).map((t) => t.id);
        if (!currentIds.includes(sourceId)) continue;
        const next = Array.from(
          new Set(currentIds.map((id) => (id === sourceId ? targetId : id))),
        );
        await updateItemTags(item.id, { tag_ids: next });
      }
      await deleteTag(sourceId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAGS_KEY });
      qc.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}
