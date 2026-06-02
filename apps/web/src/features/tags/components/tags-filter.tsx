"use client";

import { useMemo } from "react";
import { TagIcon } from "lucide-react";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { deterministicColor } from "@/lib/tags";
import type { TagRead as Tag } from "@/lib/api/generated/storganizerAPI.schemas";

type Props = {
  available: Tag[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function TagsFilter({ available, value, onChange }: Props) {
  const options = useMemo(
    () =>
      available.map((t) => ({
        value: t.id,
        label: t.name,
        leading: (
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: t.color || deterministicColor(t.name) }}
          />
        ),
      })),
    [available],
  );

  return (
    <MultiSelectFilter
      label="Tags"
      icon={TagIcon}
      options={options}
      value={value}
      onChange={onChange}
      emptyMessage="No tags found."
    />
  );
}
