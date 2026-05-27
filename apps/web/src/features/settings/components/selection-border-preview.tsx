"use client";

import { useEffect, useMemo, useState } from "react";
import { ShuffleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pb } from "@/lib/api/client";
import { useItems } from "@/features/items/hooks/use-items";
import { useSelectionBorderStore } from "@/lib/stores/selection-border";

export function SelectionBorderPreview() {
  const { data: items } = useItems();
  const style = useSelectionBorderStore((s) => s.style);
  const [seed, setSeed] = useState(0);

  const pool = useMemo(() => items ?? [], [items]);
  const pick = pool.length > 0 ? pool[seed % pool.length] : null;

  useEffect(() => {
    if (pool.length > 0) setSeed(Math.floor(Math.random() * pool.length));
  }, [pool.length]);

  const imageUrl =
    pick && pick.image
      ? pb.files.getURL(pick, pick.image, { thumb: "400x400" })
      : null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4">
      <div className="relative h-32 w-32 shrink-0">
        <svg
          className="pointer-events-none absolute -inset-0.5 z-30 h-[calc(100%+0.25rem)] w-[calc(100%+0.25rem)]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <rect
            x="2"
            y="2"
            width="calc(100% - 4px)"
            height="calc(100% - 4px)"
            rx="10"
            ry="10"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            {...(style === "marching-ants"
              ? { strokeDasharray: "8 6", className: "marching-ants" }
              : {})}
          />
        </svg>
        <Card className="relative h-full w-full overflow-hidden border-border/60 bg-muted p-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={pick?.name ?? "Preview"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none text-3xl font-bold text-muted-foreground/30">
                {pick ? pick.name.slice(0, 2).toUpperCase() : "··"}
              </span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/85 via-black/55 to-transparent" />
          {pick && (
            <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-2 text-xs font-medium text-white drop-shadow-sm">
              {pick.name}
            </p>
          )}
        </Card>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Live preview of the highlight outline used when finding an item.
        </p>
        {pool.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-fit text-xs"
            onClick={() => setSeed((s) => s + 1)}
          >
            <ShuffleIcon className="h-3 w-3" />
            Shuffle
          </Button>
        )}
      </div>
    </div>
  );
}
