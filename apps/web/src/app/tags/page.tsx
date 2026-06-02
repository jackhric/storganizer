"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TagsTable } from "@/features/tags/components/tags-table";
import { TagBatchActions } from "@/features/tags/components/tag-batch-actions";
import { AddTagDialog } from "@/features/tags/components/add-tag-dialog";
import { useListItems } from "@/lib/api/generated/items";
import { useListTags } from "@/lib/api/generated/tags";

export default function TagsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  const { data: tags, isLoading: tagsLoading } = useListTags();
  const { data: items } = useListItems();

  const selectedTags = useMemo(
    () => (tags ?? []).filter((t) => selected.has(t.id)),
    [tags, selected],
  );

  function handleSelect(id: string, next: boolean) {
    setSelected((curr) => {
      const out = new Set(curr);
      if (next) out.add(id);
      else out.delete(id);
      return out;
    });
  }

  function handleSelectAll(next: boolean) {
    if (!tags) return;
    setSelected(next ? new Set(tags.map((t) => t.id)) : new Set());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tags ? `${tags.length} tag${tags.length !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <PlusIcon className="h-3.5 w-3.5" />
          Add tag
        </Button>
      </div>

      {selectedTags.length > 0 && (
        <TagBatchActions
          selectedTags={selectedTags}
          items={items ?? []}
          onClearSelection={() => setSelected(new Set())}
        />
      )}

      {tagsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <TagsTable
          tags={tags ?? []}
          items={items ?? []}
          selected={selected}
          onSelectChange={handleSelect}
          onSelectAll={handleSelectAll}
        />
      )}

      <AddTagDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
