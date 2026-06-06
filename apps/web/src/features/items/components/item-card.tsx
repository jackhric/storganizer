"use client";

import { useState, type DragEvent } from "react";
import { motion } from "motion/react";
import { ZapIcon, ZapOffIcon, PencilIcon, Trash2Icon, ExternalLinkIcon, SearchIcon, ImageIcon, Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { itemImageUrl } from "@/lib/api/urls";
import { cn } from "@/lib/utils";
import { deterministicColor } from "@/lib/tags";
import { SelectionOutline } from "@/features/items/components/selection-outline";
import { useUpdateItem } from "@/features/items/hooks/use-items";
import { TagDot, TagOverflowDot } from "@/features/tags/components/tag-dot";
import type { ItemRead } from "@/lib/api/generated/storganizerAPI.schemas";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// --- Spring tuning -----------------------------------------------------------
// Adjust these to dial in the click/hover feel.
const HOVER_SCALE = 1.01;
const HOVER_LIFT_Y = -.5;
const TAP_SCALE = 0.98;
const SPRING = { type: "spring" as const, stiffness: 800, damping: 22, mass: 0.7 };
// Dedicated spring for the unassigned warning's corner→center glide — bouncier/slower than the card lift.
const WARNING_SPRING = { type: "spring" as const, stiffness: 800, damping: 40, mass: 0.9 };
// -----------------------------------------------------------------------------

type Props = {
  item: ItemRead;
  onHighlight?: (item: ItemRead) => void;
  isHighlighting?: boolean;
  onEdit?: (item: ItemRead) => void;
  onDelete?: (item: ItemRead) => void;
};

export function ItemCard({ item, onHighlight, isHighlighting, onEdit, onDelete }: Props) {
  const imageUrl = item.image
    ? itemImageUrl(item.id, "400x400", item.updated_at)
    : null;

  const tags = item.tags ?? [];
  const hasAssignment = (item.assignments ?? []).length > 0;

  const updateItem = useUpdateItem();
  const [fileDragOver, setFileDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  function isFileDrag(e: DragEvent<HTMLDivElement>): boolean {
    return Array.from(e.dataTransfer.types).includes("Files");
  }

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setFileDragOver(true);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setFileDragOver(false);
  }

  async function onDrop(e: DragEvent<HTMLDivElement>) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setFileDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setDropError("Not an image");
      window.setTimeout(() => setDropError(null), 2000);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setDropError(`Too large (max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB)`);
      window.setTimeout(() => setDropError(null), 2500);
      return;
    }

    try {
      await updateItem.mutateAsync({ id: item.id, payload: { image: file } });
    } catch {
      setDropError("Upload failed");
      window.setTimeout(() => setDropError(null), 2500);
    }
  }

  const isUploading = updateItem.isPending;

  return (
    <motion.div
      className="relative"
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{ rest: { scale: 1, y: 0 }, hover: { scale: HOVER_SCALE, y: HOVER_LIFT_Y } }}
      whileTap={{ scale: TAP_SCALE }}
      transition={SPRING}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Marching-ants outline (while finding) — sits outside the card */}
      {isHighlighting && <SelectionOutline overhang />}
    <Card
      onClick={() => onHighlight?.(item)}
      className={cn(
        "group relative aspect-square cursor-pointer overflow-hidden border-border/60 bg-muted p-0 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        fileDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      {/* Background: image or initials */}
      {imageUrl ? (
        <motion.img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          variants={
            !hasAssignment
              ? {
                  rest: { filter: "grayscale(1) blur(0px) brightness(1)" },
                  hover: { filter: "grayscale(1) blur(4px) brightness(0.6)" },
                }
              : undefined
          }
          transition={{ duration: 0.12, ease: "easeOut" }}
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

      {/* Click-to-find hint (hover only) — top-left. Hidden for unassigned items, whose hover cue is the blur. */}
      {hasAssignment && (
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
      )}

      {/* Searching indicator (bottom-right) */}
      {isHighlighting && (
        <SearchIcon className="absolute bottom-2 right-2 z-20 h-7 w-7 text-white drop-shadow-md animate-pulse" />
      )}

      {/* Unassigned warning — rests bottom-right, glides to center on hover. Hidden while searching. */}
      {!hasAssignment && !isHighlighting && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center @container-size">
          {/* At rest the icon is translated to the bottom-right corner; on hover it eases back to center. */}
          <motion.div
            variants={{
              rest: { x: "calc(50cqw - 1.375rem)", y: "calc(50cqh - 1.375rem)", scale: 1 },
              hover: { x: 0, y: 0, scale: 2 },
            }}
            transition={WARNING_SPRING}
          >
            <AlertTriangleIcon className="h-7 w-7 text-yellow-400 drop-shadow-md" />
          </motion.div>

          {/* Label below the centered icon — fades in only after the triangle has settled. */}
          <motion.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-7 whitespace-nowrap text-sm font-bold text-white drop-shadow-md"
            variants={{
              // Fade in after the icon settles; fade out almost immediately (no delay, quick duration).
              rest: { opacity: 0, transition: { duration: 0.06, ease: "easeOut" } },
              hover: { opacity: 1, transition: { duration: 0.18, ease: "easeOut", delay: 0.22 } },
            }}
            initial={false}
          >
            Item Unassigned
          </motion.span>
        </div>
      )}

      {/* File drag-over overlay */}
      {fileDragOver && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-primary/15 backdrop-blur-[2px]">
          <ImageIcon className="h-8 w-8 text-white drop-shadow-md" />
          <p className="text-xs font-medium text-white drop-shadow-md">Drop to replace image</p>
        </div>
      )}

      {/* Uploading overlay */}
      {isUploading && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
          <Loader2Icon className="h-6 w-6 animate-spin text-foreground" />
        </div>
      )}

      {/* Drop error toast */}
      {dropError && (
        <div className="pointer-events-none absolute inset-x-2 top-2 z-30 rounded-md bg-destructive px-2 py-1 text-center text-xs font-medium text-destructive-foreground shadow-md">
          {dropError}
        </div>
      )}

    </Card>

    {/* Bottom text overlay (sibling of Card so its hover labels aren't clipped) */}
    <motion.div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex cursor-pointer flex-col gap-1 p-2.5 text-white",
        // Reserve room for whichever bottom-right icon is showing: the search pulse or the unassigned warning.
        (isHighlighting || !hasAssignment) && "pr-11",
      )}
      // Unassigned cards fade their title out on hover so the centered warning stands alone.
      variants={
        !hasAssignment ? { rest: { opacity: 1 }, hover: { opacity: 0 } } : undefined
      }
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      {tags.length > 0 && (
        <div className="pointer-events-auto flex items-center gap-1">
          {tags.slice(0, 2).map((tag) => (
            <TagDot key={tag.id} label={tag.name} color={tag.color || deterministicColor(tag.name)} />
          ))}
          {tags.length > 2 && (
            <TagOverflowDot
              count={tags.length - 2}
              hiddenTags={tags.slice(2).map((t) => ({ name: t.name, color: t.color || deterministicColor(t.name) }))}
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
    </motion.div>
    </motion.div>
  );
}
