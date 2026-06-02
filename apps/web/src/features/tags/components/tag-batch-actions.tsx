"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ItemPicker } from "@/features/items/components/item-picker";
import {
  useApplyTagsToItems,
  useMergeTags,
  useRemoveTagsFromItems,
} from "../hooks/use-tags";
import { getListItemsQueryKey } from "@/lib/api/generated/items";
import {
  getListTagsQueryKey,
  useDeleteTag,
} from "@/lib/api/generated/tags";
import { deterministicColor } from "@/lib/tags";
import type { ItemRead, TagRead as Tag } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  selectedTags: Tag[];
  items: ItemRead[];
  onClearSelection: () => void;
};

export function TagBatchActions({ selectedTags, items, onClearSelection }: Props) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [pickedItems, setPickedItems] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  const qc = useQueryClient();
  const applyMutation = useApplyTagsToItems();
  const removeMutation = useRemoveTagsFromItems();
  const mergeMutation = useMergeTags();
  const deleteMutation = useDeleteTag({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTagsQueryKey() });
        qc.invalidateQueries({ queryKey: getListItemsQueryKey() });
      },
    },
  });

  const selectedIds = selectedTags.map((t) => t.id);
  const canMerge = selectedTags.length === 2;

  function openApply() {
    setPickedItems([]);
    setApplyOpen(true);
  }
  function openRemove() {
    setPickedItems([]);
    setRemoveOpen(true);
  }
  function openMerge() {
    if (!canMerge) return;
    setMergeTargetId(selectedTags[0].id);
    setMergeOpen(true);
  }

  async function confirmApply() {
    await applyMutation.mutateAsync({ tagIds: selectedIds, itemIds: pickedItems });
    setApplyOpen(false);
    onClearSelection();
  }

  async function confirmRemove() {
    await removeMutation.mutateAsync({ tagIds: selectedIds, itemIds: pickedItems });
    setRemoveOpen(false);
    onClearSelection();
  }

  async function confirmMerge() {
    if (!mergeTargetId) return;
    const source = selectedTags.find((t) => t.id !== mergeTargetId);
    if (!source) return;
    await mergeMutation.mutateAsync({ sourceId: source.id, targetId: mergeTargetId });
    setMergeOpen(false);
    onClearSelection();
  }

  async function confirmDelete() {
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync({ tagId: id });
    }
    setDeleteOpen(false);
    onClearSelection();
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{selectedTags.length} selected</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs text-muted-foreground"
          >
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={openApply}>
            Apply to items…
          </Button>
          <Button size="sm" variant="outline" onClick={openRemove}>
            Remove from items…
          </Button>
          <Button size="sm" variant="outline" onClick={openMerge} disabled={!canMerge}>
            Merge…
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Apply dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Apply {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} to items
            </DialogTitle>
          </DialogHeader>
          <ItemPicker items={items} value={pickedItems} onChange={setPickedItems} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApply}
              disabled={pickedItems.length === 0 || applyMutation.isPending}
            >
              {applyMutation.isPending ? "Applying…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Remove {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} from items
            </DialogTitle>
          </DialogHeader>
          <ItemPicker items={items} value={pickedItems} onChange={setPickedItems} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRemove}
              disabled={pickedItems.length === 0 || removeMutation.isPending}
            >
              {removeMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Merge tags</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Pick which tag to keep. All items tagged with the other will be re-tagged, and
            the other tag will be deleted.
          </p>
          <div className="space-y-2">
            {selectedTags.map((t) => {
              const color = t.color || deterministicColor(t.name);
              return (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  <input
                    type="radio"
                    name="merge-target"
                    checked={mergeTargetId === t.id}
                    onChange={() => setMergeTargetId(t.id)}
                    className="accent-primary"
                  />
                  <span
                    className="h-3 w-3 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                  <span>{t.name}</span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMergeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMerge} disabled={mergeMutation.isPending}>
              {mergeMutation.isPending ? "Merging…" : "Merge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected tags will be removed from all items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
