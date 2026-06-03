"use client";

import { cn } from "@/lib/utils";
import { useSelectionBorderStore } from "@/lib/stores/selection-border";

/**
 * The marching-ants (or solid) outline drawn around a selected/"found" item.
 * Absolutely positioned, so the parent must be `relative`. Rendered by both the
 * Items grid card and the search result rows so a selected item looks identical
 * in either place. `rounded` controls the corner radius to match the host.
 *
 * `overhang` draws the outline ~0.25rem outside the host on every side (used by
 * the Items grid card for a slight halo). Left off, the outline sits flush — the
 * search rows need this so the border hugs each result tightly.
 *
 * Either way the class carries a `size-*` token (`size-full` flush, `h-/w-calc`
 * overhang): cmdk's `CommandItem` coerces every descendant `<svg>` *without* a
 * `size-*` class to `size-4` (16x16), which once collapsed the outline to a
 * 16px circle pinned to the search row's top-left.
 */
export function SelectionOutline({
  rounded = 10,
  overhang = false,
}: {
  rounded?: number;
  overhang?: boolean;
}) {
  const selectionBorder = useSelectionBorderStore((s) => s.style);

  return (
    <svg
      className={cn(
        "pointer-events-none absolute z-30 block",
        overhang
          ? "-inset-0.5 h-[calc(100%+0.25rem)] w-[calc(100%+0.25rem)]"
          : "inset-0 size-full",
      )}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect
        x="2"
        y="2"
        width="calc(100% - 4px)"
        height="calc(100% - 4px)"
        rx={rounded}
        ry={rounded}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        {...(selectionBorder === "marching-ants"
          ? { strokeDasharray: "8 6", className: "marching-ants" }
          : {})}
      />
    </svg>
  );
}
