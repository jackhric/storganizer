"use client";

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
import { useDeleteItem } from "../hooks/use-items";
import type { ItemsTyped } from "@/types/items";

interface Props {
  item: ItemsTyped | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteItemDialog({ item, onOpenChange }: Props) {
  const { mutateAsync, isPending } = useDeleteItem();

  async function handleConfirm() {
    if (!item) return;
    await mutateAsync(item.id);
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
