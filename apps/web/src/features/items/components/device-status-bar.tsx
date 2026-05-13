"use client";

import { cn } from "@/lib/utils";
import type { DevicesResponse } from "@/lib/api/types";

type Props = {
  devices: DevicesResponse[];
};

export function DeviceStatusBar({ devices }: Props) {
  if (devices.length === 0) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/60 uppercase tracking-wider text-[10px]">Devices</span>
      {devices.map((d) => (
        <div key={d.id} className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              d.is_online ? "bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
            )}
          />
          <span className={cn(d.is_online ? "text-foreground/80" : "text-muted-foreground/50")}>
            {d.name}
          </span>
        </div>
      ))}
    </div>
  );
}
