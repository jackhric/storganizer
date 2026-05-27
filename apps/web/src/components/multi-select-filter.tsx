"use client";

import { ChevronDownIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type MultiSelectOption = {
  value: string;
  label: string;
  leading?: React.ReactNode;
};

type Props = {
  label: string;
  icon: LucideIcon;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function MultiSelectFilter({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  searchPlaceholder,
  emptyMessage = "No results.",
}: Props) {
  const selected = new Set(value);
  const count = value.length;

  function toggle(v: string) {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="h-9 gap-1.5">
            <Icon className="text-muted-foreground" />
            {count > 0 ? `${label} (${count})` : label}
            <ChevronDownIcon className="opacity-60" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-0">
        <Command className="**:data-[slot=input-group]:border-input">
          <CommandInput placeholder={searchPlaceholder ?? `Filter ${label.toLowerCase()}…`} />
          <CommandList className="mt-2">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {options.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                onSelect={() => toggle(opt.value)}
                data-checked={selected.has(opt.value)}
                className="cursor-pointer border border-transparent data-selected:border-input"
              >
                {opt.leading}
                <span className="truncate">{opt.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
