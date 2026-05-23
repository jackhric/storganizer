"use client";

import { useState } from "react";
import { PlusIcon, PlugIcon, ChevronRightIcon, LayersIcon, GridIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddDeviceDialog } from "@/features/devices/components/add-device-dialog";
import { useDevices, useDeleteDevice, useUpdateDevice, useRefreshDevices } from "@/features/devices/hooks/use-devices";
import type { DevicesResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DeviceDetail({ device, onDeleted }: { device: DevicesResponse; onDeleted: () => void }) {
  const hasGrid = device.grid_width > 0 && device.grid_height > 0;
  const { mutate: deleteDevice, isPending: isDeleting } = useDeleteDevice();
  const { mutate: updateDevice, isPending: isRenaming } = useUpdateDevice();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(device.name);

  function startEditing() {
    setDraftName(device.name);
    setEditingName(true);
  }

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== device.name) {
      updateDevice({ id: device.id, data: { name: trimmed } });
    }
    setEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.currentTarget.blur(); }
    if (e.key === "Escape") { setDraftName(device.name); setEditingName(false); }
  }

  function handleDelete() {
    deleteDevice(device.id, { onSuccess: onDeleted });
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src="/wled_device.png"
            alt="device"
            width={40}
            height={40}
            className={cn("shrink-0", !device.is_online && "grayscale opacity-40")}
            style={{ imageRendering: "pixelated" }}
          />
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                className="w-full font-semibold text-base bg-transparent border-b border-border outline-none truncate"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleNameKeyDown}
                disabled={isRenaming}
              />
            ) : (
              <p
                className="font-semibold text-base truncate cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={startEditing}
                title="Click to rename"
              >
                {device.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground truncate">{device.url}</p>
          </div>
          <Badge variant="outline" className="ml-auto shrink-0 gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", device.is_online ? "bg-lime-500" : "bg-muted-foreground")} />
            {device.is_online ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 py-6 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hardware</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <LayersIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">LED Count</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {device.led_count > 0 ? device.led_count : "—"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <GridIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Grid</p>
            </div>
            {hasGrid ? (
              <p className="text-2xl font-semibold tabular-nums">{device.grid_width}×{device.grid_height}</p>
            ) : (
              <p className="text-xs text-muted-foreground leading-snug pt-1">No 2D matrix configured in WLED</p>
            )}
          </div>
        </div>

        {device.last_seen && (
          <>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Last seen{" "}
              <span className="text-foreground">
                {new Date(device.last_seen).toLocaleString()}
              </span>
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto px-6 py-4 border-t border-border">
        <Button variant="destructive" className="w-full" disabled={isDeleting} onClick={() => setConfirmOpen(true)}>
          Delete Device
        </Button>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {device.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the device and all its cells and assignments. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/30 px-10 py-16 text-center">
      <img
        src="/wled.png"
        alt="WLED"
        width={280}
        height={105}
        className="image-rendering-pixelated"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="max-w-sm space-y-2">
        <p className="text-sm text-muted-foreground font-medium">WLED integration</p>
      </div>
      <Separator className="max-w-xs" />
      <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
        Add your WLED devices to Storganizer to start assigning items to cells.
      </p>
    </div>
  );
}

export default function WledSettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: devices = [] } = useDevices();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshDevices();

  const selected = devices.find((d) => d.id === selectedId) ?? null;

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refresh()}
              disabled={isRefreshing || devices.length === 0}
              aria-label="Refresh devices"
              title="Refresh devices"
            >
              <RefreshCwIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
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
                  <li key={device.id}>
                    <button
                      onClick={() => setSelectedId(device.id === selectedId ? null : device.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/50",
                        selectedId === device.id && "bg-muted"
                      )}
                    >
                      <img
                        src="/wled_device.png"
                        alt="device"
                        width={32}
                        height={32}
                        className={cn("shrink-0", !device.is_online && "grayscale opacity-40")}
                        style={{ imageRendering: "pixelated" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{device.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{device.url}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", device.is_online ? "bg-lime-500" : "bg-muted-foreground")} />
                        {device.is_online ? "Online" : "Offline"}
                      </Badge>
                      <ChevronRightIcon className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", selectedId === device.id && "rotate-90")} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>

          <div className="px-6 py-4 border-t border-border">
            <Button className="w-full gap-2" variant="outline" onClick={() => setDialogOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              Add Device
            </Button>
          </div>
        </div>

        {/* Right — detail panel */}
        {selected ? <DeviceDetail device={selected} onDeleted={() => setSelectedId(null)} /> : <EmptyDetail />}
      </div>
    </>
  );
}
