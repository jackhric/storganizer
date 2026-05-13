"use client";

import { useState, useMemo } from "react";
import { ZapOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/features/items/components/item-card";
import { DeviceStatusBar } from "@/features/items/components/device-status-bar";
import { useItems } from "@/features/items/hooks/use-items";
import { useDevices, useHighlightItems, useClearHighlight } from "@/features/devices/hooks/use-devices";
import type { ItemsResponse } from "@/lib/api/types";

const HIGHLIGHT_COLOR = { r: 255, g: 140, b: 0 };

export default function HomePage() {
  const [category, setCategory] = useState("All");
  const [highlightingId, setHighlightingId] = useState<string | null>(null);

  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: devices } = useDevices();
  const highlightMutation = useHighlightItems();
  const clearMutation = useClearHighlight();

  const uniqueCategories = useMemo(() => {
    if (!items) return ["All"];
    const cats = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(cats)] as string[];
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((item) =>
      category === "All" || item.category === category
    );
  }, [items, category]);

  async function handleHighlight(item: ItemsResponse) {
    setHighlightingId(item.id);
    try {
      await highlightMutation.mutateAsync({
        itemIds: [item.id],
        color: HIGHLIGHT_COLOR,
      });
    } finally {
      setHighlightingId(null);
    }
  }

  async function handleClear() {
    await clearMutation.mutateAsync(undefined);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items ? `${items.length} items` : "Loading…"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {devices && <DeviceStatusBar devices={devices} />}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={clearMutation.isPending}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ZapOffIcon className="h-3.5 w-3.5" />
            Clear LEDs
          </Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {uniqueCategories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
            className="shrink-0 text-xs h-9"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Items grid */}
      {itemsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">No items found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add your first item to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onHighlight={handleHighlight}
              isHighlighting={highlightingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
