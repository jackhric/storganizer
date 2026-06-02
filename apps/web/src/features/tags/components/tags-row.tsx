"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deterministicColor } from "@/lib/tags";
import type { TagRead as Tag } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  tag: Tag;
  itemCount: number;
  selected: boolean;
  onSelectChange: (next: boolean) => void;
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
};

export function TagsRow({
  tag,
  itemCount,
  selected,
  onSelectChange,
  onRename,
  onColorChange,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tag.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(tag.name);
  }, [tag.name]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== tag.name) onRename(next);
    else setDraft(tag.name);
  }

  const color = tag.color || deterministicColor(tag.name);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40">
      <td className="px-3 py-2 align-middle">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelectChange(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-primary"
          aria-label={`Select ${tag.name}`}
        />
      </td>
      <td className="px-3 py-2 align-middle">
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="h-5 w-5 cursor-pointer rounded-full border border-black/10 transition-shadow hover:ring-2 hover:ring-foreground/20"
                style={{ backgroundColor: color }}
                aria-label="Change color"
              />
            }
          />
          <PopoverContent align="start" className="w-56 p-3">
            <div className="space-y-1.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/60">
                Color
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
                />
                <Input
                  value={color}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) onColorChange(v);
                  }}
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="px-3 py-2 align-middle">
        {editing ? (
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              else if (e.key === "Escape") {
                setDraft(tag.name);
                setEditing(false);
              }
            }}
            className="h-8"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="cursor-text rounded-sm px-1 py-0.5 text-sm font-medium hover:bg-muted"
          >
            {tag.name}
          </button>
        )}
      </td>
      <td className="px-3 py-2 align-middle text-sm text-muted-foreground tabular-nums">
        {itemCount}
      </td>
      <td className="px-3 py-2 align-middle text-right">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`Delete ${tag.name}`}
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}
