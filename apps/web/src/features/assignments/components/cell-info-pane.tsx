"use client";

import { useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { pb } from "@/lib/api/client";
import type { AssignmentsResponse, CellsResponse, DevicesResponse } from "@/lib/api/types";
import type { AssignmentWithItemExpand } from "@/lib/api/collections";

type AssignmentWithItem = AssignmentsResponse<AssignmentWithItemExpand>;

type Props = {
  device: DevicesResponse | null;
  selectedCell: CellsResponse | null;
  assignment: AssignmentWithItem | undefined;
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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium">No cell selected</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
        Click a cell in the grid to see its assignment and edit details.
      </p>
    </div>
  );
}

function LedSummary({ device, cell }: { device: DevicesResponse | null; cell: CellsResponse }) {
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
  assignment: AssignmentWithItem;
  onUpdateQuantity: (assignmentId: string, quantity: number) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}) {
  const item = assignment.expand?.item_id;
  const imageUrl = item?.image
    ? pb.files.getURL(item, item.image, { thumb: "200x200" })
    : null;

  // Local draft so the user can type freely; commit on blur or Enter.
  const [draft, setDraft] = useState(String(assignment.quantity));
  useEffect(() => {
    setDraft(String(assignment.quantity));
  }, [assignment.id, assignment.quantity]);

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
              className="h-full w-full object-cover"
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
          {Array.isArray(item?.tags) && (item.tags as string[]).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(item.tags as string[]).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
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
