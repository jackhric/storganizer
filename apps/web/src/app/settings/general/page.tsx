"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAccentStore, ACCENT_PRESETS } from "@/lib/stores/accent";
import {
  useSelectionBorderStore,
  type SelectionBorderStyle,
} from "@/lib/stores/selection-border";
import { SettingsGroup } from "@/features/settings/components/settings-group";
import { SettingsRow } from "@/features/settings/components/settings-row";
import { SelectionBorderPreview } from "@/features/settings/components/selection-border-preview";

function accentColor(hue: number, chroma: number) {
  return `oklch(0.65 ${chroma} ${hue})`;
}

export default function GeneralSettingsPage() {
  const { hue, chroma, setAccent } = useAccentStore();
  const { style: selectionStyle, setStyle: setSelectionStyle } =
    useSelectionBorderStore();
  const [customOpen, setCustomOpen] = useState(false);

  const isPreset = ACCENT_PRESETS.some(
    (p) => p.hue === hue && p.chroma === chroma,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">General</h1>

      <SettingsGroup label="Appearance">
        <SettingsRow
          label="Accent colour"
          description="Used for active states, buttons, and highlights."
        >
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const active = hue === preset.hue && chroma === preset.chroma;
              return (
                <button
                  key={preset.name}
                  onClick={() => {
                    setAccent(preset.hue, preset.chroma);
                    setCustomOpen(false);
                  }}
                  title={preset.name}
                  className={cn(
                    "group relative flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                    active
                      ? "ring-foreground scale-110"
                      : "ring-transparent hover:scale-105",
                  )}
                  style={{
                    backgroundColor: accentColor(preset.hue, preset.chroma),
                  }}
                >
                  <span className="sr-only">{preset.name}</span>
                </button>
              );
            })}

            <button
              onClick={() => setCustomOpen((o) => !o)}
              title="Custom"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-all bg-muted border border-border",
                !isPreset && customOpen
                  ? "ring-foreground scale-110"
                  : "ring-transparent hover:scale-105",
              )}
              style={
                !isPreset
                  ? { backgroundColor: accentColor(hue, chroma) }
                  : undefined
              }
            >
              <SlidersHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="sr-only">Custom</span>
            </button>
          </div>

          {customOpen && (
            <div className="space-y-5 rounded-lg border border-border bg-background p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Hue</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(hue)}°
                  </span>
                </div>
                <div className="relative">
                  <div
                    className="pointer-events-none absolute inset-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        "linear-gradient(to right, oklch(0.65 0.18 0), oklch(0.65 0.18 30), oklch(0.65 0.18 60), oklch(0.65 0.18 90), oklch(0.65 0.18 120), oklch(0.65 0.18 150), oklch(0.65 0.18 180), oklch(0.65 0.18 210), oklch(0.65 0.18 240), oklch(0.65 0.18 270), oklch(0.65 0.18 300), oklch(0.65 0.18 330), oklch(0.65 0.18 360))",
                    }}
                  />
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[hue]}
                    onValueChange={(h) => setAccent(h as number, chroma)}
                    className="**:data-[slot=slider-track]:bg-transparent **:data-[slot=slider-range]:bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Chroma</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {chroma.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0.05}
                  max={0.3}
                  step={0.01}
                  value={[chroma]}
                  onValueChange={(c) => setAccent(hue, c as number)}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: accentColor(hue, chroma) }}
                  />
                  <span className="text-xs text-muted-foreground">
                    oklch(0.65 {chroma.toFixed(2)} {Math.round(hue)})
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setAccent(54, 0.18)}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </SettingsRow>

        <SettingsRow
          label="Selection border"
          description="Outline style for highlighted items."
          control={
            <SelectionBorderToggle
              value={selectionStyle}
              onChange={setSelectionStyle}
            />
          }
        >
          <SelectionBorderPreview />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

function SelectionBorderToggle({
  value,
  onChange,
}: {
  value: SelectionBorderStyle;
  onChange: (next: SelectionBorderStyle) => void;
}) {
  const options: { value: SelectionBorderStyle; label: string }[] = [
    { value: "marching-ants", label: "Marching ants" },
    { value: "solid", label: "Solid" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
