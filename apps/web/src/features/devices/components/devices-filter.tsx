"use client";

import { useMemo } from "react";
import { HardDriveIcon } from "lucide-react";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { DeviceIcon } from "@/features/devices/components/device-icon";
import type { DeviceRead as Device } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  devices: Device[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function DevicesFilter({ devices, value, onChange }: Props) {
  const options = useMemo(
    () =>
      devices.map((d) => ({
        value: d.id,
        label: d.name,
        leading: <DeviceIcon device={d} size={16} />,
      })),
    [devices],
  );

  return (
    <MultiSelectFilter
      label="Devices"
      icon={HardDriveIcon}
      options={options}
      value={value}
      onChange={onChange}
      emptyMessage="No devices found."
    />
  );
}
