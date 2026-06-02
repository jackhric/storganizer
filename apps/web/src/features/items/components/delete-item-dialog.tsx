"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import {
  getListItemsQueryKey,
  useDeleteItem,
} from "@/lib/api/generated/items";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

interface Props {
  item: ItemRead | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteItemDialog({ item, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useDeleteItem({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListItemsQueryKey() }),
    },
  });

  async function handleConfirm() {
    if (!item) return;
    await mutateAsync({ itemId: item.id });
    onOpenChange(false);
  }

  return (
    <AlertDialog open={!!item} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{item?.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the item. Any cell assignments for this item will also be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
