"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { pb } from "@/lib/api/client";
import type { ItemsTyped } from "@/types/items";

type Props = {
  items: ItemsTyped[] | undefined;
  isLoading?: boolean;
};

export function AssignmentItemList({ items, isLoading }: Props) {
  return (
    <div className="flex flex-col lg:w-[340px] shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <h2 className="font-semibold text-base">Items</h2>
        <Badge variant="secondary" className="tabular-nums">
          {items?.length ?? 0}
        </Badge>
      </div>

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
              <AssignmentItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}

function AssignmentItemRow({ item }: { item: ItemsTyped }) {
  const imageUrl = item.image
    ? pb.files.getURL(item, item.image, { thumb: "80x80" })
    : null;

  return (
    <li className="flex items-center gap-3 px-6 py-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
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
