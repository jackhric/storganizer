"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent, type Modifier } from "@dnd-kit/core";
import { useWarls, type WarlsFrame } from "@/lib/wled/use-warls";
import { itemImageUrl } from "@/lib/api/urls";
import { useAssignmentsByDevice } from "@/lib/api/generated/assignments";
import { useListCells } from "@/lib/api/generated/cells";
import { useListDevices } from "@/lib/api/generated/devices";
import { useListItems } from "@/lib/api/generated/items";
import { useAssignments } from "@/features/assignments/hooks/use-assignments";
import { AssignmentItemList } from "@/features/assignments/components/assignment-item-list";
import { CellInfoPane } from "@/features/assignments/components/cell-info-pane";
import { DeviceSelect } from "@/features/assignments/components/device-select";
import { GridPreview } from "@/features/assignments/components/grid-preview";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { DeleteItemDialog } from "@/features/items/components/delete-item-dialog";
import type { Rgb } from "@/lib/color/hsl";
import type {
  ItemRead,
  ItemWithTags,
} from "@/lib/api/generated/storganizerAPI.schemas";

const COLOR_WHITE: Rgb = { r: 255, g: 255, b: 255 };
const COLOR_ORANGE: Rgb = { r: 255, g: 140, b: 0 };
const COLOR_GREEN: Rgb = { r: 0, g: 200, b: 0 };
const COLOR_PURPLE: Rgb = { r: 180, g: 60, b: 220 };

// Selection cyan breathes between SELECTION_MIN and SELECTION_MAX over a 2s
// period. The frontend recomputes the phase every frame; the WLED sender
// throttles to ~30fps so we don't spam UDP.
const SELECTION_HUE = { r: 0, g: 255, b: 255 } as const;
const SELECTION_MIN = 0.25;
const SELECTION_MAX = 1.0;
const SELECTION_PERIOD_MS = 2000;

const snapCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!draggingNodeRect || !activatorEvent) return transform;
  const pointer = activatorEvent as PointerEvent;
  const offsetX = pointer.clientX - draggingNodeRect.left;
  const offsetY = pointer.clientY - draggingNodeRect.top;
  return {
    ...transform,
    x: transform.x + offsetX - draggingNodeRect.width / 2,
    y: transform.y + offsetY - draggingNodeRect.height / 2,
  };
};

export default function AssignmentsPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ItemRead | null>(null);
  const [dragFromCellId, setDragFromCellId] = useState<string | null>(null);
  const [hoveredLed, setHoveredLed] = useState<number | null>(null);
  const [dragHoveredLed, setDragHoveredLed] = useState<number | null>(null);
  const [dragOverCellId, setDragOverCellId] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState(0);
  const [editingItem, setEditingItem] = useState<ItemRead | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemRead | null>(null);

  const { data: items, isLoading: itemsLoading } = useListItems();
  const { data: devices } = useListDevices();
  const { data: cells, isLoading: cellsLoading } = useListCells(
    { device_id: selectedDeviceId ?? "" },
    { query: { enabled: !!selectedDeviceId } },
  );
  const { data: assignments } = useAssignmentsByDevice(selectedDeviceId ?? "", {
    query: { enabled: !!selectedDeviceId },
  });

  const { occupyCell, moveOrSwap, setQuantity, removeAssignment } =
    useAssignments(selectedDeviceId, items);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // Default to the first device once devices load, without an effect: adjust
  // state during render when no device is selected yet.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (!selectedDeviceId && devices && devices.length > 0) {
    setSelectedDeviceId(devices[0].id);
  }

  // Clear the selected cell when the device changes — cell ids are
  // device-scoped, so a stale selection makes no sense. Reset during render on
  // the device-id change rather than in an effect.
  const [prevDeviceId, setPrevDeviceId] = useState(selectedDeviceId);
  if (selectedDeviceId !== prevDeviceId) {
    setPrevDeviceId(selectedDeviceId);
    setSelectedCellId(null);
  }

  // Esc clears the selection.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedCellId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedDevice = devices?.find((d) => d.id === selectedDeviceId) ?? null;
  const isDragging = activeItem !== null;

  const assignmentsByCellId = useMemo(() => {
    const map = new Map<string, NonNullable<typeof assignments>[number]>();
    for (const a of assignments ?? []) map.set(a.cell_id, a);
    return map;
  }, [assignments]);

  const ledIndexByCellId = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cells ?? []) map.set(c.id, c.led_index);
    return map;
  }, [cells]);

  const occupiedLeds = useMemo(() => {
    if (!assignments) return [] as number[];
    const out: number[] = [];
    for (const a of assignments) {
      if (a.cell_id === dragFromCellId) continue;
      const led = ledIndexByCellId.get(a.cell_id);
      if (led !== undefined) out.push(led);
    }
    return out;
  }, [assignments, ledIndexByCellId, dragFromCellId]);

  const isSwapTarget =
    dragFromCellId !== null &&
    dragOverCellId !== null &&
    dragOverCellId !== dragFromCellId &&
    assignmentsByCellId.has(dragOverCellId);

  const selectedCell = useMemo(() => {
    if (!selectedCellId || !cells) return null;
    return cells.find((c) => c.id === selectedCellId) ?? null;
  }, [selectedCellId, cells]);

  const selectedAssignment = selectedCellId
    ? assignmentsByCellId.get(selectedCellId)
    : undefined;

  // Breathing RAF — only runs while a cell is selected and nothing else
  // (hover, drag) is contending for that LED.
  const selectionLed = selectedCell?.led_index ?? null;
  const breathActive = selectionLed !== null && !isDragging && hoveredLed === null;
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!breathActive) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const phase = (elapsed % SELECTION_PERIOD_MS) / SELECTION_PERIOD_MS;
      setBreathPhase(phase);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [breathActive]);

  // Single source of truth for "what should be lit." The hook and the grid
  // overlay both read from this map, so they can't drift.
  const frame = useMemo(() => {
    const m = new Map<number, Rgb>();
    if (isDragging) {
      for (const idx of occupiedLeds) m.set(idx, COLOR_ORANGE);
      if (dragHoveredLed !== null) {
        m.set(dragHoveredLed, isSwapTarget ? COLOR_PURPLE : COLOR_GREEN);
      }
    } else if (hoveredLed !== null) {
      m.set(hoveredLed, COLOR_WHITE);
    } else if (selectionLed !== null) {
      // 0..1..0 sine wave between SELECTION_MIN and SELECTION_MAX.
      const wave = (1 - Math.cos(breathPhase * 2 * Math.PI)) / 2;
      const intensity = SELECTION_MIN + (SELECTION_MAX - SELECTION_MIN) * wave;
      m.set(selectionLed, {
        r: Math.round(SELECTION_HUE.r * intensity),
        g: Math.round(SELECTION_HUE.g * intensity),
        b: Math.round(SELECTION_HUE.b * intensity),
      });
    }
    return m;
  }, [isDragging, occupiedLeds, hoveredLed, dragHoveredLed, isSwapTarget, selectionLed, breathPhase]);

  const warlsFrame = useMemo<WarlsFrame | null>(() => {
    if (!selectedDeviceId) return null;
    const m: WarlsFrame = new Map();
    m.set(selectedDeviceId, frame);
    return m;
  }, [selectedDeviceId, frame]);
  useWarls(warlsFrame);

  function handleDragStart(event: DragStartEvent) {
    const itemId = event.active.data.current?.itemId as string | undefined;
    const fromCellId = event.active.data.current?.fromCellId as string | undefined;
    const found = items?.find((i) => i.id === itemId) ?? null;
    setActiveItem(found);
    setDragFromCellId(fromCellId ?? null);
    setHoveredLed(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const cellId = event.over?.data.current?.cellId as string | undefined;
    setDragOverCellId(cellId ?? null);
    setDragHoveredLed(cellId ? ledIndexByCellId.get(cellId) ?? null : null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    setDragFromCellId(null);
    setDragOverCellId(null);
    setDragHoveredLed(null);
    const { active, over } = event;
    if (!over) return;
    const itemId = active.data.current?.itemId as string | undefined;
    const fromCellId = active.data.current?.fromCellId as string | undefined;
    const isTrashZone = over.data.current?.trashZone === true;
    const cellId = over.data.current?.cellId as string | undefined;

    // Dragging an assigned item back onto the items list removes its
    // assignment. Only assigned items (those with a fromCellId) can be deleted
    // this way — dropping an unassigned item here is a no-op.
    if (isTrashZone) {
      if (!fromCellId) return;
      const assignment = assignmentsByCellId.get(fromCellId);
      if (assignment) removeAssignment(assignment.id);
      return;
    }

    if (!cellId) return;

    try {
      if (fromCellId) {
        await moveOrSwap(fromCellId, cellId);
        return;
      }
      if (!itemId) return;
      await occupyCell(cellId, itemId);
    } catch (error) {
      // occupyCell already self-heals a stale-cache 409 (refetch + retry);
      // anything that still throws is a genuine failure. Log rather than let
      // it surface as an unhandled promise rejection.
      console.error("assignment drop failed", error);
    }
  }

  function handleDragCancel() {
    setActiveItem(null);
    setDragFromCellId(null);
    setDragOverCellId(null);
    setDragHoveredLed(null);
  }

  function toggleCellSelection(cellId: string) {
    setSelectedCellId((current) => (current === cellId ? null : cellId));
  }

  // The grid hands back the assignment's embedded ItemWithTags; resolve it to
  // the full ItemRead the form dialog expects (falling back to the embedded
  // shape, which is a structural subset).
  function handleEditItem(item: ItemWithTags) {
    const full = items?.find((i) => i.id === item.id);
    setEditingItem(full ?? (item as ItemRead));
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col lg:h-[calc(100vh-3rem)] lg:min-h-0 lg:flex-row lg:divide-x lg:divide-border lg:overflow-hidden -m-6">
        <AssignmentItemList
          items={items}
          isLoading={itemsLoading}
          isAssignedDragActive={isDragging && dragFromCellId !== null}
          onEditItem={handleEditItem}
          onDeleteItem={setDeletingItem}
        />

        <div className="flex flex-1 flex-col min-h-0 border-y border-border lg:border-y-0">
          <div className="px-6 py-5 border-b border-border">
            <DeviceSelect
              devices={devices}
              selectedId={selectedDeviceId}
              onSelect={setSelectedDeviceId}
            />
          </div>

          <div className="flex flex-1 min-h-0 p-8">
            {selectedDevice ? (
              <GridPreview
                device={selectedDevice}
                cells={cells}
                isLoading={cellsLoading}
                assignmentsByCellId={assignmentsByCellId}
                cellColors={frame}
                onCellHoverChange={setHoveredLed}
                selectedCellId={selectedCellId}
                onCellSelect={toggleCellSelection}
                onEditItem={handleEditItem}
                onDeleteAssignment={removeAssignment}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Select a device to view its grid layout.
                </p>
              </div>
            )}
          </div>
        </div>

        <CellInfoPane
          device={selectedDevice}
          selectedCell={selectedCell}
          assignment={selectedAssignment}
          onUpdateQuantity={(id, quantity) => setQuantity(id, quantity)}
          onRemoveAssignment={(id) => {
            removeAssignment(id);
            setSelectedCellId(null);
          }}
        />
      </div>

      <ItemFormDialog
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
        item={editingItem ?? undefined}
      />

      <DeleteItemDialog
        item={deletingItem}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
      />

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeItem ? <ItemDragGhost item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function ItemDragGhost({ item }: { item: ItemRead }) {
  const imageUrl = item.image
    ? itemImageUrl(item.id, "100x100", item.updated_at)
    : null;
  return (
    <div className="h-[100px] w-[100px] overflow-hidden rounded-md border border-border bg-muted shadow-lg cursor-grabbing opacity-70">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name}
          draggable={false}
          className="h-full w-full object-cover pointer-events-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground/60 select-none">
            {item.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
