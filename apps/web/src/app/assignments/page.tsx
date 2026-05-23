"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent, type Modifier } from "@dnd-kit/core";
import { useWledFrameSender } from "@/features/assignments/hooks/use-wled-frame-sender";
import { pb } from "@/lib/api/client";
import { AssignmentItemList } from "@/features/assignments/components/assignment-item-list";
import { CellInfoPane } from "@/features/assignments/components/cell-info-pane";
import { DeviceSelector } from "@/features/assignments/components/device-selector";
import { GridPreview } from "@/features/assignments/components/grid-preview";
import { useCellsByDevice } from "@/features/assignments/hooks/use-cells";
import {
  useAssignmentsByDevice,
  useCreateAssignment,
  useDeleteAssignment,
  useUpdateAssignment,
} from "@/features/assignments/hooks/use-assignments";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useItems } from "@/features/items/hooks/use-items";
import type { Rgb } from "@/lib/color/oklch";
import type { ItemsTyped } from "@/types/items";

const COLOR_WHITE: Rgb = { r: 255, g: 255, b: 255 };
const COLOR_ORANGE: Rgb = { r: 255, g: 140, b: 0 };
const COLOR_GREEN: Rgb = { r: 0, g: 200, b: 0 };

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
  const [activeItem, setActiveItem] = useState<ItemsTyped | null>(null);
  const [hoveredLed, setHoveredLed] = useState<number | null>(null);
  const [dragHoveredLed, setDragHoveredLed] = useState<number | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState(0);

  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: devices } = useDevices();
  const { data: cells, isLoading: cellsLoading } = useCellsByDevice(selectedDeviceId);
  const { data: assignments } = useAssignmentsByDevice(selectedDeviceId);

  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  useEffect(() => {
    if (!selectedDeviceId && devices && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  // Clear the selected cell when the device changes — cell ids are
  // device-scoped, so a stale selection makes no sense.
  useEffect(() => {
    setSelectedCellId(null);
  }, [selectedDeviceId]);

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
      const led = ledIndexByCellId.get(a.cell_id);
      if (led !== undefined) out.push(led);
    }
    return out;
  }, [assignments, ledIndexByCellId]);

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
      if (dragHoveredLed !== null) m.set(dragHoveredLed, COLOR_GREEN);
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
  }, [isDragging, occupiedLeds, hoveredLed, dragHoveredLed, selectionLed, breathPhase]);

  useWledFrameSender(selectedDeviceId, frame);

  function handleDragStart(event: DragStartEvent) {
    const itemId = event.active.data.current?.itemId as string | undefined;
    const found = (items as ItemsTyped[] | undefined)?.find((i) => i.id === itemId) ?? null;
    setActiveItem(found);
    setHoveredLed(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const cellId = event.over?.data.current?.cellId as string | undefined;
    setDragHoveredLed(cellId ? ledIndexByCellId.get(cellId) ?? null : null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    setDragHoveredLed(null);
    const { active, over } = event;
    if (!over) return;
    const itemId = active.data.current?.itemId as string | undefined;
    const cellId = over.data.current?.cellId as string | undefined;
    if (!itemId || !cellId) return;

    const existing = assignmentsByCellId.get(cellId);
    if (existing) {
      await deleteAssignment.mutateAsync(existing.id);
    }
    await createAssignment.mutateAsync({ cellId, itemId });
  }

  function handleDragCancel() {
    setActiveItem(null);
    setDragHoveredLed(null);
  }

  function toggleCellSelection(cellId: string) {
    setSelectedCellId((current) => (current === cellId ? null : cellId));
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col lg:flex-row lg:divide-x lg:divide-border -m-6">
        <AssignmentItemList
          items={items as ItemsTyped[] | undefined}
          isLoading={itemsLoading}
        />

        <div className="flex flex-1 flex-col min-h-0 border-y border-border lg:border-y-0">
          <div className="px-6 py-5 border-b border-border">
            <DeviceSelector
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
          onUpdateQuantity={(id, quantity) => updateAssignment.mutate({ id, data: { quantity } })}
          onRemoveAssignment={(id) => {
            deleteAssignment.mutate(id);
            setSelectedCellId(null);
          }}
        />
      </div>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeItem ? <ItemDragGhost item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function ItemDragGhost({ item }: { item: ItemsTyped }) {
  const imageUrl = item.image
    ? pb.files.getURL(item, item.image, { thumb: "100x100" })
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
