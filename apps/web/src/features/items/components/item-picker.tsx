"use client";

import { useMemo, useState } from "react";
import { CheckIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { itemImageUrl } from "@/lib/api/urls";
import { cn } from "@/lib/utils";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  items: ItemRead[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function ItemPicker({ items, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          className="pl-8"
        />
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border border-border">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No items found.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = selected.has(item.id);
            const url = item.image
              ? itemImageUrl(item.id, "80x80", item.updated_at)
              : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted",
                  isSelected && "bg-muted",
                )}
              >
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground/60">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                {isSelected && <CheckIcon className="h-4 w-4 text-primary" />}
              </button>
            );
          })
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {value.length} of {items.length} selected
      </div>
    </div>
  );
}
