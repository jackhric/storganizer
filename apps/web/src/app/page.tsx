"use client";

import { useState, useMemo } from "react";
import { PlusIcon, ZapOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/features/items/components/item-card";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { DeleteItemDialog } from "@/features/items/components/delete-item-dialog";
import { DeviceStatusBar } from "@/features/items/components/device-status-bar";
import { useItems } from "@/features/items/hooks/use-items";
import { useDevices, useHighlightItems, useClearHighlight } from "@/features/devices/hooks/use-devices";
import type { ItemsTyped } from "@/types/items";

const HIGHLIGHT_COLOR = { r: 255, g: 140, b: 0 };

export default function HomePage() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [highlightingId, setHighlightingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemsTyped | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<ItemsTyped | null>(null);

  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: devices } = useDevices();
  const highlightMutation = useHighlightItems();
  const clearMutation = useClearHighlight();

  const allTags = useMemo(() => {
    if (!items) return [];
    const tagSet = new Set<string>();
    for (const item of items) {
      if (Array.isArray(item.tags)) {
        for (const tag of item.tags as string[]) tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!activeTag) return items;
    return items.filter((item) => Array.isArray(item.tags) && (item.tags as string[]).includes(activeTag));
  }, [items, activeTag]);

  async function handleHighlight(item: ItemsTyped) {
    setHighlightingId(item.id);
    try {
      await highlightMutation.mutateAsync({ itemIds: [item.id], color: HIGHLIGHT_COLOR });
    } finally {
      setHighlightingId(null);
    }
  }

  function handleEdit(item: ItemsTyped) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingItem(undefined);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items ? `${items.length} item${items.length !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {devices && <DeviceStatusBar devices={devices} />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearMutation.mutateAsync(undefined)}
            disabled={clearMutation.isPending}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ZapOffIcon className="h-3.5 w-3.5" />
            Clear LEDs
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            Add item
          </Button>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <Button
            key="all"
            variant={activeTag === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTag(null)}
            className="shrink-0 text-xs h-9"
          >
            All
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={activeTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className="shrink-0 text-xs h-9"
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

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
          <p className="text-sm font-medium text-muted-foreground">
            {items?.length === 0 ? "No items yet" : "No items match this tag"}
          </p>
          {items?.length === 0 && (
            <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
              <PlusIcon className="h-3.5 w-3.5" />
              Add your first item
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item as ItemsTyped}
              onHighlight={handleHighlight}
              isHighlighting={highlightingId === item.id}
              onEdit={handleEdit}
              onDelete={setDeletingItem}
            />
          ))}
        </div>
      )}

      <ItemFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        item={editingItem}
      />
      <DeleteItemDialog
        item={deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      />
    </div>
  );
}
