"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { CellsResponse, DevicesResponse } from "@/lib/api/types";

type Props = {
  device: DevicesResponse;
  cells: CellsResponse[] | undefined;
  isLoading?: boolean;
};

export function GridPreview({ device, cells, isLoading }: Props) {
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
    return (
      <div className="w-full max-w-[600px]">
        <Skeleton
          className="w-full rounded-md"
          style={{ aspectRatio: `${device.grid_width} / ${device.grid_height}` }}
        />
      </div>
    );
  }

  const sortedCells = [...cells].sort((a, b) => a.led_index - b.led_index);

  return (
    <div
      className="grid w-full max-w-[600px] gap-1"
      style={{
        gridTemplateColumns: `repeat(${device.grid_width}, minmax(0, 1fr))`,
        aspectRatio: `${device.grid_width} / ${device.grid_height}`,
      }}
    >
      {sortedCells.map((cell) => (
        <div
          key={cell.id}
          className="rounded-sm border border-border bg-muted/30"
          title={`LED ${cell.led_index}`}
        />
      ))}
    </div>
  );
}
