"use client";

import Image from "next/image";
import { ZapIcon, PencilIcon, Trash2Icon, ExternalLinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ItemsTyped } from "@/types/items";

type Props = {
  item: ItemsTyped;
  onHighlight?: (item: ItemsTyped) => void;
  isHighlighting?: boolean;
  onEdit?: (item: ItemsTyped) => void;
  onDelete?: (item: ItemsTyped) => void;
};

export function ItemCard({ item, onHighlight, isHighlighting, onEdit, onDelete }: Props) {
  const imageUrl = item.image
    ? pb.files.getURL(item, item.image, { thumb: "200x200" })
    : null;

  const tags: string[] = Array.isArray(item.tags) ? item.tags : [];

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

        {/* Hover actions */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-background/40 backdrop-blur-[2px]">
          <Button
            size="sm"
            onClick={() => onHighlight?.(item)}
            disabled={isHighlighting}
            className="gap-1.5 shadow-lg"
          >
            <ZapIcon className="h-3.5 w-3.5" />
            Find
          </Button>
          <div className="flex gap-1.5">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 shadow"
              onClick={() => onEdit?.(item)}
            >
              <PencilIcon className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 shadow text-destructive hover:text-destructive"
              onClick={() => onDelete?.(item)}
            >
              <Trash2Icon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight line-clamp-2">{item.name}</p>
          {item.store_url && (
            <a
              href={item.store_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {item.notes && (
          <p className={cn(
            "text-[11px] text-muted-foreground line-clamp-2 leading-relaxed",
            tags.length > 0 && "pt-0.5"
          )}>
            {item.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
