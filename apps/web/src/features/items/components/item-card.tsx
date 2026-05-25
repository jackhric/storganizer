"use client";

import { ZapIcon, ZapOffIcon, PencilIcon, Trash2Icon, ExternalLinkIcon, AlertTriangleIcon, SearchIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    ? pb.files.getURL(item, item.image, { thumb: "400x400" })
    : null;

  const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
  const hasAssignment = (item.expand?.assignments_via_item_id?.length ?? 0) > 0;

  return (
    <div className="relative">
      {/* Marching-ants outline (while finding) — sits outside the card */}
      {isHighlighting && (
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
            strokeDasharray="8 6"
            strokeLinecap="round"
            className="marching-ants"
          />
        </svg>
      )}
    <Card
      className={cn(
        "group relative aspect-square overflow-hidden border-border/60 bg-muted p-0 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
      )}
    >
      {/* Background: image or initials */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl text-muted-foreground/20 font-bold select-none">
            {item.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {/* Bottom gradient for text legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/85 via-black/55 to-transparent" />

      {/* Top-right action bar */}
      <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        {item.store_url && (
          <a
            href={item.store_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-background/70 p-1.5 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open store link"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 bg-background/70 backdrop-blur-sm hover:bg-background"
          onClick={() => onEdit?.(item)}
          aria-label="Edit item"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 bg-background/70 backdrop-blur-sm hover:bg-background hover:text-destructive"
          onClick={() => onDelete?.(item)}
          aria-label="Delete item"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Top-left unassigned warning */}
      {!hasAssignment && (
        <div className="absolute left-1.5 top-1.5 z-10">
          <Tooltip>
            <TooltipTrigger
              aria-label="Not assigned to any location"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-background/70 text-amber-500 backdrop-blur-sm"
            >
              <AlertTriangleIcon className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Not assigned to any location</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Centered Find button (hover or active) */}
      <div
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200",
          isHighlighting
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <Button
          size="sm"
          onClick={() => onHighlight?.(item)}
          className="gap-1.5 shadow-lg"
        >
          {isHighlighting ? <ZapOffIcon className="h-3.5 w-3.5" /> : <ZapIcon className="h-3.5 w-3.5" />}
          {isHighlighting ? "Finding" : "Find"}
        </Button>
      </div>

      {/* Searching indicator (bottom-right) */}
      {isHighlighting && (
        <SearchIcon className="absolute bottom-2 right-2 z-20 h-7 w-7 text-white drop-shadow-md animate-pulse" />
      )}

      {/* Bottom text overlay: name, tags, notes */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 space-y-1 p-2.5 text-white",
          isHighlighting && "pr-11",
        )}
      >
        <p className="font-medium text-sm leading-tight line-clamp-2 drop-shadow-sm">
          {item.name}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-white/15 text-white text-[10px] px-1.5 py-0 backdrop-blur-sm border-transparent hover:bg-white/25"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge
                variant="secondary"
                className="bg-white/15 text-white text-[10px] px-1.5 py-0 backdrop-blur-sm border-transparent"
              >
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {item.notes && (
          <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed drop-shadow-sm">
            {item.notes}
          </p>
        )}
      </div>
    </Card>
    </div>
  );
}
