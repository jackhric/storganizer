"use client";

import { useMemo } from "react";
import { TagsRow } from "./tags-row";
import { useQueryClient } from "@tanstack/react-query";
import { getListItemsQueryKey } from "@/lib/api/generated/items";
import {
  getListTagsQueryKey,
  useDeleteTag,
  useUpdateTag,
} from "@/lib/api/generated/tags";
import type { ItemRead, TagRead as Tag } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  tags: Tag[];
  items: ItemRead[];
  selected: Set<string>;
  onSelectChange: (id: string, next: boolean) => void;
  onSelectAll: (next: boolean) => void;
};

export function TagsTable({ tags, items, selected, onSelectChange, onSelectAll }: Props) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListTagsQueryKey() });
    qc.invalidateQueries({ queryKey: getListItemsQueryKey() });
  };
  const updateTag = useUpdateTag({ mutation: { onSuccess: invalidate } });
  const deleteTag = useDeleteTag({ mutation: { onSuccess: invalidate } });

  const itemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const t of item.tags ?? []) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const allChecked = tags.length > 0 && tags.every((t) => selected.has(t.id));
  const someChecked = !allChecked && tags.some((t) => selected.has(t.id));

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="w-10 px-3 py-2 text-left">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = someChecked;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
                aria-label="Select all tags"
              />
            </th>
            <th className="w-10 px-3 py-2" />
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Name
            </th>
            <th className="w-24 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Items
            </th>
            <th className="w-12 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {tags.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                No tags yet.
              </td>
            </tr>
          ) : (
            tags.map((tag) => (
              <TagsRow
                key={tag.id}
                tag={tag}
                itemCount={itemCounts.get(tag.id) ?? 0}
                selected={selected.has(tag.id)}
                onSelectChange={(next) => onSelectChange(tag.id, next)}
                onRename={(name) =>
                  updateTag.mutate({ tagId: tag.id, data: { name } })
                }
                onColorChange={(color) =>
                  updateTag.mutate({ tagId: tag.id, data: { color } })
                }
                onDelete={() => deleteTag.mutate({ tagId: tag.id })}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
