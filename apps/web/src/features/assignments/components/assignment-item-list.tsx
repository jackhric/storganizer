"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVerticalIcon, PackageOpenIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { pb } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ItemsTyped } from "@/types/items";

type Props = {
  items: ItemsTyped[] | undefined;
  isLoading?: boolean;
};

export function AssignmentItemList({ items, isLoading }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col lg:w-[340px] shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <h2 className="font-semibold text-base">Items</h2>
        <Badge variant="secondary" className="tabular-nums">
          {items?.length ?? 0}
        </Badge>
        <Button
          size="sm"
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

function DraggableItemRow({ item }: { item: ItemsTyped }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { itemId: item.id },
  });

  const imageUrl = item.image
    ? pb.files.getURL(item, item.image, { thumb: "80x80" })
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
