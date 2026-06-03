"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAccentStore, ACCENT_PRESETS } from "@/lib/stores/accent";
import { hslCss } from "@/lib/color/hsl";
import {
  useSelectionBorderStore,
  type SelectionBorderStyle,
} from "@/lib/stores/selection-border";
import { SettingsGroup } from "@/features/settings/components/settings-group";
import { SettingsRow } from "@/features/settings/components/settings-row";
import { SelectionBorderPreview } from "@/features/settings/components/selection-border-preview";
import { LightingSettings } from "@/features/settings/components/lighting-settings";

export default function GeneralSettingsPage() {
  const { h, s, l, autoAdjust, setAccent, setAutoAdjust } = useAccentStore();
  const { style: selectionStyle, setStyle: setSelectionStyle } =
    useSelectionBorderStore();
  const [customOpen, setCustomOpen] = useState(false);

  const isPreset = ACCENT_PRESETS.some(
    (p) => p.h === h && p.s === s && p.l === l,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">General</h1>

      <SettingsGroup label="Appearance">
        <SettingsRow
          label="Accent color"
          description="Used for active states, buttons, and highlights."
        >
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const active = h === preset.h && s === preset.s && l === preset.l;
              return (
                <button
                  key={preset.name}
                  onClick={() => {
                    setAccent(preset.h, preset.s, preset.l);
                    setCustomOpen(false);
                  }}
                  title={preset.name}
                  className={cn(
                    "group relative flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                    active
                      ? "ring-foreground scale-110"
                      : "ring-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: hslCss(preset.h, preset.s, preset.l) }}
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
              style={!isPreset ? { backgroundColor: hslCss(h, s, l) } : undefined}
            >
              <SlidersHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="sr-only">Custom</span>
            </button>
          </div>

          {customOpen && (
            <div className="space-y-5 rounded-lg border border-border bg-background p-4">
              <AccentSlider
                label="Hue"
                value={h}
                min={0}
                max={360}
                display={`${Math.round(h)}°`}
                onChange={(next) => setAccent(next, s, l)}
                trackGradient="linear-gradient(to right, hsl(0 90% 55%), hsl(60 90% 55%), hsl(120 90% 55%), hsl(180 90% 55%), hsl(240 90% 55%), hsl(300 90% 55%), hsl(360 90% 55%))"
              />
              <AccentSlider
                label="Saturation"
                value={s}
                min={0}
                max={100}
                display={`${Math.round(s)}%`}
                onChange={(next) => setAccent(h, next, l)}
                trackGradient={`linear-gradient(to right, ${hslCss(h, 0, l)}, ${hslCss(h, 100, l)})`}
              />
              <AccentSlider
                label="Lightness"
                value={l}
                min={0}
                max={100}
                display={`${Math.round(l)}%`}
                onChange={(next) => setAccent(h, s, next)}
                trackGradient={`linear-gradient(to right, ${hslCss(h, s, 0)}, ${hslCss(h, s, 50)}, ${hslCss(h, s, 100)})`}
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: hslCss(h, s, l) }}
                  />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    hsl({Math.round(h)} {Math.round(s)}% {Math.round(l)}%)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() =>
                    setAccent(
                      ACCENT_PRESETS[0].h,
                      ACCENT_PRESETS[0].s,
                      ACCENT_PRESETS[0].l,
                    )
                  }
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          <label className="mt-1 flex items-center gap-2.5 text-xs text-muted-foreground">
            <Checkbox
              checked={autoAdjust}
              onCheckedChange={(checked) => setAutoAdjust(checked === true)}
            />
            <span>Auto-adjust brightness for dark mode</span>
          </label>
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

      <LightingSettings />
    </div>
  );
}

function AccentSlider({
  label,
  value,
  min,
  max,
  display,
  onChange,
  trackGradient,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  display: string;
  onChange: (next: number) => void;
  trackGradient: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {display}
        </span>
      </div>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{ background: trackGradient }}
        />
        <Slider
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={(v) => onChange(v as number)}
          className="**:data-[slot=slider-track]:bg-transparent **:data-[slot=slider-range]:bg-transparent"
        />
      </div>
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
