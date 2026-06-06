"use client";

import { useRef, useState } from "react";
import { MoreHorizontalIcon, Loader2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getListDevicesQueryKey,
  useSetDeviceIcon,
} from "@/lib/api/generated/devices";
import type { DeviceRead } from "@/lib/api/generated/storganizerAPI.schemas";
import { DEVICE_ICON_PRESETS } from "@/features/devices/icons";
import { DeviceIcon } from "@/features/devices/components/device-icon";

const DEVICES_KEY = getListDevicesQueryKey();

/**
 * Click the device's header icon to open a 4x4 grid: 15 preset tiles plus a
 * "…" tile that opens the file picker for a custom upload. Both paths upload an
 * image to the backend the same way — presets just fetch their bundled bytes
 * first.
 */
export function DeviceIconPicker({ device }: { device: DeviceRead }) {
  const [open, setOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { mutate, isPending } = useSetDeviceIcon({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: DEVICES_KEY });
        setOpen(false);
      },
    },
  });

  function upload(image: Blob) {
    mutate({ deviceId: device.id, data: { image } });
  }

  async function selectPreset(src: string) {
    const blob = await fetch(src).then((r) => r.blob());
    upload(blob);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = ""; // allow re-selecting the same file
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="shrink-0 cursor-pointer rounded-md outline-none ring-offset-2 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Change device icon"
        title="Change icon"
      >
        <DeviceIcon device={device} size={40} />
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="relative grid grid-cols-4 gap-2.5">
          {DEVICE_ICON_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={isPending}
              onClick={() => selectPreset(preset.src)}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-border bg-muted/30 transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-50"
              title={preset.key}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preset.src}
                alt={preset.key}
                width={32}
                height={32}
                className="object-contain"
                style={{ width: 32, height: 32, imageRendering: "pixelated" }}
              />
            </button>
          ))}

          {/* 16th cell — custom upload */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => fileInput.current?.click()}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-50"
            title="Upload custom icon"
          >
            <MoreHorizontalIcon className="h-5 w-5" />
          </button>

          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </PopoverContent>
    </Popover>
  );
}
