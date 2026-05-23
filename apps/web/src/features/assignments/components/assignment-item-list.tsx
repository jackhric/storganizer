"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVerticalIcon, PlusIcon } from "lucide-react";
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
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add items from the Inventory page to assign them.
            </p>
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
