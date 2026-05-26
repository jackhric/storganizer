"use client";

import { XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useFindStore } from "@/lib/stores/find";
import { pb } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ItemsTyped } from "@/types/items";

type Props = {
  items: ItemsTyped[];
};

const MAX_THUMBS = 5;

function Thumb({ item, size = "md" }: { item: ItemsTyped; size?: "sm" | "md" }) {
  const url = item.image
    ? pb.files.getURL(item, item.image, { thumb: "80x80" })
    : null;
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <div className={cn(dim, "overflow-hidden rounded-md border-2 border-background bg-muted shadow-sm")}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground/70">
          {item.name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function SelectionBar({ items }: Props) {
  const remove = useFindStore((s) => s.remove);

  if (items.length === 0) return null;

  const visible = items.slice(0, MAX_THUMBS);
  const overflow = items.length - visible.length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <div className="flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-1.5 text-xs text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted" />
        }
      >
        <span className="font-medium text-foreground/60 uppercase tracking-wider text-[10px]">
          Selected
        </span>
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex cursor-default items-center -space-x-2"
        >
          {visible.map((item) => (
            <div key={item.id} title={item.name}>
              <Thumb item={item} size="sm" />
            </div>
          ))}
          {overflow > 0 && (
            <div className="z-10 flex h-7 min-w-7 items-center justify-center rounded-md border-2 border-background bg-muted px-1 text-[10px] font-semibold text-foreground/70 shadow-sm">
              +{overflow}
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-1">
        <div className="px-2 py-1.5 text-[10px] font-medium text-foreground/60 uppercase tracking-wider">
          {items.length} selected
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
            >
              <Thumb item={item} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.name}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.name} from selection`}
              >
                <XIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
