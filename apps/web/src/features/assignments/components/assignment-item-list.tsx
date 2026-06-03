"use client";

import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVerticalIcon, PackageOpenIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { itemImageUrl } from "@/lib/api/urls";
import { cn } from "@/lib/utils";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  items: ItemRead[] | undefined;
  isLoading?: boolean;
  /**
   * True while an already-assigned item is being dragged. The list doubles as a
   * "remove assignment" drop target only in this case — dragging an unassigned
   * item here is a no-op.
   */
  isAssignedDragActive?: boolean;
};

export function AssignmentItemList({
  items,
  isLoading,
  isAssignedDragActive,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);

  // The whole list is a drop target. Page-level handleDragEnd reads
  // data.current.trashZone to know a drop landed here.
  const { isOver, setNodeRef } = useDroppable({
    id: "trash-zone",
    data: { trashZone: true },
  });

  const showTrashOverlay = !!isAssignedDragActive;

  return (
    <div ref={setNodeRef} className="relative flex flex-col lg:w-[340px] shrink-0">
      {showTrashOverlay && (
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3",
            "backdrop-blur-sm transition-colors pointer-events-none",
            isOver
              ? "bg-destructive/25 ring-2 ring-inset ring-destructive"
              : "bg-background/60",
          )}
        >
          <div
            className={cn(
              "rounded-full p-5 transition-colors",
              isOver
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Trash2Icon className="h-10 w-10" />
          </div>
          <p
            className={cn(
              "text-sm font-medium transition-colors",
              isOver ? "text-destructive" : "text-muted-foreground",
            )}
          >
            Drop here to remove assignment
          </p>
        </div>
      )}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <h2 className="font-semibold text-base">Items</h2>
        <Badge variant="secondary" className="tabular-nums">
          {items?.length ?? 0}
        </Badge>
        <Button
          size="lg"
          variant="ghost"
          className="ml-auto gap-1.5"
          onClick={() => setFormOpen(true)}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <ItemFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ScrollArea className="flex-1">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-6 py-3">
                <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))}
          </ul>
        ) : !items || items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center gap-4">
            <div className="rounded-full bg-muted p-5">
              <PackageOpenIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold">No items yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your first item to start assigning them to cells.
              </p>
            </div>
            <Button onClick={() => setFormOpen(true)} size="lg" className="mt-1">
              <PlusIcon className="h-4 w-4" />
              Add your first item
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <DraggableItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}

function DraggableItemRow({ item }: { item: ItemRead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { itemId: item.id },
  });

  const imageUrl = item.image
    ? itemImageUrl(item.id, "80x80", item.updated_at)
    : null;

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 px-6 py-3 cursor-grab active:cursor-grabbing select-none touch-none",
        "hover:bg-muted/40 transition-colors",
        isDragging && "opacity-40"
      )}
    >
      <GripVerticalIcon className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground/40 select-none">
              {item.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate flex-1">{item.name}</p>
    </li>
  );
}
