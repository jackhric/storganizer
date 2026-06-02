"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deterministicColor, randomTagColor, readableForeground } from "@/lib/tags";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListItemsQueryKey,
} from "@/lib/api/generated/items";
import {
  getListTagsQueryKey,
  useCreateTag,
  useListTags,
  useUpdateTag,
} from "@/lib/api/generated/tags";
import type { TagRead as Tag } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function TagInput({ value, onChange }: Props) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const { data: tags } = useListTags();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListTagsQueryKey() });
    qc.invalidateQueries({ queryKey: getListItemsQueryKey() });
  };
  const createTag = useCreateTag({ mutation: { onSuccess: invalidate } });
  const updateTag = useUpdateTag({ mutation: { onSuccess: invalidate } });

  const tagsById = useMemo(() => {
    const m = new Map<string, Tag>();
    for (const t of tags ?? []) m.set(t.id, t);
    return m;
  }, [tags]);

  const suggestions = useMemo(() => {
    if (!tags) return [];
    const lower = input.trim().toLowerCase();
    const selected = new Set(value);
    return tags
      .filter((t) => !selected.has(t.id))
      .filter((t) => !lower || t.name.toLowerCase().includes(lower));
  }, [tags, value, input]);

  async function addByName(name: string) {
    const t = name.trim();
    if (!t) {
      setInput("");
      return;
    }
    const lower = t.toLowerCase();
    const existing = tags?.find((tag) => tag.name.toLowerCase() === lower);
    if (existing) {
      if (!value.includes(existing.id)) onChange([...value, existing.id]);
      setInput("");
      return;
    }
    try {
      const created = await createTag.mutateAsync({
        data: { name: t, color: randomTagColor() },
      });
      onChange([...value, created.id]);
    } finally {
      setInput("");
    }
  }

  function addById(id: string) {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setInput("");
  }

  function removeTag(id: string) {
    onChange(value.filter((x) => x !== id));
  }

  function handleColorChange(id: string, color: string) {
    updateTag.mutate({ tagId: id, data: { color } });
  }

  const showSuggestions = focused;

  return (
    <div className="space-y-1.5">
      <Popover open={showSuggestions} onOpenChange={() => {}}>
        <PopoverTrigger
          nativeButton={false}
          render={
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addByName(input);
                }
              }}
              placeholder="Type and press Enter…"
            />
          }
        />
        <PopoverContent
          align="start"
          sideOffset={4}
          initialFocus={false}
          finalFocus={false}
          className="max-h-56 gap-0 overflow-y-auto p-1"
          style={{ width: "var(--anchor-width)" }}
        >
          {suggestions.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {input.trim()
                ? "No matching tags. Press Enter to create."
                : (tags?.length ?? 0) === 0
                  ? "No tags yet. Type one and press Enter to create."
                  : "All tags are already added."}
            </div>
          ) : (
            suggestions.map((t) => {
              const color = t.color || deterministicColor(t.name);
              return (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addById(t.id)}
                  className="flex w-full items-center gap-0 rounded-sm px-2 py-1 text-left text-sm hover:bg-muted"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                  {t.name}
                </button>
              );
            })
          )}
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((id) => {
            const tag = tagsById.get(id);
            if (!tag) return null;
            return (
              <TagBadge
                key={id}
                name={tag.name}
                color={tag.color || deterministicColor(tag.name)}
                onColorChange={(c) => handleColorChange(id, c)}
                onRemove={() => removeTag(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TagBadge({
  name,
  color,
  onColorChange,
  onRemove,
}: {
  name: string;
  color: string;
  onColorChange: (color: string) => void;
  onRemove: () => void;
}) {
  const fg = readableForeground(color);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex cursor-pointer items-center rounded-md px-2 py-0.5 text-xs font-medium outline-none ring-offset-background transition-shadow hover:ring-2 hover:ring-foreground/20"
            )}
            style={{ backgroundColor: color, color: fg }}
          />
        }
      >
        {name}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <div className="space-y-3">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            Remove from item
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
