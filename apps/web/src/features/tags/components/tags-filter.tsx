"use client";

import { useMemo } from "react";
import { TagIcon } from "lucide-react";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { getTagColor } from "@/lib/tags";
import { useTags } from "../hooks/use-tags";

type Props = {
  available: string[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function TagsFilter({ available, value, onChange }: Props) {
  const { data: tags } = useTags();

  const options = useMemo(
    () =>
      available.map((name) => ({
        value: name,
        label: name,
        leading: (
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: getTagColor(name, tags) }}
          />
        ),
      })),
    [available, tags],
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
