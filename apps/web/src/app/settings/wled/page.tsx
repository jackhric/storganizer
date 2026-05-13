"use client";

import Image from "next/image";
import { useState } from "react";
import { PlusIcon, PlugIcon, WifiIcon, WifiOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddDeviceDialog } from "@/features/devices/components/add-device-dialog";
import { useDevices } from "@/features/devices/hooks/use-devices";

export default function WledSettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: devices = [] } = useDevices();

  return (
    <>
      <AddDeviceDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col lg:flex-row lg:divide-x lg:divide-border -m-6">
        {/* Left — device list */}
        <div className="flex flex-col lg:w-[380px] shrink-0">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">Devices</h2>
              <Badge variant="secondary" className="tabular-nums">
                {devices.length}
              </Badge>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <PlugIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No devices added</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add a WLED device to get started.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {devices.map((device) => (
                  <li
                    key={device.id}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${device.is_online ? "bg-green-500/10" : "bg-muted"}`}
                    >
                      {device.is_online ? (
                        <WifiIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOffIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {device.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {device.url}
                      </p>
                    </div>
                    <Badge
                      variant={device.is_online ? "default" : "secondary"}
                      className="shrink-0 text-xs"
                    >
                      {device.is_online ? "Online" : "Offline"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>

          <div className="px-6 py-4 border-t border-border">
            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Add Device
            </Button>
          </div>
        </div>

        {/* Right — info panel */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/30 px-10 py-16 text-center">
          <Image
            src="/wled.png"
            alt="WLED"
            width={280}
            height={105}
            className="image-rendering-pixelated"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="max-w-sm space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              WLED integration
            </p>
          </div>
          <Separator className="max-w-xs" />
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            Add your WLED devices to Storganizer to start assigning items to
            cells.
          </p>
        </div>
      </div>
    </>
  );
}
