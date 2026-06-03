"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { PackageOpenIcon, PlusIcon, SearchXIcon, ZapOffIcon } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/features/items/components/item-card";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { DeleteItemDialog } from "@/features/items/components/delete-item-dialog";
import { DeviceStatusBar } from "@/features/items/components/device-status-bar";
import { SelectionBar } from "@/features/items/components/selection-bar";
import { TagsFilter } from "@/features/tags/components/tags-filter";
import { DevicesFilter } from "@/features/devices/components/devices-filter";
import { useListDevices } from "@/lib/api/generated/devices";
import { useListItems } from "@/lib/api/generated/items";
import { useListTags } from "@/lib/api/generated/tags";
import { useFindStore } from "@/lib/stores/find";
import { useFindSelection } from "@/features/items/hooks/use-find-selection";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

export default function HomePage() {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeDevices, setActiveDevices] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRead | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<ItemRead | null>(null);

  const { data: items, isLoading: itemsLoading } = useListItems();
  const { data: devices } = useListDevices();
  const { data: tags } = useListTags();
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
  const { selections, toggle: handleFind } = useFindSelection();
  const clearSelections = useFindStore((s) => s.clear);

  const filtered = useMemo(() => {
    if (!items) return [];
    const deviceSet = new Set(activeDevices);
    return items.filter((item) => {
      if (activeTags.length > 0) {
        const tagIds = (item.tags ?? []).map((t) => t.id);
        if (!activeTags.every((id) => tagIds.includes(id))) return false;
      }
      if (deviceSet.size > 0) {
        const onDevice = (item.assignments ?? []).some((a) => {
          const id = a.cell?.device_id;
          return id ? deviceSet.has(id) : false;
        });
        if (!onDevice) return false;
      }
      return true;
    });
  }, [items, activeTags, activeDevices]);

  const selectedItems = useMemo(() => {
    if (!items || selections.size === 0) return [];
    return items.filter((i) => selections.has(i.id));
  }, [items, selections]);

  function handleEdit(item: ItemRead) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingItem(undefined);
  }

  const hasDevices = devices && devices.length > 0;

  return (
    <div className="flex min-h-full flex-col gap-6">
      {/* Header row */}
      {hasDevices && (
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
            <DeviceStatusBar devices={devices} />
            <Button
              variant="ghost"
              size="lg"
              onClick={clearSelections}
              disabled={selections.size === 0}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ZapOffIcon className="h-3.5 w-3.5" />
              Clear LEDs
            </Button>
            <Button size="lg" onClick={() => setFormOpen(true)} className="gap-1.5">
              <PlusIcon className="h-3.5 w-3.5" />
              Add item
            </Button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {items && items.length > 0 && (
        <div className="flex items-center gap-2">
          <TagsFilter
            available={tags ?? []}
            value={activeTags}
            onChange={setActiveTags}
          />
          <DevicesFilter
            devices={devices ?? []}
            value={activeDevices}
            onChange={setActiveDevices}
          />
        </div>
      )}

      {/* Items grid */}
      {itemsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center gap-6">
          {devices && devices.length === 0 ? (
            <>
              <div className="rounded-full bg-muted p-7">
                <LogoMark className="h-16 w-auto text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-semibold">Welcome to Storganizer!</h2>
                <p className="max-w-md text-base text-muted-foreground">
                  Get started by adding your WLED organizer device, then come back to start adding items.
                </p>
              </div>
              <Link
                href="/settings/wled"
                className={buttonVariants({ size: "lg", className: "mt-2 h-12 px-6 text-base" })}
              >
                <PlusIcon className="h-5 w-5" />
                Add a WLED device
              </Link>
            </>
          ) : items?.length === 0 ? (
            <>
              <div className="rounded-full bg-muted p-7">
                <PackageOpenIcon className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-semibold">No items yet</h2>
                <p className="max-w-md text-base text-muted-foreground">
                  Add your first item to start organizing your inventory across devices and cells.
                </p>
              </div>
              <Button
                onClick={() => setFormOpen(true)}
                size="lg"
                className="mt-2 h-12 px-6 text-base"
              >
                <PlusIcon className="h-5 w-5" />
                Add your first item
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-7">
                <SearchXIcon className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-semibold">No items match these filters</h2>
                <p className="max-w-md text-base text-muted-foreground">
                  Try clearing some tag or device filters to see more items.
                </p>
              </div>
            </>
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
              item={item}
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
