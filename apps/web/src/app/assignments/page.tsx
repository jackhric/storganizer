"use client";

import { useEffect, useState } from "react";
import { AssignmentItemList } from "@/features/assignments/components/assignment-item-list";
import { DeviceSelector } from "@/features/assignments/components/device-selector";
import { GridPreview } from "@/features/assignments/components/grid-preview";
import { useCellsByDevice } from "@/features/assignments/hooks/use-cells";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useItems } from "@/features/items/hooks/use-items";
import type { ItemsTyped } from "@/types/items";

export default function AssignmentsPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: devices } = useDevices();
  const { data: cells, isLoading: cellsLoading } = useCellsByDevice(selectedDeviceId);

  useEffect(() => {
    if (!selectedDeviceId && devices && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const selectedDevice = devices?.find((d) => d.id === selectedDeviceId) ?? null;

  return (
    <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col lg:flex-row lg:divide-x lg:divide-border -m-6">
      <AssignmentItemList
        items={items as ItemsTyped[] | undefined}
        isLoading={itemsLoading}
      />

      <div className="flex flex-1 flex-col min-h-0">
        <div className="px-6 py-5 border-b border-border">
          <DeviceSelector
            devices={devices}
            selectedId={selectedDeviceId}
            onSelect={setSelectedDeviceId}
          />
        </div>

        <div className="flex flex-1 items-start justify-center p-8">
          {selectedDevice ? (
            <GridPreview
              device={selectedDevice}
              cells={cells}
              isLoading={cellsLoading}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a device to view its grid layout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
