"use client";

import { useMemo } from "react";
import { HardDriveIcon } from "lucide-react";
import { SingleSelectFilter } from "@/components/single-select-filter";
import { cn } from "@/lib/utils";
import type { DeviceRead as Device } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  devices: Device[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Device picker for the assignments grid. Single-select sibling of the items
 * page's DevicesFilter — same Popover + Command look and per-device leading
 * icon, but you pick exactly one device to view.
 */
export function DeviceSelect({ devices, selectedId, onSelect }: Props) {
  const options = useMemo(
    () =>
      (devices ?? []).map((d) => ({
        value: d.id,
        label: d.name,
        leading: (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/wled_device.png"
            alt=""
            width={16}
            height={16}
            className={cn("shrink-0", !d.is_online && "grayscale opacity-40")}
            style={{ imageRendering: "pixelated" }}
          />
        ),
      })),
    [devices],
  );

  return (
    <SingleSelectFilter
      label="Device"
      icon={HardDriveIcon}
      options={options}
      value={selectedId}
      onChange={onSelect}
      placeholder={options.length ? "Select a device…" : "No devices available"}
      searchPlaceholder="Filter devices…"
      emptyMessage="No devices found."
    />
  );
}
