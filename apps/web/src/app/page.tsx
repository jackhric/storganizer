"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { PlusIcon, ZapOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/features/items/components/item-card";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { DeleteItemDialog } from "@/features/items/components/delete-item-dialog";
import { DeviceStatusBar } from "@/features/items/components/device-status-bar";
import { SelectionBar } from "@/features/items/components/selection-bar";
import { TagsFilter } from "@/features/tags/components/tags-filter";
import { DevicesFilter } from "@/features/devices/components/devices-filter";
import { useItems } from "@/features/items/hooks/use-items";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useFindStore } from "@/lib/stores/find";
import type { WarlsFrame } from "@/lib/wled/use-warls";
import type { Rgb } from "@/lib/color/oklch";
import type { ItemsTyped } from "@/types/items";

const HIGHLIGHT_COLOR: Rgb = { r: 255, g: 140, b: 0 };

export default function HomePage() {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeDevices, setActiveDevices] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemsTyped | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<ItemsTyped | null>(null);

  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: devices } = useDevices();
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => {
      const cols = window
        .getComputedStyle(el)
        .gridTemplateColumns.split(" ")
        .filter(Boolean).length;
      setColumns(cols);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemsLoading]);
  const selections = useFindStore((s) => s.selections);
  const toggleSelection = useFindStore((s) => s.toggle);
  const removeSelection = useFindStore((s) => s.remove);
  const clearSelections = useFindStore((s) => s.clear);

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
    const deviceSet = new Set(activeDevices);
    return items.filter((item) => {
      if (activeTags.length > 0) {
        if (!Array.isArray(item.tags)) return false;
        const tags = item.tags as string[];
        if (!activeTags.every((t) => tags.includes(t))) return false;
      }
      if (deviceSet.size > 0) {
        const assignments = item.expand?.assignments_via_item_id ?? [];
        const onDevice = assignments.some((a) => {
          const id = a.expand?.cell_id?.device_id;
          return id ? deviceSet.has(id) : false;
        });
        if (!onDevice) return false;
      }
      return true;
    });
  }, [items, activeTags, activeDevices]);

  function handleFind(item: ItemsTyped) {
    if (selections.has(item.id)) {
      removeSelection(item.id);
      return;
    }
    const frame: WarlsFrame = new Map();
    for (const a of item.expand?.assignments_via_item_id ?? []) {
      const cell = a.expand?.cell_id;
      if (!cell) continue;
      let perDevice = frame.get(cell.device_id);
      if (!perDevice) {
        perDevice = new Map();
        frame.set(cell.device_id, perDevice);
      }
      perDevice.set(cell.led_index, HIGHLIGHT_COLOR);
    }
    if (frame.size === 0) return;
    toggleSelection(item.id, frame);
  }

  const selectedItems = useMemo(() => {
    if (!items || selections.size === 0) return [];
    return items.filter((i) => selections.has(i.id)) as ItemsTyped[];
  }, [items, selections]);

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
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {items ? `${items.length} item${items.length !== 1 ? "s" : ""}` : "Loading…"}
            </p>
          </div>
          <SelectionBar items={selectedItems} />
        </div>

        <div className="flex items-center gap-3">
          {devices && <DeviceStatusBar devices={devices} />}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelections}
            disabled={selections.size === 0}
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

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <TagsFilter
          available={allTags}
          value={activeTags}
          onChange={setActiveTags}
        />
        <DevicesFilter
          devices={devices ?? []}
          value={activeDevices}
          onChange={setActiveDevices}
        />
      </div>

      {/* Items grid */}
      {itemsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {items?.length === 0 ? "No items yet" : "No items match these filters"}
          </p>
          {items?.length === 0 && (
            <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
              <PlusIcon className="h-3.5 w-3.5" />
              Add your first item
            </Button>
          )}
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item as ItemsTyped}
              onHighlight={handleFind}
              isHighlighting={selections.has(item.id)}
              onEdit={handleEdit}
              onDelete={setDeletingItem}
            />
          ))}
          {columns > 0 &&
            filtered.length % columns !== 0 &&
            Array.from({ length: columns - (filtered.length % columns) }).map((_, i) => (
              <Skeleton
                key={`placeholder-${i}`}
                className="aspect-square rounded-xl opacity-40"
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
