"use client";

import { motion } from "motion/react";
import { ZapIcon, ZapOffIcon, PencilIcon, Trash2Icon, ExternalLinkIcon, AlertTriangleIcon, SearchIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pb } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { getTagColor } from "@/lib/tags";
import { useTags } from "@/features/tags/hooks/use-tags";
import { TagDot, TagOverflowDot } from "@/features/tags/components/tag-dot";
import type { ItemsTyped } from "@/types/items";

// --- Spring tuning -----------------------------------------------------------
// Adjust these to dial in the click/hover feel.
const HOVER_SCALE = 1.01;
const HOVER_LIFT_Y = -.5;
const TAP_SCALE = 0.98;
const SPRING = { type: "spring" as const, stiffness: 800, damping: 22, mass: 0.7 };
// -----------------------------------------------------------------------------

type Props = {
  item: ItemsTyped;
  onHighlight?: (item: ItemsTyped) => void;
  isHighlighting?: boolean;
  onEdit?: (item: ItemsTyped) => void;
  onDelete?: (item: ItemsTyped) => void;
};

export function ItemCard({ item, onHighlight, isHighlighting, onEdit, onDelete }: Props) {
  const { data: allTags } = useTags();
  const imageUrl = item.image
    ? pb.files.getURL(item, item.image, { thumb: "400x400" })
    : null;

  const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
  const hasAssignment = (item.expand?.assignments_via_item_id?.length ?? 0) > 0;

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: HOVER_SCALE, y: HOVER_LIFT_Y }}
      whileTap={{ scale: TAP_SCALE }}
      transition={SPRING}
    >
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
      onClick={() => onHighlight?.(item)}
      className={cn(
        "group relative aspect-square cursor-pointer overflow-hidden border-border/60 bg-muted p-0 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
      )}
    >
      {/* Background: image or initials */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(item);
          }}
          aria-label="Edit item"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 bg-background/70 backdrop-blur-sm hover:bg-background hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(item);
          }}
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
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-background/70 text-amber-500 backdrop-blur-sm"
            >
              <AlertTriangleIcon className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Not assigned to any location</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Click-to-find hint (hover only) — top-left */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
          {isHighlighting ? (
            <ZapOffIcon className="h-3.5 w-3.5" />
          ) : (
            <ZapIcon className="h-3.5 w-3.5" />
          )}
          {isHighlighting ? "Click to clear" : "Click to find"}
        </div>
      </div>

      {/* Searching indicator (bottom-right) */}
      {isHighlighting && (
        <SearchIcon className="absolute bottom-2 right-2 z-20 h-7 w-7 text-white drop-shadow-md animate-pulse" />
      )}

    </Card>

    {/* Bottom text overlay (sibling of Card so its hover labels aren't clipped) */}
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex cursor-pointer flex-col gap-1 p-2.5 text-white",
        isHighlighting && "pr-11",
      )}
    >
      {tags.length > 0 && (
        <div className="pointer-events-auto flex items-center gap-1">
          {tags.slice(0, 2).map((tag) => (
            <TagDot key={tag} label={tag} color={getTagColor(tag, allTags)} />
          ))}
          {tags.length > 2 && (
            <TagOverflowDot
              count={tags.length - 2}
              hiddenTags={tags.slice(2).map((t) => ({ name: t, color: getTagColor(t, allTags) }))}
            />
          )}
        </div>
      )}

      <div className="group/name pointer-events-auto relative w-fit max-w-full cursor-pointer">
        <p className="font-medium text-sm leading-tight line-clamp-2 drop-shadow-sm">
          {item.name}
        </p>
        {item.notes && (
          <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 max-w-[220px] whitespace-normal rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-100 group-hover/name:opacity-100">
            {item.notes}
          </span>
        )}
      </div>
    </div>
    </motion.div>
  );
}
