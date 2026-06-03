"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { hslCss, hslToRgb, rgbCss, rgbToHsl, type Rgb } from "@/lib/color/hsl";

// LED-friendly presets stored as direct RGB so the swatch and the value sent to
// the strip match exactly. The first is the original default orange.
const PRESETS: { name: string; color: Rgb }[] = [
  { name: "Orange", color: { r: 255, g: 140, b: 0 } },
  { name: "Red", color: { r: 255, g: 40, b: 40 } },
  { name: "Pink", color: { r: 255, g: 70, b: 180 } },
  { name: "Purple", color: { r: 170, g: 80, b: 255 } },
  { name: "Blue", color: { r: 40, g: 120, b: 255 } },
  { name: "Cyan", color: { r: 0, g: 200, b: 220 } },
  { name: "Green", color: { r: 40, g: 220, b: 90 } },
  { name: "White", color: { r: 255, g: 255, b: 255 } },
];

function sameColor(a: Rgb, b: Rgb): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

type Props = {
  value: Rgb;
  onChange: (next: Rgb) => void;
  disabled?: boolean;
};

export function HighlightColorControl({ value, onChange, disabled }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  // The custom picker works in HSL and derives its sliders from the current
  // value, so opening it always reflects what's currently set.
  const { h, s, l } = rgbToHsl(value);

  const isPreset = PRESETS.some((p) => sameColor(p.color, value));

  // Emit an RGB value from an HSL edit, keeping the unchanged channels.
  const emit = (next: Partial<{ h: number; s: number; l: number }>) =>
    onChange(hslToRgb(next.h ?? h, next.s ?? s, next.l ?? l));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = sameColor(preset.color, value);
          return (
            <button
              key={preset.name}
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(preset.color);
                setCustomOpen(false);
              }}
              title={preset.name}
              className={cn(
                "group relative flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-all disabled:opacity-50",
                active
                  ? "ring-foreground scale-110"
                  : "ring-transparent hover:scale-105",
              )}
              style={{ backgroundColor: rgbCss(preset.color) }}
            >
              <span className="sr-only">{preset.name}</span>
            </button>
          );
        })}

        <button
          type="button"
          disabled={disabled}
          onClick={() => setCustomOpen((o) => !o)}
          title="Custom"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-all bg-muted border border-border disabled:opacity-50",
            !isPreset && customOpen
              ? "ring-foreground scale-110"
              : "ring-transparent hover:scale-105",
          )}
          style={!isPreset ? { backgroundColor: rgbCss(value) } : undefined}
        >
          <SlidersHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="sr-only">Custom</span>
        </button>
      </div>

      {customOpen && (
        <div className="space-y-5 rounded-lg border border-border bg-background p-4">
          <SliderRow
            label="Hue"
            value={h}
            min={0}
            max={360}
            step={1}
            display={`${Math.round(h)}°`}
            onChange={(next) => emit({ h: next })}
            trackGradient="linear-gradient(to right, hsl(0 90% 55%), hsl(60 90% 55%), hsl(120 90% 55%), hsl(180 90% 55%), hsl(240 90% 55%), hsl(300 90% 55%), hsl(360 90% 55%))"
          />
          <SliderRow
            label="Saturation"
            value={s}
            min={0}
            max={100}
            step={1}
            display={`${Math.round(s)}%`}
            onChange={(next) => emit({ s: next })}
            trackGradient={`linear-gradient(to right, ${hslCss(h, 0, l)}, ${hslCss(h, 100, l)})`}
          />
          <SliderRow
            label="Brightness"
            value={l}
            min={0}
            max={100}
            step={1}
            display={`${Math.round(l)}%`}
            onChange={(next) => emit({ l: next })}
            trackGradient={`linear-gradient(to right, ${hslCss(h, s, 0)}, ${hslCss(h, s, 50)}, ${hslCss(h, s, 100)})`}
          />

          <div className="flex items-center gap-2 pt-1">
            <div
              className="h-6 w-6 rounded-full border border-border"
              style={{ backgroundColor: rgbCss(value) }}
            />
            <span className="text-xs text-muted-foreground tabular-nums">
              rgb({value.r}, {value.g}, {value.b})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  trackGradient,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
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
          step={step}
          value={[value]}
          onValueChange={(v) => onChange(v as number)}
          className="**:data-[slot=slider-track]:bg-transparent **:data-[slot=slider-range]:bg-transparent"
        />
      </div>
    </div>
  );
}
