"use client";

import Image from "next/image";
import { ZapIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ItemsResponse } from "@/lib/api/types";

type Props = {
  item: ItemsResponse;
  onHighlight?: (item: ItemsResponse) => void;
  isHighlighting?: boolean;
};

export function ItemCard({ item, onHighlight, isHighlighting }: Props) {
  const imageUrl = item.image
    ? pb.files.getURL(item, item.image, { thumb: "200x200" })
    : null;

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      {/* Image / placeholder */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl text-muted-foreground/20 font-bold select-none">
              {item.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Highlight button — appears on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            size="sm"
            onClick={() => onHighlight?.(item)}
            disabled={isHighlighting}
            className="gap-1.5 shadow-lg"
          >
            <ZapIcon className="h-3.5 w-3.5" />
            Find
          </Button>
        </div>
      </div>

      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight line-clamp-2">{item.name}</p>
          <span className={cn(
            "shrink-0 text-xs tabular-nums font-mono text-muted-foreground",
            item.quantity === 0 && "text-destructive"
          )}>
            ×{item.quantity}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {item.category && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {item.category}
            </Badge>
          )}
        </div>

        {item.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
