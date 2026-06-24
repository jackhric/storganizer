"use client";

import { useState } from "react";
import { MousePointerClickIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { itemImageUrl } from "@/lib/api/urls";
import type {
  AssignmentByDevice,
  CellRead as Cell,
  DeviceRead as Device,
} from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  device: Device | null;
  selectedCell: Cell | null;
  assignment: AssignmentByDevice | undefined;
  onUpdateQuantity: (assignmentId: string, quantity: number) => void;
  onRemoveAssignment: (assignmentId: string) => void;
};

export function CellInfoPane({
  device,
  selectedCell,
  assignment,
  onUpdateQuantity,
  onRemoveAssignment,
}: Props) {
  return (
    <div className="flex flex-col lg:w-[340px] shrink-0">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="font-semibold text-base">Cell</h2>
      </div>

      {!selectedCell ? <EmptySelection /> : (
        <div className="flex flex-1 flex-col">
          <LedSummary device={device} cell={selectedCell} />
          <Separator />
          {assignment ? (
            <OccupiedDetails
              assignment={assignment}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveAssignment={onRemoveAssignment}
            />
          ) : (
            <EmptyCellHint />
          )}
        </div>
      )}
    </div>
  );
}

function EmptySelection() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center gap-4">
      <div className="rounded-full bg-muted p-5">
        <MousePointerClickIcon className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold">No cell selected</h3>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Click a cell in the grid to see its assignment and edit details.
        </p>
      </div>
    </div>
  );
}

function LedSummary({ device, cell }: { device: Device | null; cell: Cell }) {
  const width = device?.grid_width ?? 0;
  const row = width > 0 ? Math.floor(cell.led_index / width) : null;
  const col = width > 0 ? cell.led_index % width : null;

  return (
    <div className="px-6 py-5 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">LED</p>
      <p className="text-2xl font-semibold tabular-nums">LED {cell.led_index}</p>
      {row !== null && col !== null && (
        <p className="text-xs text-muted-foreground">
          Row {row + 1}, Col {col + 1}
        </p>
      )}
    </div>
  );
}

function EmptyCellHint() {
  return (
    <div className="px-6 py-8 text-center">
      <p className="text-sm font-medium">Empty cell</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
        Drag an item from the left onto this cell to assign it.
      </p>
    </div>
  );
}

function OccupiedDetails({
  assignment,
  onUpdateQuantity,
  onRemoveAssignment,
}: {
  assignment: AssignmentByDevice;
  onUpdateQuantity: (assignmentId: string, quantity: number) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}) {
  const item = assignment.item;
  const imageUrl = item?.image
    ? itemImageUrl(item.id, "200x200", item.updated_at)
    : null;

  // Local draft so the user can type freely; commit on blur or Enter.
  const [draft, setDraft] = useState(String(assignment.quantity));

  // Re-sync the draft when the assignment or its quantity changes (e.g. a new
  // cell is selected, or the quantity is updated elsewhere), without an effect:
  // adjust state during render when the source value changes.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const sourceKey = `${assignment.id}:${assignment.quantity}`;
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);
  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    setDraft(String(assignment.quantity));
  }

  function commit() {
    const next = Number.parseInt(draft, 10);
    if (Number.isNaN(next) || next < 1) {
      setDraft(String(assignment.quantity));
      return;
    }
    if (next !== assignment.quantity) {
      onUpdateQuantity(assignment.id, next);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item?.name ?? ""}
              draggable={false}
              className="h-full w-full bg-white object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm font-bold text-muted-foreground/40 select-none">
                {item?.name.slice(0, 2).toUpperCase() ?? "??"}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm leading-tight">{item?.name ?? "Unknown item"}</p>
          {(item?.tags?.length ?? 0) > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item!.tags!.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cell-quantity" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Quantity
        </Label>
        <Input
          id="cell-quantity"
          type="number"
          min={1}
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setDraft(String(assignment.quantity));
              e.currentTarget.blur();
            }
          }}
        />
      </div>

      <div className="mt-auto">
        <Button
          variant="destructive"
          className="w-full gap-1.5"
          onClick={() => onRemoveAssignment(assignment.id)}
        >
          <Trash2Icon className="h-3.5 w-3.5" />
          Remove from cell
        </Button>
      </div>
    </div>
  );
}
