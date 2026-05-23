"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DevicesResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Props = {
  devices: DevicesResponse[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function DeviceSelector({ devices, selectedId, onSelect }: Props) {
  const hasDevices = !!devices && devices.length > 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Device
      </span>
      <Select
        value={selectedId ?? ""}
        onValueChange={(value) => { if (value) onSelect(value); }}
        disabled={!hasDevices}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder={hasDevices ? "Select a device…" : "No devices available"} />
        </SelectTrigger>
        <SelectContent>
          {devices?.map((device) => (
            <SelectItem key={device.id} value={device.id}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    device.is_online ? "bg-lime-500" : "bg-muted-foreground"
                  )}
                />
                <span className="truncate">{device.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
