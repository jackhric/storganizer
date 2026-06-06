"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion } from "motion/react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { itemImageUrl } from "@/lib/api/urls";
import { cn } from "@/lib/utils";
import type { Rgb } from "@/lib/color/hsl";
import type {
  AssignmentByDevice,
  CellRead as Cell,
  DeviceRead as Device,
  ItemWithTags,
} from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  device: Device;
  cells: Cell[] | undefined;
  isLoading?: boolean;
  assignmentsByCellId: Map<string, AssignmentByDevice>;
  cellColors: Map<number, Rgb>;
  onCellHoverChange: (ledIndex: number | null) => void;
  selectedCellId: string | null;
  onCellSelect: (cellId: string) => void;
  onEditItem: (item: ItemWithTags) => void;
  onDeleteAssignment: (assignmentId: string) => void;
};

export function GridPreview({
  device,
  cells,
  isLoading,
  assignmentsByCellId,
  cellColors,
  onCellHoverChange,
  selectedCellId,
  onCellSelect,
  onEditItem,
  onDeleteAssignment,
}: Props) {
  const hasGrid = device.grid_width > 0 && device.grid_height > 0;

  if (!hasGrid) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-10">
        <p className="max-w-sm text-center text-sm text-muted-foreground leading-relaxed">
          No grid settings found in WLED. Go to your device&apos;s WLED page and assign a grid.
        </p>
      </div>
    );
  }

  if (isLoading || !cells) {
    return <Skeleton className="h-full w-full rounded-md" />;
  }

  const sortedCells = [...cells].sort((a, b) => a.led_index - b.led_index);

  return (
    <div
      className="grid h-full w-full gap-1 max-lg:aspect-(--grid-aspect) max-lg:h-auto"
      style={{
        gridTemplateColumns: `repeat(${device.grid_width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${device.grid_height}, minmax(0, 1fr))`,
        "--grid-aspect": `${device.grid_width} / ${device.grid_height}`,
      } as React.CSSProperties}
      onMouseLeave={() => onCellHoverChange(null)}
    >
      {sortedCells.map((cell) => (
        <DroppableCell
          key={cell.id}
          cell={cell}
          assignment={assignmentsByCellId.get(cell.id)}
          onHoverChange={onCellHoverChange}
          color={cellColors.get(cell.led_index) ?? null}
          isSelected={selectedCellId === cell.id}
          onSelect={onCellSelect}
          onEditItem={onEditItem}
          onDeleteAssignment={onDeleteAssignment}
        />
      ))}
    </div>
  );
}

function DroppableCell({
  cell,
  assignment,
  onHoverChange,
  color,
  isSelected,
  onSelect,
  onEditItem,
  onDeleteAssignment,
}: {
  cell: Cell;
  assignment: AssignmentByDevice | undefined;
  onHoverChange: (ledIndex: number | null) => void;
  color: Rgb | null;
  isSelected: boolean;
  onSelect: (cellId: string) => void;
  onEditItem: (item: ItemWithTags) => void;
  onDeleteAssignment: (assignmentId: string) => void;
}) {
  const item = assignment?.item;

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `cell-${cell.id}`,
    data: { cellId: cell.id },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `cell-drag-${cell.id}`,
    data: { fromCellId: cell.id, itemId: item?.id },
    disabled: !item,
  });

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  const rgb = color ? `rgb(${color.r}, ${color.g}, ${color.b})` : null;

  const cellNode = (
    <motion.div
      ref={setNodeRef}
      {...(item ? listeners : {})}
      {...(item ? attributes : {})}
      title={`LED ${cell.led_index}`}
      onMouseEnter={() => onHoverChange(cell.led_index)}
      onClick={() => onSelect(cell.id)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 900, damping: 22, mass: 0.6 }}
      className={cn(
        "group relative rounded-sm border transition-colors select-none touch-none",
        item ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        item
          ? "border-border bg-card"
          : "border-border bg-muted/30",
        isOver && "ring-2 ring-primary ring-offset-1 border-primary",
        isSelected && !isOver && "ring-2 ring-cyan-400 ring-offset-1",
        isDragging && "opacity-40"
      )}
      style={
        rgb && !item
          ? { backgroundColor: rgb }
          : !item
            ? { backgroundImage: "var(--cell-gradient)" }
            : undefined
      }
    >
      {item && <CellContent item={item} />}
      {/* Inset ring overlay mirrors the LED color for occupied cells. */}
      {rgb && item && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-sm"
          style={{ boxShadow: `inset 0 0 0 3px ${rgb}` }}
        />
      )}
    </motion.div>
  );

  // Only occupied cells get a right-click menu — there's nothing to act on in
  // an empty cell. The trigger renders the cell itself so no extra layout
  // wrapper disturbs the grid.
  if (!item) return cellNode;

  return (
    <ContextMenu>
      <ContextMenuTrigger render={cellNode} />
      <ContextMenuContent>
        {/* Read-only header: which cell was clicked and what's in it. */}
        <div className="px-1.5 py-1 select-none">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">LED {cell.led_index}</p>
        </div>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="cursor-pointer"
          onClick={() => onEditItem(item)}
        >
          <PencilIcon />
          Edit Item
        </ContextMenuItem>
        {assignment && (
          <ContextMenuSeparator />
        )}
        {assignment && (
          <ContextMenuItem
            className="cursor-pointer"
            variant="destructive"
            onClick={() => onDeleteAssignment(assignment.id)}
          >
            <Trash2Icon />
            Delete Assignment
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function CellContent({ item }: { item: ItemWithTags }) {
  const imageUrl = item.image
    ? itemImageUrl(item.id, "400x400", item.updated_at)
    : null;

  return (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover rounded-sm pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-muted-foreground/60 select-none">
            {item.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 px-1 pt-3 pb-0.5 rounded-b-sm",
          imageUrl && "bg-linear-to-t from-black/75 via-black/40 to-transparent"
        )}
      >
        <p
          className={cn(
            "truncate text-center text-[10px] font-medium leading-tight select-none mb-1",
            imageUrl ? "text-white" : "text-foreground/80"
          )}
        >
          {item.name}
        </p>
      </div>
    </>
  );
}
