"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { Rgb } from "@/lib/color/hsl";
import { SettingsGroup } from "@/features/settings/components/settings-group";
import { SettingsRow } from "@/features/settings/components/settings-row";
import { HighlightColorControl } from "@/features/settings/components/highlight-color-control";
import {
  useLightingSettings,
  useUpdateLightingSettings,
  type HighlightEffect,
} from "@/features/settings/hooks/use-lighting-settings";

export function LightingSettings() {
  const { settings, color, effect, isLoading } = useLightingSettings();
  const update = useUpdateLightingSettings();

  // Local color drives the picker for instant feedback; the debounced value is
  // what we persist, so dragging the slider doesn't spam the API.
  const [localColor, setLocalColor] = useState<Rgb>(color);
  const debouncedColor = useDebounce(localColor, 250);

  // Keep the picker in sync when the server value first loads or changes
  // elsewhere, without clobbering an in-progress drag.
  const draggingRef = useRef(false);
  useEffect(() => {
    if (!draggingRef.current) setLocalColor(color);
  }, [color]);

  // Persist the debounced color whenever it diverges from the saved value.
  useEffect(() => {
    if (!settings) return;
    if (
      debouncedColor.r === settings.highlight_r &&
      debouncedColor.g === settings.highlight_g &&
      debouncedColor.b === settings.highlight_b
    ) {
      draggingRef.current = false;
      return;
    }
    update.mutate({
      highlight_r: debouncedColor.r,
      highlight_g: debouncedColor.g,
      highlight_b: debouncedColor.b,
    });
    draggingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedColor]);

  return (
    <SettingsGroup
      label="LED highlight"
      description="How an item's location lights up on the LED strip when selected."
    >
      <SettingsRow
        label="Highlight color"
        description="Color the LEDs turn when you select an item."
      >
        <HighlightColorControl
          value={localColor}
          disabled={isLoading}
          onChange={(next) => {
            draggingRef.current = true;
            setLocalColor(next);
          }}
        />
      </SettingsRow>

      <SettingsRow
        label="Effect"
        description="How the highlight animates."
        control={
          <EffectToggle
            value={effect}
            disabled={isLoading}
            onChange={(next) => update.mutate({ highlight_effect: next })}
          />
        }
      />
    </SettingsGroup>
  );
}

function EffectToggle({
  value,
  onChange,
  disabled,
}: {
  value: HighlightEffect;
  onChange: (next: HighlightEffect) => void;
  disabled?: boolean;
}) {
  const options: { value: HighlightEffect; label: string }[] = [
    { value: "solid", label: "Solid" },
    { value: "blink", label: "Blink" },
    { value: "pulse", label: "Pulse" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-sm px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
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
