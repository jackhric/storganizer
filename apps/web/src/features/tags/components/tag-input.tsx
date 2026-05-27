"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTagColor, randomTagColor, readableForeground } from "@/lib/tags";
import { useCreateTag, useTags, useUpdateTag } from "../hooks/use-tags";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function TagInput({ value, onChange }: Props) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();

  const suggestions = useMemo(() => {
    if (!tags) return [];
    const lower = input.trim().toLowerCase();
    return tags
      .filter((t) => !value.includes(t.name))
      .filter((t) => !lower || t.name.toLowerCase().includes(lower));
  }, [tags, value, input]);

  function addTag(name: string) {
    const t = name.trim().toLowerCase();
    if (!t || value.includes(t)) {
      setInput("");
      return;
    }
    if (tags && !tags.some((tag) => tag.name === t)) {
      createTag.mutate({ name: t, color: randomTagColor() });
    }
    onChange([...value, t]);
    setInput("");
  }

  function removeTag(name: string) {
    onChange(value.filter((n) => n !== name));
  }

  function handleColorChange(name: string, color: string) {
    const existing = tags?.find((t) => t.name === name);
    if (existing) {
      updateTag.mutate({ id: existing.id, data: { color } });
    } else {
      createTag.mutate({ name, color });
    }
  }

  const showSuggestions = focused && suggestions.length > 0;

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
                  addTag(input);
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
          {suggestions.map((t) => {
            const color = t.color || getTagColor(t.name, tags);
            return (
              <button
                key={t.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(t.name)}
                className="flex w-full items-center gap-0 rounded-sm px-2 py-1 text-left text-sm hover:bg-muted"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: color }}
                />
                {t.name}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((name) => (
            <TagBadge
              key={name}
              name={name}
              color={getTagColor(name, tags)}
              onColorChange={(c) => handleColorChange(name, c)}
              onRemove={() => removeTag(name)}
            />
          ))}
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
