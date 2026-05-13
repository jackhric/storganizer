"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAccentStore, ACCENT_PRESETS } from "@/lib/stores/accent";

function accentColor(hue: number, chroma: number) {
  return `oklch(0.65 ${chroma} ${hue})`;
}

export default function GeneralSettingsPage() {
  const { hue, chroma, setAccent } = useAccentStore();
  const [customOpen, setCustomOpen] = useState(false);

  const isPreset = ACCENT_PRESETS.some(
    (p) => p.hue === hue && p.chroma === chroma
  );

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">General</h1>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">Accent colour</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Used for active states, buttons, and highlights throughout the app.
          </p>
        </div>

        {/* Preset swatches */}
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((preset) => {
            const active = hue === preset.hue && chroma === preset.chroma;
            return (
              <button
                key={preset.name}
                onClick={() => { setAccent(preset.hue, preset.chroma); setCustomOpen(false); }}
                title={preset.name}
                className={cn(
                  "group relative flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                  active ? "ring-foreground scale-110" : "ring-transparent hover:scale-105"
                )}
                style={{ backgroundColor: accentColor(preset.hue, preset.chroma) }}
              >
                <span className="sr-only">{preset.name}</span>
              </button>
            );
          })}

          {/* Custom button */}
          <button
            onClick={() => setCustomOpen((o) => !o)}
            title="Custom"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-all bg-muted border border-border",
              !isPreset && customOpen
                ? "ring-foreground scale-110"
                : "ring-transparent hover:scale-105"
            )}
            style={!isPreset ? { backgroundColor: accentColor(hue, chroma) } : undefined}
          >
            <SlidersHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Custom</span>
          </button>
        </div>

        {/* Custom hue slider */}
        {customOpen && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Hue</span>
                <span className="text-xs text-muted-foreground tabular-nums">{Math.round(hue)}°</span>
              </div>
              {/* Hue track gradient */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full h-2 top-1/2 -translate-y-1/2 pointer-events-none"
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
                <span className="text-xs text-muted-foreground tabular-nums">{chroma.toFixed(2)}</span>
              </div>
              <Slider
                min={0.05}
                max={0.30}
                step={0.01}
                value={[chroma]}
                onValueChange={(c) => setAccent(hue, c as number)}
              />
            </div>

            {/* Preview + reset */}
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
                className="text-xs h-7"
                onClick={() => setAccent(54, 0.18)}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
