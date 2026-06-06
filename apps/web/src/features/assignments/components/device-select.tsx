"use client";

import { useMemo } from "react";
import { HardDriveIcon } from "lucide-react";
import { SingleSelectFilter } from "@/components/single-select-filter";
import { DeviceIcon } from "@/features/devices/components/device-icon";
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
        leading: <DeviceIcon device={d} size={16} />,
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
