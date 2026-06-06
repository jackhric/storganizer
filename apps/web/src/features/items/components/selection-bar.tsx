"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFindStore } from "@/lib/stores/find";
import { itemImageUrl } from "@/lib/api/urls";
import { cn } from "@/lib/utils";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  items: ItemRead[];
};

const MAX_THUMBS = 5;

function Thumb({ item, size = "md" }: { item: ItemRead; size?: "sm" | "md" }) {
  const url = item.image
    ? itemImageUrl(item.id, "80x80", item.updated_at)
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
        nativeButton={false}
        render={
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-1.5 text-xs text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted"
          />
        }
      >
        <span className="font-medium text-foreground/60 uppercase tracking-wider text-[10px]">
          Selected
        </span>
        <div className="flex items-center -space-x-2">
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
              role="button"
              tabIndex={0}
              onClick={() => remove(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  remove(item.id);
                }
              }}
              aria-label={`Remove ${item.name} from selection`}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none hover:bg-muted focus-visible:bg-muted"
            >
              <Thumb item={item} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
