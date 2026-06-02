"use client";

import { useMemo } from "react";
import { HardDriveIcon } from "lucide-react";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { cn } from "@/lib/utils";
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
